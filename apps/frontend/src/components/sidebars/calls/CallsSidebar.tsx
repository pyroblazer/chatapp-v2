import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import {
  ScrollableContainer,
  SidebarHeader,
  SidebarStyle,
} from '../../../utils/styles';

export const CallsSidebar = () => {
  const { friends } = useSelector((state: RootState) => state.friends);
  return (
    <SidebarStyle>
      <SidebarHeader>Friends</SidebarHeader>
      <ScrollableContainer>
        {friends.map((friend) => (
          <div key={friend.id} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
            {friend.username}
          </div>
        ))}
      </ScrollableContainer>
    </SidebarStyle>
  );
};
