import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class InviteEmployeeDto {
  @IsNotEmpty({ message: 'Email обязателен' })
  @IsEmail({}, { message: 'Введите корректный email' })
  email: string;

  @IsOptional()
  @IsString({ message: 'Имя должно быть строкой' })
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Фамилия должна быть строкой' })
  lastName?: string;

  @IsOptional()
  @IsString({ message: 'Должность должна быть строкой' })
  position?: string;
}
