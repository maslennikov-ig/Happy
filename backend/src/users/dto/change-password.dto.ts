import { IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'Текущий пароль не может быть пустым' })
  currentPassword: string;

  @IsNotEmpty({ message: 'Новый пароль не может быть пустым' })
  @MinLength(6, { message: 'Новый пароль должен содержать минимум 6 символов' })
  newPassword: string;
}
