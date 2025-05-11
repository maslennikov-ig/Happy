import { IsNotEmpty, IsString } from 'class-validator';

export class CheckInvitationDto {
  @IsNotEmpty({ message: 'Токен приглашения не может быть пустым' })
  @IsString({ message: 'Токен приглашения должен быть строкой' })
  token: string;
}
