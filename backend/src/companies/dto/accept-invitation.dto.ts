import { IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';

export class AcceptInvitationDto {
  @IsNotEmpty({ message: 'Токен приглашения не может быть пустым' })
  @IsString({ message: 'Токен приглашения должен быть строкой' })
  token: string;

  @IsNotEmpty({ message: 'Имя не может быть пустым' })
  @IsString({ message: 'Имя должно быть строкой' })
  firstName: string;

  @IsNotEmpty({ message: 'Фамилия не может быть пустой' })
  @IsString({ message: 'Фамилия должна быть строкой' })
  lastName: string;

  @IsNotEmpty({ message: 'Пароль не может быть пустым' })
  @MinLength(8, { message: 'Пароль должен содержать минимум 8 символов' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message:
        'Пароль должен содержать минимум 8 символов, включая строчные и заглавные буквы, цифры и специальные символы',
    },
  )
  password: string;
}
