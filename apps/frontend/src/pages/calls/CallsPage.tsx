import { useContext } from 'react';
import { Outlet } from 'react-router-dom';
import { CallsSidebar } from '../../components/sidebars/calls/CallsSidebar';
import { AuthContext } from '../../utils/context/AuthContext';

export const CallsPage = () => {
  const { user } = useContext(AuthContext);
  return (
    <>
      <CallsSidebar userId={user?.id} />
      <Outlet />
    </>
  );
};
