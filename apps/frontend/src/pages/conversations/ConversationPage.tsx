import { useContext, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Outlet, useParams } from 'react-router-dom';
import { ConversationPanel } from '../../components/conversations/ConversationPanel';
import { ConversationSidebar } from '../../components/sidebars/ConversationSidebar';
import { AppDispatch } from '../../store';
import {
  addConversation,
  fetchConversationsThunk,
  updateConversation,
} from '../../store/conversationSlice';
import { addMessage, deleteMessage } from '../../store/messages/messageSlice';
import { updateType } from '../../store/selectedSlice';
import {
  clearConversationUnread,
  fetchAllConversationUnreadCountsThunk,
  incrementConversationUnread,
} from '../../store/unreadSlice';
import { SocketContext } from '../../utils/context/SocketContext';
import { Conversation, MessageEventPayload } from '../../utils/types';

export const ConversationPage = () => {
  const { id } = useParams();
  const [showSidebar, setShowSidebar] = useState(window.innerWidth > 800);
  const dispatch = useDispatch<AppDispatch>();
  const socket = useContext(SocketContext);

  useEffect(() => {
    const handleResize = () => setShowSidebar(window.innerWidth > 800);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    dispatch(updateType('private'));
    dispatch(fetchConversationsThunk()).then((result) => {
      if (fetchConversationsThunk.fulfilled.match(result)) {
        const ids = result.payload.data.map((c: Conversation) => c.id);
        dispatch(fetchAllConversationUnreadCountsThunk(ids));
      }
    });
  }, []);

  useEffect(() => {
    socket.on('onMessage', (payload: MessageEventPayload) => {
      const { conversation, message } = payload;
      dispatch(addMessage(payload));
      dispatch(updateConversation(conversation));
      if (id !== conversation.id) {
        dispatch(incrementConversationUnread(conversation.id));
      }
    });
    socket.on('onConversation', (payload: Conversation) => {
      dispatch(addConversation(payload));
    });
    socket.on('onMessageDelete', (payload) => {
      dispatch(deleteMessage(payload));
    });
    socket.on('onMessageRead', (payload: { conversationId: string }) => {
      dispatch(clearConversationUnread(payload.conversationId));
    });
    return () => {
      socket.off('connected');
      socket.off('onMessage');
      socket.off('onConversation');
      socket.off('onMessageDelete');
      socket.off('onMessageRead');
    };
  }, [id]);

  return (
    <>
      {showSidebar && <ConversationSidebar />}
      {!id && !showSidebar && <ConversationSidebar />}
      {!id && showSidebar && <ConversationPanel />}
      <Outlet />
    </>
  );
};
