import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    company: {
      create: jest.fn(),
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

  describe('create', () => {
    it('should create a new user and company', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+79001234567',
        companyName: 'Test Company',
        companyInn: '1234567890',
        companyDescription: 'Test Description',
        companyAddress: 'Test Address',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const mockCompany = {
        id: '1',
        name: registerDto.companyName,
        inn: registerDto.companyInn,
        description: registerDto.companyDescription,
        address: registerDto.companyAddress,
      };

      const mockUser = {
        id: '1',
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: registerDto.phone,
        role: 'CLIENT',
        company: mockCompany,
      };

      mockPrismaService.company.create.mockResolvedValue(mockCompany);
      mockPrismaService.user.create.mockResolvedValue(mockUser);

      const result = await service.create(registerDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });

      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);

      expect(mockPrismaService.company.create).toHaveBeenCalledWith({
        data: {
          name: registerDto.companyName,
          inn: registerDto.companyInn,
          description: registerDto.companyDescription,
          address: registerDto.companyAddress,
        },
      });

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: registerDto.email,
          password: 'hashedPassword',
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          phone: registerDto.phone,
          role: 'CLIENT',
          companyId: mockCompany.id,
        },
        select: expect.any(Object),
      });

      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if user with email already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        companyName: 'Test Company',
      };

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        email: registerDto.email,
      });

      await expect(service.create(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('findOneByEmail', () => {
    it('should return a user if found by email', async () => {
      const email = 'test@example.com';
      const mockUser = {
        id: '1',
        email,
        firstName: 'John',
        lastName: 'Doe',
        company: {
          id: '1',
          name: 'Test Company',
        },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOneByEmail(email);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
        include: { company: true },
      });

      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found by email', async () => {
      const email = 'nonexistent@example.com';
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findOneByEmail(email);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
        include: { company: true },
      });

      expect(result).toBeNull();
    });
  });

  describe('findOneById', () => {
    it('should return a user if found by id', async () => {
      const userId = '1';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        company: {
          id: '1',
          name: 'Test Company',
        },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOneById(userId);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: { company: true },
      });

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found by id', async () => {
      const userId = 'nonexistent-id';
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOneById(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getProfile', () => {
    it('should return user profile without sensitive data', async () => {
      const userId = '1';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+79001234567',
        role: 'CLIENT',
        password: 'hashedPassword',
        resetPasswordToken: 'token',
        resetPasswordExpires: new Date(),
        company: {
          id: '1',
          name: 'Test Company',
        },
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getProfile(userId);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: { company: true },
      });

      // Проверяем, что чувствительные данные были исключены
      expect(result).not.toHaveProperty('password');
      expect(result).not.toHaveProperty('resetPasswordToken');
      expect(result).not.toHaveProperty('resetPasswordExpires');

      // Проверяем, что остальные данные присутствуют
      expect(result).toEqual({
        id: userId,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+79001234567',
        role: 'CLIENT',
        company: {
          id: '1',
          name: 'Test Company',
        },
      });
    });
  });

  describe('updateResetToken', () => {
    it('should update user reset token and expiration', async () => {
      const userId = '1';
      const token = 'reset-token';
      const expires = new Date();

      const mockUpdatedUser = {
        id: userId,
        resetPasswordToken: token,
        resetPasswordExpires: expires,
      };

      mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await service.updateResetToken(userId, token, expires);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          resetPasswordToken: token,
          resetPasswordExpires: expires,
        },
      });

      expect(result).toEqual(mockUpdatedUser);
    });
  });

  describe('findByResetToken', () => {
    it('should find user by valid reset token', async () => {
      const token = 'valid-reset-token';
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        resetPasswordToken: token,
        resetPasswordExpires: new Date(Date.now() + 3600000), // 1 час в будущем
      };

      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.findByResetToken(token);

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          resetPasswordToken: token,
          resetPasswordExpires: {
            gt: expect.any(Date),
          },
        },
      });

      expect(result).toEqual(mockUser);
    });

    it('should return null if no user found with token', async () => {
      const token = 'invalid-reset-token';
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      const result = await service.findByResetToken(token);

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          resetPasswordToken: token,
          resetPasswordExpires: {
            gt: expect.any(Date),
          },
        },
      });

      expect(result).toBeNull();
    });
  });

  describe('updatePassword', () => {
    it('should update user password and clear reset token', async () => {
      const userId = '1';
      const newPassword = 'newHashedPassword';

      const mockUpdatedUser = {
        id: userId,
        password: newPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      };

      mockPrismaService.user.update.mockResolvedValue(mockUpdatedUser);

      const result = await service.updatePassword(userId, newPassword);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          password: newPassword,
          resetPasswordToken: null,
          resetPasswordExpires: null,
        },
      });

      expect(result).toEqual(mockUpdatedUser);
    });
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
