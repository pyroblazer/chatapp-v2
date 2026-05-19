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
  constructor(
    @Inject(Services.GATEWAY_SESSION_MANAGER)
    readonly sessions: IGatewaySessionManager,
    @Inject(Services.CONVERSATIONS)
    private readonly conversationService: IConversationsService,
    @Inject(Services.GROUPS)
    private readonly groupsService: IGroupService,
    @Inject(Services.FRIENDS_SERVICE)
    private readonly friendsService: IFriendsService,
  ) {}

  @WebSocketServer()
  server: Server;

  handleConnection(socket: AuthenticatedSocket, ...args: any[]) {
    this.sessions.setUserSocket(socket.user.id, socket);
    socket.emit('connected', {});
  }

  handleDisconnect(socket: AuthenticatedSocket) {
    this.sessions.removeUserSocket(socket.user.id);
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
      const socket = this.sessions.getUserSocket(user.id);
      socket ? onlineUsers.push(user) : offlineUsers.push(user);
    });
    socket.emit('onlineGroupUsersReceived', { onlineUsers, offlineUsers });
  }

  @SubscribeMessage('createMessage')
  handleCreateMessage(@MessageBody() _data: any) {
    // handled via event emitter
  }

  @SubscribeMessage('onConversationJoin')
  onConversationJoin(
    @MessageBody() data: any,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    console.log(
      `${client.user?.id} joined a Conversation of ID: ${data.conversationId}`,
    );
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
  onGroupJoin(
    @MessageBody() data: any,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
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
    client.to(`conversation-${data.conversationId}`).emit('onTypingStart');
  }

  @SubscribeMessage('onTypingStop')
  onTypingStop(
    @MessageBody() data: any,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.to(`conversation-${data.conversationId}`).emit('onTypingStop');
  }

  @OnEvent('message.create')
  handleMessageCreateEvent(payload: CreateMessageResponse) {
    const {
      author,
      conversation: { creator, recipient },
    } = payload.message;

    const authorSocket = this.sessions.getUserSocket(author.id);
    const recipientSocket =
      author.id === creator.id
        ? this.sessions.getUserSocket(recipient.id)
        : this.sessions.getUserSocket(creator.id);

    if (authorSocket) authorSocket.emit('onMessage', payload);
    if (recipientSocket) recipientSocket.emit('onMessage', payload);
  }

  @OnEvent('conversation.create')
  handleConversationCreateEvent(payload: Conversation) {
    const recipientSocket = this.sessions.getUserSocket(payload.recipient.id);
    if (recipientSocket) recipientSocket.emit('onConversation', payload);
  }

  @OnEvent('message.delete')
  async handleMessageDelete(payload) {
    const conversation = await this.conversationService.findById(
      payload.conversationId,
    );
    if (!conversation) return;
    const { creator, recipient } = conversation;
    const recipientSocket =
      creator.id === payload.userId
        ? this.sessions.getUserSocket(recipient.id)
        : this.sessions.getUserSocket(creator.id);
    if (recipientSocket) recipientSocket.emit('onMessageDelete', payload);
  }

  @OnEvent('message.update')
  async handleMessageUpdate(message: Message) {
    const {
      author,
      conversation: { creator, recipient },
    } = message;
    const recipientSocket =
      author.id === creator.id
        ? this.sessions.getUserSocket(recipient.id)
        : this.sessions.getUserSocket(creator.id);
    if (recipientSocket) recipientSocket.emit('onMessageUpdate', message);
  }

  @OnEvent('group.message.create')
  async handleGroupMessageCreate(payload: CreateGroupMessageResponse) {
    const { id } = payload.group;
    this.server.to(`group-${id}`).emit('onGroupMessage', payload);
  }

  @OnEvent('group.create')
  handleGroupCreate(payload: Group) {
    payload.users.forEach((user) => {
      const socket = this.sessions.getUserSocket(user.id);
      socket && socket.emit('onGroupCreate', payload);
    });
  }

  @OnEvent('group.message.update')
  handleGroupMessageUpdate(payload: GroupMessage) {
    const room = `group-${payload.group.id}`;
    this.server.to(room).emit('onGroupMessageUpdate', payload);
  }

  @OnEvent('group.user.add')
  handleGroupUserAdd(payload: AddGroupUserResponse) {
    const recipientSocket = this.sessions.getUserSocket(payload.user.id);
    this.server
      .to(`group-${payload.group.id}`)
      .emit('onGroupReceivedNewUser', payload);
    recipientSocket && recipientSocket.emit('onGroupUserAdd', payload);
  }

  @OnEvent('group.user.remove')
  handleGroupUserRemove(payload: RemoveGroupUserResponse) {
    const { group, user } = payload;
    const ROOM_NAME = `group-${payload.group.id}`;
    const removedUserSocket = this.sessions.getUserSocket(payload.user.id);
    if (removedUserSocket) {
      removedUserSocket.emit('onGroupRemoved', payload);
      removedUserSocket.leave(ROOM_NAME);
    }
    this.server.to(ROOM_NAME).emit('onGroupRecipientRemoved', payload);
    const onlineUsers = group.users
      .map((user) => this.sessions.getUserSocket(user.id) && user)
      .filter((user) => user);
    // this.server.to(ROOM_NAME).emit('onlineGroupUsersReceived', { onlineUsers });
  }

  @OnEvent('group.owner.update')
  handleGroupOwnerUpdate(payload: Group) {
    const ROOM_NAME = `group-${payload.id}`;
    const newOwnerSocket = this.sessions.getUserSocket(payload.owner.id);
    const { rooms } = this.server.sockets.adapter;
    const socketsInRoom = rooms.get(ROOM_NAME);
    // Check if the new owner is in the group (room)
    this.server.to(ROOM_NAME).emit('onGroupOwnerUpdate', payload);
    if (newOwnerSocket && !socketsInRoom.has(newOwnerSocket.id)) {
      newOwnerSocket.emit('onGroupOwnerUpdate', payload);
    }
  }

  @OnEvent('group.user.leave')
  handleGroupUserLeave(payload) {
    const ROOM_NAME = `group-${payload.group.id}`;
    const { rooms } = this.server.sockets.adapter;
    const socketsInRoom = rooms.get(ROOM_NAME);
    const leftUserSocket = this.sessions.getUserSocket(payload.userId);
    /**
     * If socketsInRoom is undefined, this means that there is
     * no one connected to the room. So just emit the event for
     * the connected user if they are online.
     */
    if (leftUserSocket && socketsInRoom) {
      if (socketsInRoom.has(leftUserSocket.id)) {
        return this.server
          .to(ROOM_NAME)
          .emit('onGroupParticipantLeft', payload);
      } else {
        leftUserSocket.emit('onGroupParticipantLeft', payload);
        this.server.to(ROOM_NAME).emit('onGroupParticipantLeft', payload);
        return;
      }
    }
    if (leftUserSocket && !socketsInRoom) {
      return leftUserSocket.emit('onGroupParticipantLeft', payload);
    }
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
        const creatorSocket = this.sessions.getUserSocket(creator.id);
        const recipientSocket = this.sessions.getUserSocket(recipient.id);
        if (creatorSocket)
          creatorSocket.emit(WebsocketEvents.REACTION_ADDED, payload);
        if (recipientSocket)
          recipientSocket.emit(WebsocketEvents.REACTION_ADDED, payload);
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
      // For DMs, emit to the conversation participants
      // The payload contains userId so the frontend can identify the conversation
      const userSocket = this.sessions.getUserSocket(payload.userId);
      if (userSocket)
        userSocket.emit(WebsocketEvents.REACTION_REMOVED, payload);
    }
  }

  @OnEvent(ServerEvents.MESSAGE_READ)
  async handleMessageRead(payload: { conversationId: string; userId: string }) {
    const conversation = await this.conversationService.findById(
      payload.conversationId,
    );
    if (!conversation) return;
    const { creator, recipient } = conversation;
    const recipientSocket =
      creator.id === payload.userId
        ? this.sessions.getUserSocket(recipient.id)
        : this.sessions.getUserSocket(creator.id);
    if (recipientSocket)
      recipientSocket.emit(WebsocketEvents.MESSAGE_READ, payload);
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
      const author = payload.reply.author;
      const authorSocket = this.sessions.getUserSocket(author.id);
      const recipientSocket =
        author.id === creator.id
          ? this.sessions.getUserSocket(recipient.id)
          : this.sessions.getUserSocket(creator.id);
      if (authorSocket)
        authorSocket.emit(WebsocketEvents.THREAD_REPLY, payload);
      if (recipientSocket)
        recipientSocket.emit(WebsocketEvents.THREAD_REPLY, payload);
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

  @SubscribeMessage('onVideoCallInitiate')
  async handleVideoCall(
    @MessageBody() data: CreateCallDto,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    const caller = socket.user;

    // Check if receiver is already in a call
    if (this.sessions.isUserInCall(data.recipientId)) {
      socket.emit('onUserBusy', {
        userId: data.recipientId,
        message: 'User is currently in another call'
      });
      return;
    }

    const receiverSocket = this.sessions.getUserSocket(data.recipientId);
    if (!receiverSocket) {
      socket.emit('onUserUnavailable');
      return;
    }

    // Mark caller as being in a call
    this.sessions.setUserInCall(caller.id, true);

    receiverSocket.emit('onVideoCall', { ...data, caller });
  }

  @SubscribeMessage('videoCallAccepted')
  async handleVideoCallAccepted(
    @MessageBody() data: CallAcceptedPayload,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    // Mark both parties as being in a call
    this.sessions.setUserInCall(data.caller.id, true);
    this.sessions.setUserInCall(socket.user.id, true);

    const callerSocket = this.sessions.getUserSocket(data.caller.id);
    const conversation = await this.conversationService.isCreated(
      data.caller.id,
      socket.user.id,
    );
    if (!conversation) {
      socket.emit('onVideoCallError', {
        message: 'Conversation not found. Please start a conversation first.',
      });
      return;
    }
    if (callerSocket) {
      const payload = { ...data, conversation, acceptor: socket.user };
      callerSocket.emit('onVideoCallAccept', payload);
      socket.emit('onVideoCallAccept', payload);
    } else {
      socket.emit('onVideoCallError', {
        message: 'Caller is no longer available.',
      });
    }
  }

  @SubscribeMessage(WebsocketEvents.VIDEO_CALL_REJECTED)
  async handleVideoCallRejected(
    @MessageBody() data,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    const receiver = socket.user;
    const callerSocket = this.sessions.getUserSocket(data.caller.id);
    callerSocket &&
      callerSocket.emit(WebsocketEvents.VIDEO_CALL_REJECTED, { receiver });
    socket.emit(WebsocketEvents.VIDEO_CALL_REJECTED, { receiver });
  }

  @SubscribeMessage('videoCallHangUp')
  async handleVideoCallHangUp(
    @MessageBody() { caller, receiver }: CallHangUpPayload,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    // Mark both parties as no longer being in a call
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

    // Check if receiver is already in a call
    if (this.sessions.isUserInCall(payload.recipientId)) {
      socket.emit('onUserBusy', {
        userId: payload.recipientId,
        message: 'User is currently in another call'
      });
      return;
    }

    const receiverSocket = this.sessions.getUserSocket(payload.recipientId);
    if (!receiverSocket) {
      socket.emit('onUserUnavailable');
      return;
    }

    // Mark caller as being in a call
    this.sessions.setUserInCall(caller.id, true);

    receiverSocket.emit('onVoiceCall', { ...payload, caller });
  }

  @SubscribeMessage(WebsocketEvents.VOICE_CALL_ACCEPTED)
  async handleVoiceCallAccepted(
    @MessageBody() payload: CallAcceptedPayload,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    // Mark both parties as being in a call
    this.sessions.setUserInCall(payload.caller.id, true);
    this.sessions.setUserInCall(socket.user.id, true);

    const callerSocket = this.sessions.getUserSocket(payload.caller.id);
    const conversation = await this.conversationService.isCreated(
      payload.caller.id,
      socket.user.id,
    );
    if (!conversation) {
      socket.emit('onVoiceCallError', {
        message: 'Conversation not found. Please start a conversation first.',
      });
      return;
    }
    if (callerSocket) {
      const callPayload = { ...payload, conversation, acceptor: socket.user };
      callerSocket.emit(WebsocketEvents.VOICE_CALL_ACCEPTED, callPayload);
      socket.emit(WebsocketEvents.VOICE_CALL_ACCEPTED, callPayload);
    } else {
      socket.emit('onVoiceCallError', {
        message: 'Caller is no longer available.',
      });
    }
  }

  @SubscribeMessage(WebsocketEvents.VOICE_CALL_HANG_UP)
  async handleVoiceCallHangUp(
    @MessageBody() { caller, receiver }: CallHangUpPayload,
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    // Mark both parties as no longer being in a call
    this.sessions.setUserInCall(caller.id, false);
    this.sessions.setUserInCall(receiver.id, false);

    if (socket.user.id === caller.id) {
      const receiverSocket = this.sessions.getUserSocket(receiver.id);
      socket.emit(WebsocketEvents.VOICE_CALL_HANG_UP);
      return (
        receiverSocket &&
        receiverSocket.emit(WebsocketEvents.VOICE_CALL_HANG_UP)
      );
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
    callerSocket &&
      callerSocket.emit(WebsocketEvents.VOICE_CALL_REJECTED, { receiver });
    socket.emit(WebsocketEvents.VOICE_CALL_REJECTED, { receiver });
  }

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
    // Forward the call notification to the recipient
    const recipientSocket = this.sessions.getUserSocket(data.recipientId);
    if (recipientSocket) {
      recipientSocket.emit('streamCallInitiated', data);
    }
  }

  @SubscribeMessage('streamCallAccepted')
  async handleStreamCallAccepted(
    @MessageBody() data: { callId: string; recipientId: string },
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    // Notify the caller that the recipient accepted
    const callerSocket = this.sessions.getUserSocket(data.recipientId);
    if (callerSocket) {
      callerSocket.emit('streamCallAccepted', data);
    }
  }

  @SubscribeMessage('streamCallRejected')
  async handleStreamCallRejected(
    @MessageBody() data: { callId: string; recipientId: string },
    @ConnectedSocket() socket: AuthenticatedSocket,
  ) {
    // Notify the caller that the recipient rejected
    const callerSocket = this.sessions.getUserSocket(data.recipientId);
    if (callerSocket) {
      callerSocket.emit('streamCallRejected', data);
    }
  }

  @OnEvent(ServerEvents.NOTIFICATION_CREATED)
  handleNotificationCreated(payload: { notification: any }) {
    const { notification } = payload;
    const userSocket = this.sessions.getUserSocket(notification.userId);
    if (userSocket) {
      userSocket.emit('onNotification', notification);
    }
  }
}
