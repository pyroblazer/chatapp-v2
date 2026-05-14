import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { postRegisterUser } from '../../../utils/api';
import { Button } from '../../../utils/styles';
import { CreateUserParams } from '../../../utils/types';
import { toast } from 'react-toastify';
import styles from '../index.module.scss';
import { UsernameField } from './UsernameField';
import { NameField } from './NameField';
import { PasswordField } from './PasswordField';
import { ErrorModal } from '../../modals/ErrorModal';

export const RegisterForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateUserParams>({ reValidateMode: 'onBlur' });

  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');

  const onSubmit = async (data: CreateUserParams) => {
    try {
      await postRegisterUser(data);
      navigate('/login');
      toast.clearWaitingQueue();
      toast('Account created!', { type: 'success', icon: true });
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Error creating account. Please try again.';
      setErrorMsg(Array.isArray(msg) ? msg.join(', ') : String(msg));
    }
  };

  const formFieldProps = { errors, register };

  return (
    <>
      {errorMsg && <ErrorModal message={errorMsg} onClose={() => setErrorMsg('')} />}
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
        <UsernameField {...formFieldProps} />
        <NameField {...formFieldProps} />
        <PasswordField {...formFieldProps} />
        <Button className={styles.button}>Create My Account</Button>
        <div className={styles.footerText}>
          <span>Already have an account? </span>
          <Link to="/login">
            <span>Login</span>
          </Link>
        </div>
      </form>
    </>
  );
};
