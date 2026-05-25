import { FieldErrorsImpl, UseFormRegister, UseFormWatch } from 'react-hook-form';
import { CreateUserParams } from '../types';

export type RegisterFormValues = CreateUserParams & { confirmPassword: string };

export type RegisterFormFieldProps = {
  register: UseFormRegister<RegisterFormValues>;
  errors: FieldErrorsImpl<RegisterFormValues>;
  watch?: UseFormWatch<RegisterFormValues>;
};
