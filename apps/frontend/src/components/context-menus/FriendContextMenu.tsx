import { useContext } from 'react';
import { MdPersonRemove, MdOutlineTextsms } from 'react-icons/md';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch, RootState } from '../../store';
import { toggleContextMenu } from '../../store/friends/friendsSlice';
import { removeFriendThunk } from '../../store/friends/friendsThunk';
import { checkConversationOrCreate } from '../../utils/api';
import { AuthContext } from '../../utils/context/AuthContext';
import { SocketContext } from '../../utils/context/SocketContext';
import { ContextMenu, ContextMenuItem } from '../../utils/styles';
import { toast } from 'react-toastify';

export const FriendContextMenu = () => {
  const { user } = useContext(AuthContext);
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { points, selectedFriendContextMenu } = useSelector(
    (state: RootState) => state.friends
  );
  const socket = useContext(SocketContext);

  const getUserFriendInstance = () =>
    user?.id === selectedFriendContextMenu?.sender.id
      ? selectedFriendContextMenu?.receiver
      : selectedFriendContextMenu?.sender;

  const removeFriend = () => {
    if (!selectedFriendContextMenu) return;
    dispatch(toggleContextMenu(false));
    dispatch(removeFriendThunk(selectedFriendContextMenu.id))
      .unwrap()
      .then(() => socket.emit('getOnlineFriends'))
      .catch((err) => toast.error(err?.response?.data?.message || err?.message || 'Failed to remove friend'));
  };

  const sendMessage = () => {
    const recipient = getUserFriendInstance();
    recipient &&
      checkConversationOrCreate(recipient.id)
        .then(({ data }) => {
          navigate(`/conversations/${data.id}`);
        })
        .catch((err) => {
          toast.error(err?.response?.data?.message || err?.message || 'Failed to open conversation');
        });
  };

  return (
    <ContextMenu top={points.y} left={points.x}>
      <ContextMenuItem onClick={removeFriend}>
        <MdPersonRemove size={20} color="#ff0000" />
        <span style={{ color: '#ff0000' }}>Remove Friend</span>
      </ContextMenuItem>
      <ContextMenuItem onClick={sendMessage}>
        <MdOutlineTextsms size={20} color="#fff" />
        <span style={{ color: '#fff' }}>Message</span>
      </ContextMenuItem>
    </ContextMenu>
  );
};
