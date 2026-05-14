import { FC, useRef } from 'react';
import { checkUsernameExists } from '../../../utils/api';
import {
  InputContainer,
  InputContainerHeader,
  InputError,
  InputField,
  InputLabel,
} from '../../../utils/styles';
import { RegisterFormFieldProps } from '../../../utils/types/form';

export const UsernameField: FC<RegisterFormFieldProps> = ({
  register,
  errors,
}) => {
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <InputContainer>
      <InputContainerHeader>
        <InputLabel htmlFor="username">Username</InputLabel>
        {errors.username && <InputError>{errors.username.message}</InputError>}
      </InputContainerHeader>
      <InputField
        type="text"
        id="username"
        {...register('username', {
          required: 'Username is required',
          minLength: {
            value: 3,
            message: 'Must be 3 characters long',
          },
          maxLength: {
            value: 16,
            message: 'Exceeds 16 characters',
          },
          validate: {
            checkUsername: (username: string) =>
              new Promise((resolve) => {
                if (debounceTimer.current) clearTimeout(debounceTimer.current);
                debounceTimer.current = setTimeout(async () => {
                  try {
                    const { data } = await checkUsernameExists(username);
                    resolve(data.exists ? 'Username already taken' : true);
                  } catch {
                    resolve(true);
                  }
                }, 500);
              }),
          },
        })}
      />
    </InputContainer>
  );
};
