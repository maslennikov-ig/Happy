import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    updateResetToken: jest.fn(),
    findByResetToken: jest.fn(),
    updatePassword: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        companyName: 'Test Company',
      };

      const hashedPassword = 'hashedPassword';
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve(hashedPassword));

      const newUser = {
        id: '1',
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: 'CLIENT',
        companyId: '1',
      };

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(newUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.register(registerDto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        registerDto.email,
      );
      expect(mockUsersService.create).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(mockJwtService.sign).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
    });

    it('should throw an error if user already exists', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        companyName: 'Test Company',
      };

      mockUsersService.findByEmail.mockResolvedValue({
        id: '1',
        email: registerDto.email,
      });

      void expect(service.register(registerDto)).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should return JWT token and user data on successful login', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CLIENT',
        companyId: '1',
      };

      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(user);

      expect(mockJwtService.sign).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('user');
    });
  });

  describe('forgotPassword', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.forgotPassword({ email: 'nonexistent@example.com' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should generate reset token and update user', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockUsersService.updateResetToken.mockResolvedValue({
        ...mockUser,
        resetPasswordToken: 'hashedToken',
      });

      const result = await service.forgotPassword({
        email: 'test@example.com',
      });

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );
      expect(mockUsersService.updateResetToken).toHaveBeenCalled();
      expect(result).toHaveProperty('message');
      expect(result).toHaveProperty('resetToken');
    });
  });

  describe('resetPassword', () => {
    it('should throw BadRequestException if token is invalid', async () => {
      mockUsersService.findByResetToken.mockResolvedValue(null);

      void expect(
        service.resetPassword({
          token: 'invalid-token',
          password: 'newPassword123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if token is expired', async () => {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1); // Вчерашняя дата

      mockUsersService.findByResetToken.mockResolvedValue({
        id: '1',
        resetPasswordExpires: expiredDate,
      });

      void expect(
        service.resetPassword({
          token: 'expired-token',
          password: 'newPassword123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should update password and clear reset token', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Завтрашняя дата

      const mockUser = {
        id: '1',
        resetPasswordExpires: futureDate,
      };

      mockUsersService.findByResetToken.mockResolvedValue(mockUser);
      mockUsersService.updatePassword.mockResolvedValue({
        ...mockUser,
        password: 'hashedNewPassword',
      });

      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve('hashedNewPassword'));

      const result = await service.resetPassword({
        token: 'valid-token',
        password: 'newPassword123',
      });

      expect(mockUsersService.findByResetToken).toHaveBeenCalled();
      expect(mockUsersService.updatePassword).toHaveBeenCalledWith(
        '1',
        'hashedNewPassword',
      );
      expect(result).toHaveProperty('message', 'Пароль успешно изменен');
    });
  });
});
