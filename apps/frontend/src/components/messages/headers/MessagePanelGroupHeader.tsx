import { useContext, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { PersonAdd, PeopleGroup } from 'akar-icons';
import { FaPhoneAlt, FaVideo } from 'react-icons/fa';
import { RootState, AppDispatch } from '../../../store';
import { toggleSidebar } from '../../../store/groupRecipientsSidebarSlice';
import { selectGroupById } from '../../../store/groupSlice';
import { AuthContext } from '../../../utils/context/AuthContext';
import { SocketContext } from '../../../utils/context/SocketContext';
import { useStreamCallWaiting } from '../../../utils/hooks/sockets/useStreamCallWaiting';
import {
  MessagePanelHeaderStyle,
  MessagePanelHeaderIcons,
} from '../../../utils/styles';
import { AddGroupRecipientModal } from '../../modals/AddGroupRecipientModal';

export const MessagePanelGroupHeader = () => {
  const [showModal, setShowModal] = useState(false);
  const user = useContext(AuthContext).user!;
  const { id } = useParams();
  const socket = useContext(SocketContext);
  const group = useSelector((state: RootState) =>
    selectGroupById(state, id!)
  );
  const dispatch = useDispatch<AppDispatch>();
  const { WaitingCallUI, BusyUI, startWaiting } = useStreamCallWaiting();

  const startGroupCall = (type: 'video' | 'audio') => {
    if (!group) return;

    const callId = `group-call-${group.id}-${Date.now()}`;
    const callerDisplayName = user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.username;

    socket.emit('streamGroupCallInitiated', {
      callId,
      callType: type,
      callerId: user.id,
      callerName: callerDisplayName,
      groupId: group.id,
    });

    startWaiting({
      callId,
      recipientId: '',
      recipientName: group.title || 'Group',
      callType: type,
      initiatedAt: Date.now(),
    });
  };

  return (
    <>
      {showModal && (
        <AddGroupRecipientModal
          showModal={showModal}
          setShowModal={setShowModal}
        />
      )}
      <MessagePanelHeaderStyle>
        <div>
          <span>
            {group?.title ||
              group?.users
                ?.map((u) => u.firstName)
                .filter(Boolean)
                .join(', ') ||
              'Group'}
          </span>
        </div>
        <MessagePanelHeaderIcons>
          <FaPhoneAlt
            size={24}
            cursor="pointer"
            onClick={() => startGroupCall('audio')}
            data-testid="group-voice-call-button"
            title="Start group audio call"
          />
          <FaVideo
            size={30}
            cursor="pointer"
            onClick={() => startGroupCall('video')}
            data-testid="group-video-call-button"
            title="Start group video call"
          />
          {user?.id === group?.owner?.id && (
            <PersonAdd
              cursor="pointer"
              size={30}
              onClick={() => setShowModal(true)}
            />
          )}
          <PeopleGroup
            cursor="pointer"
            size={30}
            onClick={() => dispatch(toggleSidebar())}
          />
        </MessagePanelHeaderIcons>
      </MessagePanelHeaderStyle>
      {WaitingCallUI}
      {BusyUI}
    </>
  );
};
