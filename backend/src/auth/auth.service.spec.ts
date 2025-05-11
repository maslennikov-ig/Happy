import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException, BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findOneByEmail: jest.fn(),
    create: jest.fn(),
    findOneById: jest.fn(),
    updateResetToken: jest.fn(),
    findByResetToken: jest.fn(),
    updatePassword: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
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

  describe('validateUser', () => {
    it('should return user without password if credentials are valid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CLIENT',
      };

      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(result).not.toHaveProperty('password');
      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CLIENT',
      });
    });

    it('should return null if user not found', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password123');

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith('nonexistent@example.com');
      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashedPassword',
      };

      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongpassword', 'hashedPassword');
      expect(result).toBeNull();
    });

    it('should return null if an error occurs', async () => {
      mockUsersService.findOneByEmail.mockRejectedValue(new Error('Database error'));

      const result = await service.validateUser('test@example.com', 'password123');

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toBeNull();
    });
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

      mockUsersService.findOneByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(newUser);
      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.register(registerDto);

      expect(mockUsersService.create).toHaveBeenCalled();
      expect(result).toHaveProperty('access_token');
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

      mockUsersService.findOneByEmail.mockResolvedValue({
        id: '1',
        email: registerDto.email,
      });
      
      mockUsersService.create.mockImplementation(() => {
        throw new ConflictException('Пользователь с таким email уже существует');
      });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
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

      mockJwtService.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

      const result = await service.login(user);

      expect(mockJwtService.sign).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'CLIENT',
          company: undefined,
        },
      });
    });

    it('should include company data in response if available', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CLIENT',
        company: {
          id: '1',
          name: 'Test Company',
        },
      };

      mockJwtService.sign.mockReturnValue('jwt-token');

      const result = await service.login(user);

      expect(result.user).toHaveProperty('company', user.company);
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens if refresh token is valid', async () => {
      const payload = {
        email: 'test@example.com',
        sub: '1',
        role: 'CLIENT',
      };

      const user = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CLIENT',
      };

      mockJwtService.verify.mockReturnValue(payload);
      mockUsersService.findOneById.mockResolvedValue(user);
      mockJwtService.sign.mockReturnValueOnce('new-access-token').mockReturnValueOnce('new-refresh-token');

      const result = await service.refreshToken('valid-refresh-token');

      expect(mockJwtService.verify).toHaveBeenCalled();
      expect(mockUsersService.findOneById).toHaveBeenCalledWith('1');
      expect(result).toEqual({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'CLIENT',
          company: undefined,
        },
      });
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken('invalid-token')).rejects.toThrow(UnauthorizedException);
      expect(mockJwtService.verify).toHaveBeenCalled();
      expect(mockUsersService.findOneById).not.toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('should throw NotFoundException if user not found', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(null);

      await expect(
        service.forgotPassword({ email: 'nonexistent@example.com' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should generate reset token and update user', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      mockUsersService.findOneByEmail.mockResolvedValue(mockUser);
      mockUsersService.updateResetToken.mockResolvedValue({
        ...mockUser,
        resetPasswordToken: 'hashedToken',
      });

      const result = await service.forgotPassword({
        email: 'test@example.com',
      });

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(
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

      await expect(
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

      await expect(
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
