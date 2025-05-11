import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesService } from './companies.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
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

describe('CompaniesService', () => {
  let service: CompaniesService;

  const mockPrismaService = {
    company: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    invitation: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  beforeEach(async () => {
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
    it('should return a company if user has one', async () => {
      const mockCompany = { id: '1', name: 'Test Company' };
      const mockUser = { id: '1', company: mockCompany };
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.getCompanyByUserId('1');
      expect(result).toEqual(mockCompany);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { company: true },
      });
    });

    it('should throw NotFoundException if user has no company', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: '1',
        company: null,
      });

      await expect(service.getCompanyByUserId('1')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { company: true },
      });
    });

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
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      // Мокаем создание пользователя
      const newUser = {
        id: '2',
        email: inviteDto.email,
        firstName: inviteDto.firstName,
        lastName: inviteDto.lastName,
        role: 'EMPLOYEE',
        isActive: false,
      };
      mockPrismaService.user.create.mockResolvedValue(newUser);

      const result = await service.inviteEmployee(companyId, inviteDto);

      expect(result).toEqual({
        message: 'Приглашение отправлено новому сотруднику',
        employee: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          isActive: newUser.isActive,
        },
      });

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: inviteDto.email,
          firstName: inviteDto.firstName,
          lastName: inviteDto.lastName,
          role: 'EMPLOYEE',
          companyId: companyId,
          isActive: false,
          isEmailVerified: false,
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
      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);

      // Мокаем обновление пользователя
      const updatedUser = {
        ...existingUser,
        role: 'EMPLOYEE',
        companyId: companyId,
      };
      mockPrismaService.user.update.mockResolvedValue(updatedUser);

      const result = await service.inviteEmployee(companyId, inviteDto);

      expect(result).toEqual({
        message: 'Приглашение отправлено существующему пользователю',
        employee: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          isActive: updatedUser.isActive,
        },
      });

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: existingUser.id },
        data: expect.objectContaining({
          companyId: companyId,
          role: 'EMPLOYEE',
        }),
      });
    });

    it('should throw ForbiddenException if user is ADMIN or CONCIERGE', async () => {
      // Пользователь существует и является администратором
      const existingUser = {
        id: '2',
        email: inviteDto.email,
        role: 'ADMIN',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);

      await expect(
        service.inviteEmployee(companyId, inviteDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if user is already in another company', async () => {
      // Пользователь существует и уже в другой компании
      const existingUser = {
        id: '2',
        email: inviteDto.email,
        role: 'EMPLOYEE',
        companyId: '999', // другая компания
      };
      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);

      await expect(
        service.inviteEmployee(companyId, inviteDto),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if user is already in this company', async () => {
      // Пользователь существует и уже в этой компании
      const existingUser = {
        id: '2',
        email: inviteDto.email,
        role: 'EMPLOYEE',
        companyId: companyId, // та же компания
      };
      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);

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
        },
        {
          id: '3',
          email: 'employee2@example.com',
          firstName: 'Jane',
          lastName: 'Doe',
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
      mockPrismaService.user.findFirst.mockResolvedValue({
        id: employeeId,
        email: 'employee@example.com',
        role: 'EMPLOYEE',
        companyId: companyId,
      });

      mockPrismaService.user.update.mockResolvedValue({
        id: employeeId,
        email: 'employee@example.com',
        isActive: false,
        companyId: null,
      });

      const result = await service.removeEmployee(companyId, employeeId);

      expect(result).toEqual({
        message: 'Сотрудник успешно удален из компании',
        employee: {
          id: employeeId,
          email: 'employee@example.com',
        },
      });

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: employeeId },
        data: {
          isActive: false,
          companyId: null,
        },
      });
    });

    it('should throw NotFoundException if employee does not exist in company', async () => {
      const companyId = '1';
      const employeeId = '2';

      mockPrismaService.company.findUnique.mockResolvedValue({ id: companyId });
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(
        service.removeEmployee(companyId, employeeId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
