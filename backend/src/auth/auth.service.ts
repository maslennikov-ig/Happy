import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import * as crypto from 'crypto';
import { Logger } from '@nestjs/common';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    try {
      const user = await this.usersService.findOneByEmail(email);
      if (!user) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(pass, user.password);
      if (!isPasswordValid) {
        return null;
      }

      const { password: _, ...result } = user;
      return result;
    } catch (err) {
      this.logger.error(`Ошибка при валидации пользователя: ${err.message}`);
      return null;
    }
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
      companyId: user.companyId || user.company?.id,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        company: user.company,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);

    return this.login(user);
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.usersService.findOneById(payload.sub);

      return this.login(user);
    } catch {
      throw new UnauthorizedException('Недействительный refresh токен');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    const user = await this.usersService.findOneByEmail(email);

    if (!user) {
      throw new NotFoundException('Пользователь с таким email не найден');
    }

    const token = crypto.randomBytes(32).toString('hex');

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const tokenExpires = new Date(Date.now() + 3600000);

    await this.usersService.updateResetToken(
      user.id,
      hashedToken,
      tokenExpires,
    );

    return {
      message: 'На ваш email отправлена инструкция по восстановлению пароля',
      resetToken: token,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, password } = resetPasswordDto;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.usersService.findByResetToken(hashedToken);

    if (!user) {
      throw new BadRequestException(
        'Токен недействителен или истек срок его действия',
      );
    }

    if (user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Срок действия токена истек');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.usersService.updatePassword(user.id, hashedPassword);

    return { message: 'Пароль успешно изменен' };
  }
}
