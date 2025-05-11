import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesService } from './companies.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { InviteEmployeeDto } from './dto/invite-employee.dto';
import { UserRole } from '../types/user-role.enum';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

// Мок для bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
}));

// Мок для crypto
jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('random_token'),
  }),
}));

// Мок для uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mocked-uuid'),
}));

describe('CompaniesService', () => {
  let service: CompaniesService;

  const mockPrismaService = {
    company: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      create: jest.fn(),
    },
    invitation: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return a company if it exists', async () => {
      const mockCompany = { id: '1', name: 'Test Company' };
      mockPrismaService.company.findUnique.mockResolvedValue(mockCompany);

      const result = await service.findById('1');
      expect(result).toEqual(mockCompany);
      expect(mockPrismaService.company.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException if company does not exist', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue(null);

      await expect(service.findById('1')).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.company.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('getCompanyByUserId', () => {
    it('should return company data', async () => {
      const companyId = 'company-id';
      const companyData = {
        id: companyId,
        name: 'Test Company',
        inn: '1234567890',
        description: 'Test Description',
        address: 'Test Address',
      };

      mockPrismaService.company.findUnique.mockResolvedValue(companyData);

      const result = await service.getCompanyByUserId(companyId);

      expect(mockPrismaService.company.findUnique).toHaveBeenCalledWith({
        where: { id: companyId },
      });
      expect(result).toEqual(companyData);
    });

    it('should throw NotFoundException if company not found', async () => {
      const companyId = 'non-existent-id';

      mockPrismaService.company.findUnique.mockResolvedValue(null);

      await expect(service.getCompanyByUserId(companyId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateCompany', () => {
    it('should update and return the company', async () => {
      const mockCompany = { id: '1', name: 'Test Company' };
      const updateDto = { name: 'Updated Company', inn: '1234567890' };
      const updatedCompany = { ...mockCompany, ...updateDto };

      mockPrismaService.company.findUnique.mockResolvedValue(mockCompany);
      mockPrismaService.company.update.mockResolvedValue(updatedCompany);

      const result = await service.updateCompany('1', updateDto);
      expect(result).toEqual(updatedCompany);
      expect(mockPrismaService.company.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockPrismaService.company.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          name: 'Updated Company',
          inn: '1234567890',
        },
      });
    });

    it('should throw NotFoundException if company does not exist', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue(null);

      await expect(
        service.updateCompany('1', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
      expect(mockPrismaService.company.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(mockPrismaService.company.update).not.toHaveBeenCalled();
    });
  });

  describe('inviteEmployee', () => {
    const companyId = '1';
    const inviteDto = {
      email: 'employee@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    beforeEach(() => {
      // Мокаем успешную проверку компании
      mockPrismaService.company.findUnique.mockResolvedValue({
        id: companyId,
        name: 'Test Company',
      });
    });

    it('should create a new user if email does not exist', async () => {
      // Пользователь не существует
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      // Мокаем создание пользователя
      const newUser = {
        id: '2',
        email: inviteDto.email,
      };
      mockPrismaService.user.create.mockResolvedValue(newUser);

      const result = await service.inviteEmployee(companyId, inviteDto);

      expect(result).toEqual({
        success: true,
        message: `Приглашение успешно отправлено на email ${inviteDto.email}`,
      });

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: inviteDto.email,
          firstName: '',
          lastName: '',
          password: '',
          role: 'EMPLOYEE',
          companyId: companyId,
          isActive: false,
          invitationToken: 'random_token',
          invitationExpires: expect.any(Date),
        }),
      });
    });

    it('should update existing user if email exists and user is not in a company', async () => {
      // Пользователь существует, но не в компании
      const existingUser = {
        id: '2',
        email: inviteDto.email,
        firstName: 'Existing',
        lastName: 'User',
        role: 'CLIENT',
        companyId: null,
      };
      mockPrismaService.user.findFirst.mockResolvedValue(existingUser);

      const result = await service.inviteEmployee(companyId, inviteDto);

      expect(result).toEqual({
        success: true,
        message: `Приглашение успешно отправлено на email ${inviteDto.email}`,
      });

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: existingUser.id },
        data: expect.objectContaining({
          companyId: companyId,
          role: 'EMPLOYEE',
          invitationToken: 'random_token',
          invitationExpires: expect.any(Date),
        }),
      });
    });

    it('should return success message if user is already in this company', async () => {
      // Пользователь существует и уже в этой компании
      const existingUser = {
        id: '2',
        email: inviteDto.email,
        role: 'EMPLOYEE',
        companyId: companyId, // та же компания
      };
      mockPrismaService.user.findFirst.mockResolvedValue(existingUser);

      const result = await service.inviteEmployee(companyId, inviteDto);

      expect(result).toEqual({
        success: true,
        message: `Пользователь с email ${inviteDto.email} уже является сотрудником компании`,
      });

      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if user is already in another company', async () => {
      // Пользователь существует и уже в другой компании
      const existingUser = {
        id: '2',
        email: inviteDto.email,
        role: 'EMPLOYEE',
        companyId: '999', // другая компания
      };
      mockPrismaService.user.findFirst.mockResolvedValue(existingUser);

      await expect(
        service.inviteEmployee(companyId, inviteDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getEmployees', () => {
    it('should return list of employees for company', async () => {
      const companyId = '1';
      const mockEmployees = [
        {
          id: '2',
          email: 'employee1@example.com',
          firstName: 'John',
          lastName: 'Doe',
          isActive: true,
        },
        {
          id: '3',
          email: 'employee2@example.com',
          firstName: 'Jane',
          lastName: 'Doe',
          isActive: true,
        },
      ];

      mockPrismaService.company.findUnique.mockResolvedValue({ id: companyId });
      mockPrismaService.user.findMany.mockResolvedValue(mockEmployees);

      const result = await service.getEmployees(companyId);

      expect(result).toEqual(mockEmployees);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: {
          companyId: companyId,
          role: 'EMPLOYEE',
        },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException if company does not exist', async () => {
      mockPrismaService.company.findUnique.mockResolvedValue(null);

      await expect(service.getEmployees('1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeEmployee', () => {
    it('should remove employee from company', async () => {
      const companyId = '1';
      const employeeId = '2';

      mockPrismaService.company.findUnique.mockResolvedValue({ id: companyId });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: employeeId,
        email: 'employee@example.com',
        role: 'EMPLOYEE',
        companyId: companyId,
      });

      mockPrismaService.user.update.mockResolvedValue({
        id: employeeId,
        email: 'employee@example.com',
        companyId: null,
        role: 'CLIENT',
      });

      const result = await service.removeEmployee(companyId, employeeId);

      expect(result).toEqual({
        success: true,
        message: `Сотрудник с ID ${employeeId} успешно удален из компании`,
      });

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: employeeId },
        data: {
          companyId: null,
          role: 'CLIENT',
        },
      });
    });

    it('should throw NotFoundException if employee does not exist', async () => {
      const companyId = '1';
      const employeeId = '2';

      mockPrismaService.company.findUnique.mockResolvedValue({ id: companyId });
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.removeEmployee(companyId, employeeId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if employee is not in this company', async () => {
      const companyId = '1';
      const employeeId = '2';

      mockPrismaService.company.findUnique.mockResolvedValue({ id: companyId });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: employeeId,
        companyId: 'another-company-id',
      });

      await expect(
        service.removeEmployee(companyId, employeeId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('acceptInvitation', () => {
    const acceptInvitationDto = {
      token: 'valid-token',
      firstName: 'John',
      lastName: 'Doe',
      password: 'newPassword123',
    };

    it('should accept invitation and update user data', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Завтрашняя дата

      const mockUser = {
        id: '1',
        email: 'employee@example.com',
        invitationToken: 'valid-token',
        invitationExpires: futureDate,
        role: 'EMPLOYEE',
        companyId: '1',
      };

      const mockCompany = {
        id: '1',
        name: 'Test Company',
      };

      const updatedUser = {
        ...mockUser,
        firstName: 'John',
        lastName: 'Doe',
        password: 'hashed_password',
        invitationToken: null,
        invitationExpires: null,
        isActive: true,
        company: mockCompany,
      };

      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.acceptInvitation(acceptInvitationDto);

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          invitationToken: 'valid-token',
        },
      });

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          firstName: 'John',
          lastName: 'Doe',
          password: 'hashed_password',
          invitationToken: null,
          invitationExpires: null,
          isActive: true,
        },
        include: {
          company: true,
        },
      });

      expect(result).toEqual({
        success: true,
        message: 'Приглашение успешно принято',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
          company: {
            id: mockCompany.id,
            name: mockCompany.name,
          },
        },
      });
    });

    it('should throw NotFoundException if invitation not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.acceptInvitation(acceptInvitationDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if invitation is expired', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Вчерашняя дата

      const mockUser = {
        id: '1',
        email: 'employee@example.com',
        invitationToken: 'valid-token',
        invitationExpires: pastDate,
      };

      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      await expect(
        service.acceptInvitation(acceptInvitationDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkInvitation', () => {
    it('should return invitation info if valid', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1); // Завтрашняя дата

      const mockUser = {
        id: '1',
        email: 'employee@example.com',
        invitationToken: 'valid-token',
        invitationExpires: futureDate,
        company: {
          id: '1',
          name: 'Test Company',
        },
      };

      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.checkInvitation({ token: 'valid-token' });

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          invitationToken: 'valid-token',
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

      expect(result).toEqual({
        valid: true,
        email: mockUser.email,
        company: mockUser.company,
      });
    });

    it('should throw NotFoundException if invitation not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.checkInvitation({ token: 'invalid-token' })
      ).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          invitationToken: 'invalid-token',
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
    });

    it('should throw BadRequestException if invitation is expired', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Вчерашняя дата

      const mockUser = {
        id: '1',
        email: 'employee@example.com',
        invitationToken: 'expired-token',
        invitationExpires: pastDate,
        company: {
          id: '1',
          name: 'Test Company',
        },
      };

      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      await expect(
        service.checkInvitation({ token: 'expired-token' })
      ).rejects.toThrow(BadRequestException);

      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          invitationToken: 'expired-token',
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
    });
  });
});
