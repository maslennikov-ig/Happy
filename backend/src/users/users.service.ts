import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from '../auth/dto/register.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(registerDto: RegisterDto) {
    // Проверяем, существует ли пользователь с таким email
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Создаем транзакцию для создания пользователя и компании
    return this.prisma.$transaction(async (prisma) => {
      // Создаем компанию
      const company = await prisma.company.create({
        data: {
          name: registerDto.companyName,
          inn: registerDto.companyInn,
          description: registerDto.companyDescription,
          address: registerDto.companyAddress,
        },
      });

      // Создаем пользователя
      const user = await prisma.user.create({
        data: {
          email: registerDto.email,
          password: hashedPassword,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          phone: registerDto.phone,
          role: 'CLIENT', // Предприниматель (клиент)
          companyId: company.id,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          company: {
            select: {
              id: true,
              name: true,
              inn: true,
              description: true,
              address: true,
            },
          },
        },
      });

      return user;
    });
  }

  async findOneByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        company: true,
      },
    });

    return user;
  }

  async findOneById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        company: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    return user;
  }

  // Добавим метод для получения текущего профиля пользователя
  async getProfile(userId: string) {
    const user = await this.findOneById(userId);

    // Исключаем пароль и другие чувствительные данные

    const {
      password: _,
      resetPasswordToken: __,
      resetPasswordExpires: ___,
      ...result
    } = user;

    return result;
  }

  // Методы для работы с восстановлением пароля

  /**
   * Обновляет токен сброса пароля и время его истечения для пользователя
   */
  async updateResetToken(userId: string, token: string, expires: Date) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      },
    });
  }

  /**
   * Ищет пользователя по токену сброса пароля
   */
  async findByResetToken(token: string) {
    return this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date(), // Токен еще действителен
        },
      },
    });
  }

  /**
   * Обновляет пароль пользователя и очищает токен сброса
   */
  async updatePassword(userId: string, newPassword: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        password: newPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });
  }

  // Новые методы для управления профилем пользователя

  /**
   * Обновляет данные профиля пользователя
   */
  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    // Убеждаемся, что пользователь существует
    await this.findOneById(userId);

    // Обновляем профиль
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: updateProfileDto.firstName,
        lastName: updateProfileDto.lastName,
        phone: updateProfileDto.phone,
      },
      include: {
        company: true,
      },
    });

    // Исключаем чувствительные данные

    const {
      password: _,
      resetPasswordToken: __,
      resetPasswordExpires: ___,
      ...result
    } = updatedUser;

    return result;
  }

  /**
   * Изменяет пароль пользователя (проверяет текущий пароль)
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.findOneById(userId);

    // Проверяем, совпадает ли текущий пароль
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Текущий пароль неверен');
    }

    // Хешируем новый пароль
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    // Обновляем пароль
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Пароль успешно изменен' };
  }

  // Методы для управления сотрудниками компании будут добавлены позже
}
