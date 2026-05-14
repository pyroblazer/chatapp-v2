import { useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { postLoginUser, setAccessToken } from '../../../utils/api';
import { SocketContext, createSocket } from '../../../utils/context/SocketContext';
import {
  Button,
  InputContainer,
  InputField,
  InputLabel,
} from '../../../utils/styles';
import { UserCredentialsParams } from '../../../utils/types';
import { ErrorModal } from '../../modals/ErrorModal';
import styles from '../index.module.scss';

export const LoginForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserCredentialsParams>();
  const navigate = useNavigate();
  const socket = useContext(SocketContext);
  const [errorMsg, setErrorMsg] = useState('');

  const onSubmit = async (data: UserCredentialsParams) => {
    try {
      const { data: res } = await postLoginUser(data);
      setAccessToken(res.accessToken);
      socket.auth = { token: res.accessToken };
      socket.connect();
      navigate('/conversations');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Invalid username or password. Please try again.';
      setErrorMsg(Array.isArray(msg) ? msg.join(', ') : String(msg));
    }
  };

  return (
    <>
      {errorMsg && <ErrorModal message={errorMsg} onClose={() => setErrorMsg('')} />}
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
        <InputContainer>
          <InputLabel htmlFor="username">Username</InputLabel>
          <InputField
            type="text"
            id="username"
            {...register('username', { required: true })}
          />
        </InputContainer>
        <InputContainer className={styles.loginFormPassword}>
          <InputLabel htmlFor="password">Password</InputLabel>
          <InputField
            type="password"
            id="password"
            {...register('password', { required: true })}
          />
        </InputContainer>
        <Button>Login</Button>
        <div className={styles.footerText}>
          <span>Don't have an account? </span>
          <Link to="/register">
            <span>Register</span>
          </Link>
        </div>
      </form>
    </>
  );
};
