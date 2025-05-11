import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Введите корректный адрес электронной почты' })
  @IsNotEmpty({ message: 'Email не может быть пустым' })
  email: string;

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

  @IsNotEmpty({ message: 'Имя не может быть пустым' })
  @IsString({ message: 'Имя должно быть строкой' })
  firstName: string;

  @IsNotEmpty({ message: 'Фамилия не может быть пустой' })
  @IsString({ message: 'Фамилия должна быть строкой' })
  lastName: string;

  @IsOptional()
  @IsString({ message: 'Телефон должен быть строкой' })
  @Matches(
    /^(\+7|7|8)?[\s\-]?\(?[489][0-9]{2}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/,
    {
      message: 'Введите корректный российский номер телефона',
    },
  )
  phone?: string;

  @IsNotEmpty({ message: 'Название компании не может быть пустым' })
  @IsString({ message: 'Название компании должно быть строкой' })
  @Matches(/^[а-яА-Яa-zA-Z0-9\s.,]+$/, {
    message:
      'Название компании может содержать только буквы, цифры, пробелы, точки и запятые',
  })
  companyName: string;

  @IsOptional()
  @IsString({ message: 'ИНН должен быть строкой' })
  @Matches(/^(\d{10}|\d{12})$/, {
    message: 'ИНН должен содержать 10 или 12 цифр',
  })
  companyInn?: string;

  @IsOptional()
  @IsString({ message: 'Описание компании должно быть строкой' })
  companyDescription?: string;

  @IsOptional()
  @IsString({ message: 'Адрес компании должен быть строкой' })
  companyAddress?: string;
}
