import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { InviteEmployeeDto } from './dto/invite-employee.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { CheckInvitationDto } from './dto/check-invitation.dto';
import { UserRole } from '../types/user-role.enum';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Получить данные компании по ID
   */
  async findById(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`Компания с ID ${companyId} не найдена`);
    }

    return company;
  }

  /**
   * Получить компанию пользователя
   */
  async getCompanyByUserId(companyId: string) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`Компания с ID ${companyId} не найдена`);
    }

    return company;
  }

  /**
   * Обновить данные компании
   */
  async updateCompany(companyId: string, updateCompanyDto: UpdateCompanyDto) {
    await this.findById(companyId);

    return this.prisma.company.update({
      where: { id: companyId },
      data: updateCompanyDto,
    });
  }

  /**
   * Пригласить сотрудника в компанию
   */
  async inviteEmployee(companyId: string, inviteDto: InviteEmployeeDto) {
    const { email } = inviteDto;

    // Проверяем существование компании
    await this.findById(companyId);

    // Проверяем, не существует ли уже пользователь с таким email
    const existingUser = await this.prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      if (existingUser.companyId && existingUser.companyId !== companyId) {
        throw new ConflictException(
          `Пользователь с email ${email} уже привязан к другой компании`,
        );
      }

      if (existingUser.companyId === companyId) {
        return {
          success: true,
          message: `Пользователь с email ${email} уже является сотрудником компании`,
        };
      }
    }

    // Генерируем токен приглашения
    const invitationToken = crypto.randomBytes(32).toString('hex');
    const invitationExpires = new Date();
    invitationExpires.setHours(invitationExpires.getHours() + 24); // Срок действия 24 часа

    // Если пользователь существует, но не привязан к компании - обновляем его
    if (existingUser) {
      await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          companyId,
          role: UserRole.EMPLOYEE,
          invitationToken,
          invitationExpires,
        },
      });
    } else {
      // Создаем нового пользователя с ролью EMPLOYEE
      await this.prisma.user.create({
        data: {
          email,
          firstName: '',
          lastName: '',
          password: '', // Пустой пароль, будет установлен при принятии приглашения
          role: UserRole.EMPLOYEE,
          companyId,
          invitationToken,
          invitationExpires,
          isActive: false, // Пользователь не активен до принятия приглашения
        },
      });
    }

    return {
      success: true,
      message: `Приглашение успешно отправлено на email ${email}`,
    };
  }

  /**
   * Получить список сотрудников компании
   */
  async getEmployees(companyId: string) {
    // Проверяем существование компании
    await this.findById(companyId);

    return this.prisma.user.findMany({
      where: {
        companyId,
        role: UserRole.EMPLOYEE,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isActive: true,
      },
    });
  }

  /**
   * Удалить/деактивировать сотрудника
   */
  async removeEmployee(companyId: string, employeeId: string) {
    // Проверяем существование компании
    await this.findById(companyId);

    // Проверяем существование сотрудника
    const employee = await this.prisma.user.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Сотрудник с ID ${employeeId} не найден`);
    }

    // Проверяем, что сотрудник принадлежит этой компании
    if (employee.companyId !== companyId) {
      throw new ConflictException(
        `Сотрудник с ID ${employeeId} не принадлежит компании с ID ${companyId}`,
      );
    }

    // Удаляем связь сотрудника с компанией
    await this.prisma.user.update({
      where: { id: employeeId },
      data: {
        companyId: null,
        role: UserRole.CLIENT, // Меняем роль на CLIENT
      },
    });

    return {
      success: true,
      message: `Сотрудник с ID ${employeeId} успешно удален из компании`,
    };
  }

  /**
   * Принять приглашение сотрудником
   */
  async acceptInvitation(acceptInvitationDto: AcceptInvitationDto) {
    const { token, firstName, lastName, password } = acceptInvitationDto;

    // Находим пользователя по токену приглашения
    const user = await this.prisma.user.findFirst({
      where: {
        invitationToken: token,
      },
    });

    if (!user) {
      throw new NotFoundException('Приглашение не найдено или уже принято');
    }

    // Проверяем срок действия токена
    if (user.invitationExpires && user.invitationExpires < new Date()) {
      throw new BadRequestException('Срок действия приглашения истек');
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Обновляем данные пользователя
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        firstName,
        lastName,
        password: hashedPassword,
        invitationToken: null,
        invitationExpires: null,
        isActive: true,
      },
      include: {
        company: true,
      },
    });

    return {
      success: true,
      message: 'Приглашение успешно принято',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        company: updatedUser.company
          ? {
              id: updatedUser.company.id,
              name: updatedUser.company.name,
            }
          : null,
      },
    };
  }

  /**
   * Проверить статус приглашения
   */
  async checkInvitation(checkInvitationDto: CheckInvitationDto) {
    const { token } = checkInvitationDto;

    const user = await this.prisma.user.findFirst({
      where: {
        invitationToken: token,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Приглашение не найдено или уже принято');
    }

    // Проверяем срок действия токена
    if (user.invitationExpires && user.invitationExpires < new Date()) {
      throw new BadRequestException('Срок действия приглашения истек');
    }

    return {
      valid: true,
      email: user.email,
      company: user.company,
    };
  }
}
