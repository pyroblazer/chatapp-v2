import { Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  ConnectedSocket,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { IConversationsService } from '../conversations/conversations';
import type { IFriendsService } from '../friends/friends';
import type { IGroupService } from '../groups/interfaces/group';
import { ServerEvents, Services, WebsocketEvents } from '../utils/constants';
import type { CallHistoryService } from '../calls/call-history.service';
import type { AuthenticatedSocket } from '../utils/interfaces';
import type {
  Conversation,
  Group,
  GroupMessage,
  Message,
  User,
} from '../utils/typeorm';
import type {
  AddGroupUserResponse,
  CallAcceptedPayload,
  CallHangUpPayload,
  CreateGroupMessageResponse,
  CreateMessageResponse,
  RemoveGroupUserResponse,
  VoiceCallPayload,
} from '../utils/types';
import { CreateCallDto } from './dtos/CreateCallDto';
import type { IGatewaySessionManager } from './gateway.session';
import { SocketRateLimiter } from './gateway.rate-limit';
import { RedisCacheService } from '../redis/redis.cache.service';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 15000,
})
export class MessagingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly callParticipants: Map<string, Set<string>> = new Map();
  private readonly userCallMap: Map<string, string> = new Map();

  private readonly pendingStreamCalls: Map<
    string,
    {
      callId: string;
      callType: 'video' | 'audio';
      callerId: string;
      callerName: string;
      recipientId: string;
      conversationId: string;
      initiatedAt: number;
    }
  > = new Map();

  private readonly pendingGroupCalls: Map<
    string,
    {
      callId: string;
      callType: 'video' | 'audio';
      callerId: string;
      callerName: string;
      groupId: string;
      initiatedAt: number;
    }
  > = new Map();

  private readonly typingThrottle = new Map<string, number>();
  private static readonly TYPING_THROTTLE_MS = 1000;

  constructor(
    @Inject(Services.GATEWAY_SESSION_MANAGER)
    readonly sessions: IGatewaySessionManager,
    @Inject(Services.CONVERSATIONS)
    private readonly conversationService: IConversationsService,
    @Inject(Services.GROUPS)
    private readonly groupsService: IGroupService,
    @Inject(Services.FRIENDS_SERVICE)
    private readonly friendsService: IFriendsService,
    @Inject(Services.CALL_HISTORY)
    private readonly callHistoryService: CallHistoryService,
    private readonly rateLimiter: SocketRateLimiter,
    private readonly cache: RedisCacheService,
  ) {}

  @WebSocketServer()
  server: Server;

  async handleConnection(socket: AuthenticatedSocket, ...args: any[]) {
    this.sessions.setUserSocket(socket.user.id, socket);

    // Join personal room for user-specific events (works across instances with Redis adapter)
    socket.join(`user-${socket.user.id}`);

    // Apply per-event rate limiting
    socket.use((packet, next) => {
      const [event] = packet;
      if (!this.rateLimiter.isAllowed(socket.id, event)) {
        return next(new Error('Rate limit exceeded'));
      }
      next();
    });

    socket.emit('connected', {});

    // Deliver any pending stream call that was initiated while this user was offline
    const pending = this.pendingStreamCalls.get(socket.user.id);
    if (pending) {
      socket.emit('streamCallInitiated', pending);
    }

    // Deliver any pending group calls
    const pendingGroup = this.pendingGroupCalls.get(socket.user.id);
    if (pendingGroup) {
      socket.emit('streamCallInitiated', { ...pendingGroup, groupId: pendingGroup.groupId });
      this.pendingGroupCalls.delete(socket.user.id);
    }

    await this.broadcastStatusToFriends(socket.user.id, 'online');
  }

  async handleDisconnect(socket: AuthenticatedSocket) {
    this.rateLimiter.cleanup(socket.id);
    this.sessions.setUserInCall(socket.user.id, false);
    this.sessions.removeUserSocket(socket.user.id);
    await this.broadcastStatusToFriends(socket.user.id, 'offline');
  }

  private async broadcastStatusToFriends(
    userId: string,
    status: 'online' | 'offline' | 'in-call',
  ) {
    try {
      // Try cached friends list first
      let friendIds: string[] | null = await this.cache.getCached(`user:friends:ids:${userId}`);
      if (!friendIds) {
        const friends = await this.friendsService.getFriends(userId);
        friendIds = friends.map((f) =>
          f.sender.id === userId ? f.receiver.id : f.sender.id,
        );
        await this.cache.setCache(`user:friends:ids:${userId}`, friendIds, 300);
      }
      for (const friendId of friendIds) {
        this.server.to(`user-${friendId}`).emit('onFriendStatusChange', { userId, status });
      }
    } catch {
      // non-critical
    }
  }

  @SubscribeMessage('getOnlineGroupUsers')
  async handleGetOnlineGroupUsers(
    @MessageBody() data: any,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    const group = await this.groupsService.findGroupById(data.groupId);
    if (!group) return;
    const onlineUsers = [];
    const offlineUsers = [];
    group.users.forEach((user) => {
      const s = this.sessions.getUserSocket(user.id);
      s ? onlineUsers.push(user) : offlineUsers.push(user);
    });
    socket.emit('onlineGroupUsersReceived', { onlineUsers, offlineUsers });
  }

  @SubscribeMessage('createMessage')
  handleCreateMessage(@MessageBody() _data: any) {
    // handled via event emitter
  }

  @SubscribeMessage('onConversationJoin')
  async onConversationJoin(
    @MessageBody() data: any,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    // Verify the user is a participant of this conversation
    try {
      const conversation = await this.conversationService.findById(data.conversationId);
      if (!conversation || (conversation.creator.id !== client.user.id && conversation.recipient.id !== client.user.id)) {
        return;
      }
    } catch {
      return;
    }
    client.join(`conversation-${data.conversationId}`);
    client.to(`conversation-${data.conversationId}`).emit('userJoin');
  }

  @SubscribeMessage('onConversationLeave')
  onConversationLeave(
    @MessageBody() data: any,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.leave(`conversation-${data.conversationId}`);
    client.to(`conversation-${data.conversationId}`).emit('userLeave');
  }

  @SubscribeMessage('onGroupJoin')
  async onGroupJoin(
    @MessageBody() data: any,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    // Verify the user is a member of this group
    try {
      const group = await this.groupsService.findGroupById(data.groupId);
      if (!group || !group.users.some((u) => u.id === client.user.id)) {
        return;
      }
    } catch {
      return;
    }
    client.join(`group-${data.groupId}`);
    client.to(`group-${data.groupId}`).emit('userGroupJoin');
  }

  @SubscribeMessage('onGroupLeave')
  onGroupLeave(
    @MessageBody() data: any,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.leave(`group-${data.groupId}`);
    client.to(`group-${data.groupId}`).emit('userGroupLeave');
  }

  @SubscribeMessage('onTypingStart')
  onTypingStart(
    @MessageBody() data: any,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const key = `${client.user.id}:${data.conversationId || data.groupId}`;
    const now = Date.now();
    const lastEmit = this.typingThrottle.get(key) || 0;
    if (now - lastEmit < MessagingGateway.TYPING_THROTTLE_MS) return;
    this.typingThrottle.set(key, now);

    if (data.conversationId) {
      client.to(`conversation-${data.conversationId}`).emit('onTypingStart');
    } else if (data.groupId) {
      client.to(`group-${data.groupId}`).emit('onTypingStart');
    }
  }

  @SubscribeMessage('onTypingStop')
  onTypingStop(
    @MessageBody() data: any,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (data.conversationId) {
      client.to(`conversation-${data.conversationId}`).emit('onTypingStop');
    } else if (data.groupId) {
      client.to(`group-${data.groupId}`).emit('onTypingStop');
    }
  }

  // --- Event-driven message delivery via user rooms (multi-instance safe) ---

  @OnEvent('message.create')
  handleMessageCreateEvent(payload: CreateMessageResponse) {
    const {
      author,
      conversation: { creator, recipient },
    } = payload.message;

    // Emit to both users' personal rooms — works across instances via Redis adapter
    this.server.to(`user-${creator.id}`).emit('onMessage', payload);
    this.server.to(`user-${recipient.id}`).emit('onMessage', payload);
  }

  @OnEvent('conversation.create')
  handleConversationCreateEvent(payload: Conversation) {
    this.server.to(`user-${payload.recipient.id}`).emit('onConversation', payload);
  }

  @OnEvent('message.delete')
  async handleMessageDelete(payload) {
    const conversation = await this.conversationService.findById(
      payload.conversationId,
    );
    if (!conversation) return;
    const { creator, recipient } = conversation;
    const recipientId = creator.id === payload.userId ? recipient.id : creator.id;
    this.server.to(`user-${recipientId}`).emit('onMessageDelete', payload);
  }

  @OnEvent('message.update')
  async handleMessageUpdate(message: Message) {
    const {
      author,
      conversation: { creator, recipient },
    } = message;
    this.server.to(`user-${creator.id}`).emit('onMessageUpdate', message);
    this.server.to(`user-${recipient.id}`).emit('onMessageUpdate', message);
  }

  @OnEvent('group.message.create')
  async handleGroupMessageCreate(payload: CreateGroupMessageResponse) {
    const { id } = payload.group;
    this.server.to(`group-${id}`).emit('onGroupMessage', payload);
  }

  @OnEvent('group.create')
  handleGroupCreate(payload: Group) {
    payload.users.forEach((user) => {
      this.server.to(`user-${user.id}`).emit('onGroupCreate', payload);
    });
  }

  @OnEvent('group.message.update')
  handleGroupMessageUpdate(payload: GroupMessage) {
    const room = `group-${payload.group.id}`;
    this.server.to(room).emit('onGroupMessageUpdate', payload);
  }

  @OnEvent('group.user.add')
  handleGroupUserAdd(payload: AddGroupUserResponse) {
    this.server
      .to(`group-${payload.group.id}`)
      .emit('onGroupReceivedNewUser', payload);
    this.server.to(`user-${payload.user.id}`).emit('onGroupUserAdd', payload);
  }

  @OnEvent('group.user.remove')
  handleGroupUserRemove(payload: RemoveGroupUserResponse) {
    const { group } = payload;
    const ROOM_NAME = `group-${payload.group.id}`;
    // Emit to the removed user via their personal room
    this.server.to(`user-${payload.user.id}`).emit('onGroupRemoved', payload);
    // They should also leave the group room — but we can't force socket.leave from here,
    // the client handles this on receiving onGroupRemoved
    this.server.to(ROOM_NAME).emit('onGroupRecipientRemoved', payload);
  }

  @OnEvent('group.owner.update')
  handleGroupOwnerUpdate(payload: Group) {
    const ROOM_NAME = `group-${payload.id}`;
    this.server.to(ROOM_NAME).emit('onGroupOwnerUpdate', payload);
    // Also emit to the new owner directly in case they aren't in the room yet
    this.server.to(`user-${payload.owner.id}`).emit('onGroupOwnerUpdate', payload);
  }

  @OnEvent('group.user.leave')
  handleGroupUserLeave(payload) {
    const ROOM_NAME = `group-${payload.group.id}`;
    this.server.to(ROOM_NAME).emit('onGroupParticipantLeft', payload);
    this.server.to(`user-${payload.userId}`).emit('onGroupParticipantLeft', payload);
  }

  @OnEvent(ServerEvents.REACTION_ADDED)
  async handleReactionAdded(payload: {
    reaction: any;
    isGroup: boolean;
    groupId?: string;
  }) {
    if (payload.isGroup && payload.groupId) {
      this.server
        .to(`group-${payload.groupId}`)
        .emit(WebsocketEvents.REACTION_ADDED, payload);
    } else {
      const { reaction } = payload;
      const message = reaction.message || reaction;
      if (message.conversation) {
        const { creator, recipient } = message.conversation;
        this.server.to(`user-${creator.id}`).emit(WebsocketEvents.REACTION_ADDED, payload);
        this.server.to(`user-${recipient.id}`).emit(WebsocketEvents.REACTION_ADDED, payload);
      }
    }
  }

  @OnEvent(ServerEvents.REACTION_REMOVED)
  async handleReactionRemoved(payload: {
    messageId: string;
    userId: string;
    emoji: string;
    isGroup: boolean;
    groupId?: string;
  }) {
    if (payload.isGroup && payload.groupId) {
      this.server
        .to(`group-${payload.groupId}`)
        .emit(WebsocketEvents.REACTION_REMOVED, payload);
    } else {
      // For DMs, we need to find the conversation to emit to both parties
      // Emit to the user's room — the frontend filters by conversation
      this.server.to(`user-${payload.userId}`).emit(WebsocketEvents.REACTION_REMOVED, payload);
    }
  }

  @OnEvent(ServerEvents.MESSAGE_READ)
  async handleMessageRead(payload: { conversationId: string; userId: string }) {
    const conversation = await this.conversationService.findById(
      payload.conversationId,
    );
    if (!conversation) return;
    const { creator, recipient } = conversation;
    const recipientId = creator.id === payload.userId ? recipient.id : creator.id;
    this.server.to(`user-${recipientId}`).emit(WebsocketEvents.MESSAGE_READ, payload);
  }

  @OnEvent(ServerEvents.THREAD_REPLY)
  async handleThreadReply(payload: {
    parentMessageId: string;
    reply: any;
    conversation?: any;
    group?: any;
  }) {
    if (payload.group) {
      this.server
        .to(`group-${payload.group.id}`)
        .emit(WebsocketEvents.THREAD_REPLY, payload);
    } else if (payload.conversation) {
      const { creator, recipient } = payload.conversation;
      this.server.to(`user-${creator.id}`).emit(WebsocketEvents.THREAD_REPLY, payload);
      this.server.to(`user-${recipient.id}`).emit(WebsocketEvents.THREAD_REPLY, payload);
    }
  }

  @SubscribeMessage('getOnlineFriends')
  async handleFriendListRetrieve(
    @MessageBody() data: any,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    const { user } = socket;
    if (user) {
      const friends = await this.friendsService.getFriends(user.id);
      const onlineFriends = friends.filter((friend) =>
        this.sessions.getUserSocket(
          user.id === friend.receiver.id
            ? friend.sender.id
            : friend.receiver.id,
        ),
      );
      socket.emit('getOnlineFriends', onlineFriends);
    }
  }

  // --- Legacy PeerJS call handlers (retained for backward compatibility) ---

  @SubscribeMessage('onVideoCallInitiate')
  async handleVideoCall(
    @MessageBody() data: CreateCallDto,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    const caller = socket.user;

    if (this.sessions.isUserInCall(data.recipientId)) {
      socket.emit('onUserBusy', { userId: data.recipientId, message: 'User is currently in another call' });
      return;
    }

    const receiverSocket = this.sessions.getUserSocket(data.recipientId);
    if (!receiverSocket) {
      socket.emit('onUserUnavailable');
      return;
    }

    this.sessions.setUserInCall(caller.id, true);
    receiverSocket.emit('onVideoCall', { ...data, caller });
  }

  @SubscribeMessage('videoCallAccepted')
  async handleVideoCallAccepted(
    @MessageBody() data: CallAcceptedPayload,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    this.sessions.setUserInCall(data.caller.id, true);
    this.sessions.setUserInCall(socket.user.id, true);

    const callerSocket = this.sessions.getUserSocket(data.caller.id);
    const conversation = await this.conversationService.isCreated(
      data.caller.id,
      socket.user.id,
    );
    if (!conversation) {
      socket.emit('onVideoCallError', { message: 'Conversation not found. Please start a conversation first.' });
      return;
    }
    if (callerSocket) {
      const payload = { ...data, conversation, acceptor: socket.user };
      callerSocket.emit('onVideoCallAccept', payload);
      socket.emit('onVideoCallAccept', payload);
    } else {
      socket.emit('onVideoCallError', { message: 'Caller is no longer available.' });
    }
  }

  @SubscribeMessage(WebsocketEvents.VIDEO_CALL_REJECTED)
  async handleVideoCallRejected(
    @MessageBody() data,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    const receiver = socket.user;
    const callerSocket = this.sessions.getUserSocket(data.caller.id);
    callerSocket && callerSocket.emit(WebsocketEvents.VIDEO_CALL_REJECTED, { receiver });
    socket.emit(WebsocketEvents.VIDEO_CALL_REJECTED, { receiver });
  }

  @SubscribeMessage('videoCallHangUp')
  async handleVideoCallHangUp(
    @MessageBody() { caller, receiver }: CallHangUpPayload,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    this.sessions.setUserInCall(caller.id, false);
    this.sessions.setUserInCall(receiver.id, false);

    if (socket.user.id === caller.id) {
      const receiverSocket = this.sessions.getUserSocket(receiver.id);
      socket.emit('onVideoCallHangUp');
      return receiverSocket && receiverSocket.emit('onVideoCallHangUp');
    }
    socket.emit('onVideoCallHangUp');
    const callerSocket = this.sessions.getUserSocket(caller.id);
    callerSocket && callerSocket.emit('onVideoCallHangUp');
  }

  @SubscribeMessage('onVoiceCallInitiate')
  async handleVoiceCallInitiate(
    @MessageBody() payload: VoiceCallPayload,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    const caller = socket.user;

    if (this.sessions.isUserInCall(payload.recipientId)) {
      socket.emit('onUserBusy', { userId: payload.recipientId, message: 'User is currently in another call' });
      return;
    }

    const receiverSocket = this.sessions.getUserSocket(payload.recipientId);
    if (!receiverSocket) {
      socket.emit('onUserUnavailable');
      return;
    }

    this.sessions.setUserInCall(caller.id, true);
    receiverSocket.emit('onVoiceCall', { ...payload, caller });
  }

  @SubscribeMessage(WebsocketEvents.VOICE_CALL_ACCEPTED)
  async handleVoiceCallAccepted(
    @MessageBody() payload: CallAcceptedPayload,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    this.sessions.setUserInCall(payload.caller.id, true);
    this.sessions.setUserInCall(socket.user.id, true);

    const callerSocket = this.sessions.getUserSocket(payload.caller.id);
    const conversation = await this.conversationService.isCreated(
      payload.caller.id,
      socket.user.id,
    );
    if (!conversation) {
      socket.emit('onVoiceCallError', { message: 'Conversation not found. Please start a conversation first.' });
      return;
    }
    if (callerSocket) {
      const callPayload = { ...payload, conversation, acceptor: socket.user };
      callerSocket.emit(WebsocketEvents.VOICE_CALL_ACCEPTED, callPayload);
      socket.emit(WebsocketEvents.VOICE_CALL_ACCEPTED, callPayload);
    } else {
      socket.emit('onVoiceCallError', { message: 'Caller is no longer available.' });
    }
  }

  @SubscribeMessage(WebsocketEvents.VOICE_CALL_HANG_UP)
  async handleVoiceCallHangUp(
    @MessageBody() { caller, receiver }: CallHangUpPayload,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    this.sessions.setUserInCall(caller.id, false);
    this.sessions.setUserInCall(receiver.id, false);

    if (socket.user.id === caller.id) {
      const receiverSocket = this.sessions.getUserSocket(receiver.id);
      socket.emit(WebsocketEvents.VOICE_CALL_HANG_UP);
      return receiverSocket && receiverSocket.emit(WebsocketEvents.VOICE_CALL_HANG_UP);
    }
    socket.emit(WebsocketEvents.VOICE_CALL_HANG_UP);
    const callerSocket = this.sessions.getUserSocket(caller.id);
    callerSocket && callerSocket.emit(WebsocketEvents.VOICE_CALL_HANG_UP);
  }

  @SubscribeMessage(WebsocketEvents.VOICE_CALL_REJECTED)
  async handleVoiceCallRejected(
    @MessageBody() data,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    const receiver = socket.user;
    const callerSocket = this.sessions.getUserSocket(data.caller.id);
    callerSocket && callerSocket.emit(WebsocketEvents.VOICE_CALL_REJECTED, { receiver });
    socket.emit(WebsocketEvents.VOICE_CALL_REJECTED, { receiver });
  }

  // --- Stream.io 1-to-1 call handlers ---

  @SubscribeMessage('streamCallInitiated')
  async handleStreamCallInitiated(
    @MessageBody() data: {
      callId: string;
      callType: 'video' | 'audio';
      callerId: string;
      callerName: string;
      recipientId: string;
      conversationId: string;
    },
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    if (this.sessions.isUserInCall(data.recipientId)) {
      socket.emit('onUserBusy', { userId: data.recipientId });
      return;
    }

    try {
      await this.callHistoryService.createCall({
        callId: data.callId,
        callerId: data.callerId,
        recipientId: data.recipientId,
        conversationId: data.conversationId,
        callType: data.callType,
      });
    } catch {}

    const callData = { ...data, initiatedAt: Date.now() };
    const recipientSocket = this.sessions.getUserSocket(data.recipientId);
    if (recipientSocket) {
      recipientSocket.emit('streamCallInitiated', callData);
    } else {
      this.pendingStreamCalls.set(data.recipientId, callData);
      setTimeout(() => {
        const pending = this.pendingStreamCalls.get(data.recipientId);
        if (pending && pending.callId === data.callId) {
          this.pendingStreamCalls.delete(data.recipientId);
          this.callHistoryService.updateStatus(data.callId, 'missed').catch(() => {});
        }
      }, 10_000);
    }
  }

  @SubscribeMessage('streamCallAccepted')
  async handleStreamCallAccepted(
    @MessageBody() data: { callId: string; callerId: string },
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    this.pendingStreamCalls.delete(socket.user.id);

    try {
      await this.callHistoryService.updateStatus(data.callId, 'accepted');
    } catch {}

    this.sessions.setUserInCall(socket.user.id, true);
    this.sessions.setUserInCall(data.callerId, true);
    await this.broadcastStatusToFriends(socket.user.id, 'in-call');
    await this.broadcastStatusToFriends(data.callerId, 'in-call');

    const participants = new Set([socket.user.id, data.callerId]);
    this.callParticipants.set(data.callId, participants);
    this.userCallMap.set(socket.user.id, data.callId);
    this.userCallMap.set(data.callerId, data.callId);

    this.server.to(`user-${data.callerId}`).emit('streamCallAccepted', data);
  }

  @SubscribeMessage('streamCallEnded')
  async handleStreamCallEnded(
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    const userId = socket.user.id;
    this.sessions.setUserInCall(userId, false);
    await this.broadcastStatusToFriends(userId, 'online');

    const callId = this.userCallMap.get(userId);
    if (callId) {
      // Check if this is a group call
      try {
        const call = await this.callHistoryService['callRepository'].findOne({ where: { id: callId } });
        if (call?.groupId) {
          // Group call: only remove this participant
          try {
            await this.callHistoryService.endCallForParticipant(callId, userId);
          } catch {}
          this.userCallMap.delete(userId);
          const participants = this.callParticipants.get(callId);
          if (participants) {
            participants.delete(userId);
            if (participants.size === 0) {
              // Last participant left — end the call
              try {
                await this.callHistoryService.endCall(callId);
              } catch {}
              this.callParticipants.delete(callId);
            }
          }
          return;
        }
      } catch {}

      // 1-to-1 call: end the entire call
      try {
        await this.callHistoryService.endCall(callId);
      } catch {}
      this.userCallMap.delete(userId);
      const participants = this.callParticipants.get(callId);
      if (participants) {
        participants.delete(userId);
        for (const participantId of participants) {
          this.server.to(`user-${participantId}`).emit('onCallForceEnded');
          this.sessions.setUserInCall(participantId, false);
          this.userCallMap.delete(participantId);
          await this.broadcastStatusToFriends(participantId, 'online');
        }
        this.callParticipants.delete(callId);
      }
    }
  }

  @SubscribeMessage('streamCallRejected')
  async handleStreamCallRejected(
    @MessageBody() data: { callId: string; callerId: string },
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    this.pendingStreamCalls.delete(socket.user.id);

    try {
      await this.callHistoryService.updateStatus(data.callId, 'rejected');
    } catch {}

    this.server.to(`user-${data.callerId}`).emit('streamCallRejected', data);
  }

  @SubscribeMessage('streamCallCancelled')
  async handleStreamCallCancelled(
    @MessageBody() data: { callId: string; recipientId: string },
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    this.pendingStreamCalls.delete(data.recipientId);
    this.server.to(`user-${data.recipientId}`).emit('streamCallCancelled', data);
  }

  // --- Stream.io Group Call handlers ---

  @SubscribeMessage('streamGroupCallInitiated')
  async handleStreamGroupCallInitiated(
    @MessageBody() data: {
      callId: string;
      callType: 'video' | 'audio';
      callerId: string;
      callerName: string;
      groupId: string;
    },
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    // Get group members (with caching)
    let memberIds: string[] | null = await this.cache.getCached(`group:members:${data.groupId}`);
    if (!memberIds) {
      const group = await this.groupsService.findGroupById(data.groupId);
      if (!group) return;
      memberIds = group.users.map((u) => u.id);
      await this.cache.setCache(`group:members:${data.groupId}`, memberIds, 300);
    }

    // Filter out the caller
    const targetMembers = memberIds.filter((id) => id !== data.callerId);

    // Create call record
    try {
      await this.callHistoryService.createCall({
        callId: data.callId,
        callerId: data.callerId,
        groupId: data.groupId,
        callType: data.callType,
        participantIds: targetMembers,
      });
    } catch {}

    // Mark caller as in-call
    this.sessions.setUserInCall(data.callerId, true);
    this.userCallMap.set(data.callerId, data.callId);
    this.callParticipants.set(data.callId, new Set([data.callerId]));
    await this.broadcastStatusToFriends(data.callerId, 'in-call');

    const callData = { ...data, initiatedAt: Date.now() };

    // Emit to each member
    for (const memberId of targetMembers) {
      if (this.sessions.isUserInCall(memberId)) continue;

      const memberSocket = this.sessions.getUserSocket(memberId);
      if (memberSocket) {
        memberSocket.emit('streamCallInitiated', {
          ...callData,
          recipientId: memberId,
        });
      } else {
        // Store pending for offline users
        this.pendingGroupCalls.set(memberId, callData);
        setTimeout(() => {
          const pending = this.pendingGroupCalls.get(memberId);
          if (pending && pending.callId === data.callId) {
            this.pendingGroupCalls.delete(memberId);
            this.callHistoryService.updateParticipantStatus(data.callId, memberId, 'missed').catch(() => {});
          }
        }, 10_000);
      }
    }
  }

  @SubscribeMessage('streamGroupCallAccepted')
  async handleStreamGroupCallAccepted(
    @MessageBody() data: { callId: string; callerId: string; groupId: string },
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    this.pendingGroupCalls.delete(socket.user.id);

    // Update participant status
    try {
      await this.callHistoryService.updateParticipantStatus(data.callId, socket.user.id, 'accepted');
    } catch {}

    this.sessions.setUserInCall(socket.user.id, true);
    this.userCallMap.set(socket.user.id, data.callId);

    const participants = this.callParticipants.get(data.callId);
    if (participants) {
      participants.add(socket.user.id);
    }

    await this.broadcastStatusToFriends(socket.user.id, 'in-call');

    // Notify the caller and other participants
    this.server.to(`user-${data.callerId}`).emit('streamCallAccepted', data);
    this.server.to(`group-${data.groupId}`).emit('streamGroupCallParticipantJoined', {
      callId: data.callId,
      userId: socket.user.id,
    });
  }

  @SubscribeMessage('streamGroupCallRejected')
  async handleStreamGroupCallRejected(
    @MessageBody() data: { callId: string; callerId: string; groupId: string },
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    this.pendingGroupCalls.delete(socket.user.id);

    try {
      await this.callHistoryService.updateParticipantStatus(data.callId, socket.user.id, 'rejected');
    } catch {}

    this.server.to(`user-${data.callerId}`).emit('streamCallRejected', data);
  }

  @SubscribeMessage('streamGroupCallCancelled')
  async handleStreamGroupCallCancelled(
    @MessageBody() data: { callId: string; groupId: string },
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    // Get group members and cancel pending calls
    let memberIds: string[] | null = await this.cache.getCached(`group:members:${data.groupId}`);
    if (!memberIds) {
      const group = await this.groupsService.findGroupById(data.groupId);
      if (!group) return;
      memberIds = group.users.map((u) => u.id);
    }

    for (const memberId of memberIds) {
      this.pendingGroupCalls.delete(memberId);
    }

    // Notify group members
    this.server.to(`group-${data.groupId}`).emit('streamCallCancelled', data);

    // Clean up caller state
    this.sessions.setUserInCall(socket.user.id, false);
    this.userCallMap.delete(socket.user.id);
    this.callParticipants.delete(data.callId);
    await this.broadcastStatusToFriends(socket.user.id, 'online');
  }

  // --- Notification handler ---

  @OnEvent(ServerEvents.NOTIFICATION_CREATED)
  handleNotificationCreated(payload: { notification: any }) {
    const { notification } = payload;
    this.server.to(`user-${notification.userId}`).emit('onNotification', notification);
  }
}
