import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
    
    // Переопределяем приватное свойство prisma
    Object.defineProperty(service, 'prisma', {
      value: mockPrismaService
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      const userId = '1';
      const updateProfileDto = {
        firstName: 'Новое Имя',
        lastName: 'Новая Фамилия',
        phone: '+79001234567',
      };

      const mockUser = {
        id: userId,
        email: 'test@example.com',
        firstName: 'Старое Имя',
        lastName: 'Старая Фамилия',
        phone: '+79009876543',
        password: 'hashedPassword',
        resetPasswordToken: null,
        resetPasswordExpires: null,
        company: null,
      };

      const mockUpdatedUser = {
        ...mockUser,
        firstName: updateProfileDto.firstName,
        lastName: updateProfileDto.lastName,
        phone: updateProfileDto.phone,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await service.updateProfile(userId, updateProfileDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: { company: true },
      });

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          firstName: updateProfileDto.firstName,
          lastName: updateProfileDto.lastName,
          phone: updateProfileDto.phone,
        },
        include: { company: true },
      });

      expect(result).toEqual({
        id: userId,
        email: 'test@example.com',
        firstName: 'Новое Имя',
        lastName: 'Новая Фамилия',
        phone: '+79001234567',
        company: null,
      });
    });
  });

  describe('changePassword', () => {
    it('should throw UnauthorizedException if current password is incorrect', async () => {
      const userId = '1';
      const changePasswordDto = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword123',
      };

      const mockUser = {
        id: userId,
        password: 'hashedPassword',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword(userId, changePasswordDto),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should update password if current password is correct', async () => {
      const userId = '1';
      const changePasswordDto = {
        currentPassword: 'correctPassword',
        newPassword: 'newPassword123',
      };

      const mockUser = {
        id: userId,
        password: 'hashedPassword',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');
      mockPrismaService.user.update.mockResolvedValue({ id: userId });

      const result = await service.changePassword(userId, changePasswordDto);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        changePasswordDto.currentPassword,
        mockUser.password,
      );

      expect(bcrypt.hash).toHaveBeenCalledWith(
        changePasswordDto.newPassword,
        10,
      );

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { password: 'newHashedPassword' },
      });

      expect(result).toEqual({ message: 'Пароль успешно изменен' });
    });
  });
});
