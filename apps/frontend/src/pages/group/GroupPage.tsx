import { useContext, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { ConversationPanel } from '../../components/conversations/ConversationPanel';
import { ConversationSidebar } from '../../components/sidebars/ConversationSidebar';
import { AppDispatch } from '../../store';
import { addGroupMessage } from '../../store/groupMessageSlice';
import {
  addGroup,
  fetchGroupsThunk,
  removeGroup,
  updateGroup,
} from '../../store/groupSlice';
import { updateType } from '../../store/selectedSlice';
import { incrementGroupUnread } from '../../store/unreadSlice';
import { AuthContext } from '../../utils/context/AuthContext';
import { SocketContext } from '../../utils/context/SocketContext';
import {
  Group,
  AddGroupUserMessagePayload,
  GroupMessageEventPayload,
  RemoveGroupUserMessagePayload,
  UpdateGroupAction,
  GroupParticipantLeftPayload,
} from '../../utils/types';

export const GroupPage = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [showSidebar, setShowSidebar] = useState(window.innerWidth > 800);
  const dispatch = useDispatch<AppDispatch>();
  const socket = useContext(SocketContext);
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(updateType('group'));
    dispatch(fetchGroupsThunk());
  }, []);

  useEffect(() => {
    const handleResize = () => setShowSidebar(window.innerWidth > 800);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const handleGroupMessage = (payload: GroupMessageEventPayload) => {
      const { group } = payload;
      dispatch(addGroupMessage(payload));
      dispatch(updateGroup({ type: UpdateGroupAction.NEW_MESSAGE, group }));
      if (id !== group.id) {
        dispatch(incrementGroupUnread(group.id));
      }
    };

    const handleGroupCreate = (payload: Group) => {
      dispatch(addGroup(payload));
    };

    const handleGroupUserAdd = (payload: AddGroupUserMessagePayload) => {
      dispatch(addGroup(payload.group));
    };

    const handleGroupReceivedNewUser = ({ group }: AddGroupUserMessagePayload) => {
      dispatch(updateGroup({ group }));
    };

    const handleGroupRecipientRemoved = ({ group }: RemoveGroupUserMessagePayload) => {
      dispatch(updateGroup({ group }));
    };

    const handleGroupRemoved = (payload: RemoveGroupUserMessagePayload) => {
      dispatch(removeGroup(payload.group));
      if (id && id === payload.group.id) {
        navigate('/groups');
      }
    };

    const handleGroupParticipantLeft = ({ group, userId }: GroupParticipantLeftPayload) => {
      dispatch(updateGroup({ group }));
      if (userId === user?.id) {
        dispatch(removeGroup(group));
        navigate('/groups');
      }
    };

    const handleGroupOwnerUpdate = (group: Group) => {
      dispatch(updateGroup({ group }));
    };

    socket.on('onGroupMessage', handleGroupMessage);
    socket.on('onGroupCreate', handleGroupCreate);
    socket.on('onGroupUserAdd', handleGroupUserAdd);
    socket.on('onGroupReceivedNewUser', handleGroupReceivedNewUser);
    socket.on('onGroupRecipientRemoved', handleGroupRecipientRemoved);
    socket.on('onGroupRemoved', handleGroupRemoved);
    socket.on('onGroupParticipantLeft', handleGroupParticipantLeft);
    socket.on('onGroupOwnerUpdate', handleGroupOwnerUpdate);

    return () => {
      socket.off('onGroupMessage', handleGroupMessage);
      socket.off('onGroupCreate', handleGroupCreate);
      socket.off('onGroupUserAdd', handleGroupUserAdd);
      socket.off('onGroupReceivedNewUser', handleGroupReceivedNewUser);
      socket.off('onGroupRecipientRemoved', handleGroupRecipientRemoved);
      socket.off('onGroupRemoved', handleGroupRemoved);
      socket.off('onGroupParticipantLeft', handleGroupParticipantLeft);
      socket.off('onGroupOwnerUpdate', handleGroupOwnerUpdate);
    };
  }, [id, dispatch, navigate, socket, user]);

  return (
    <>
      {showSidebar && <ConversationSidebar />}
      {!id && !showSidebar && <ConversationSidebar />}
      {!id && showSidebar && <ConversationPanel />}
      <Outlet />
    </>
  );
};