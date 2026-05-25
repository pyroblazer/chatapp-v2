import { FC, useState } from 'react';
import {
  InputContainer,
  InputLabel,
  InputField,
  InputContainerHeader,
  InputError,
} from '../../../utils/styles';
import { RegisterFormFieldProps } from '../../../utils/types/form';
import { AiFillEye, AiFillEyeInvisible } from 'react-icons/ai';
import styles from '../index.module.scss';

export const ConfirmPasswordField: FC<RegisterFormFieldProps> = ({
  register,
  errors,
  watch,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <InputContainer>
      <InputContainerHeader>
        <InputLabel htmlFor="confirmPassword">Confirm Password</InputLabel>
        {errors.confirmPassword && <InputError>{errors.confirmPassword.message}</InputError>}
      </InputContainerHeader>
      <div className={styles.passwordContainer}>
        <InputField
          type={showPassword ? 'text' : 'password'}
          id="confirmPassword"
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (value) =>
              value === watch('password') || 'Passwords do not match',
          })}
        />
        {showPassword ? (
          <AiFillEyeInvisible
            size={24}
            onClick={() => setShowPassword(false)}
            cursor="pointer"
          />
        ) : (
          <AiFillEye
            size={24}
            onClick={() => setShowPassword(true)}
            cursor="pointer"
          />
        )}
      </div>
    </InputContainer>
  );
};
