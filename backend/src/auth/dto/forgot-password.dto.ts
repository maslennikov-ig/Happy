import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Введите корректный адрес электронной почты' })
  @IsNotEmpty({ message: 'Email не может быть пустым' })
  email: string;
}
