import {
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class UpdateCompanyDto {
  @IsOptional()
  @IsString({ message: 'Название должно быть строкой' })
  @MinLength(1, { message: 'Название не может быть пустым' })
  @MaxLength(255, { message: 'Название не может быть длиннее 255 символов' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'ИНН должен быть строкой' })
  @Matches(/^(\d{10}|\d{12})$/, {
    message: 'ИНН должен содержать 10 или 12 цифр',
  })
  inn?: string;

  @IsOptional()
  @IsString({ message: 'Описание должно быть строкой' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'Адрес должен быть строкой' })
  address?: string;
}
