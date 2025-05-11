import { Test, TestingModule } from '@nestjs/testing';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

describe('CompaniesController', () => {
  let controller: CompaniesController;

  const mockCompaniesService = {
    getCompanyByUserId: jest.fn(),
    updateCompany: jest.fn(),
    inviteEmployee: jest.fn(),
    getEmployees: jest.fn(),
    removeEmployee: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompaniesController],
      providers: [
        {
          provide: CompaniesService,
          useValue: mockCompaniesService,
        },
      ],
    }).compile();

    controller = module.get<CompaniesController>(CompaniesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMyCompany', () => {
    it('should return company data', async () => {
      const req = {
        user: {
          id: '1',
          companyId: '123',
        },
      } as RequestWithUser;

      const companyData = {
        id: '123',
        name: 'Test Company',
        inn: '1234567890',
        description: 'Test Description',
        address: 'Test Address',
      };

      mockCompaniesService.getCompanyByUserId.mockResolvedValue(companyData);

      const result = await controller.getMyCompany(req);

      expect(mockCompaniesService.getCompanyByUserId).toHaveBeenCalledWith(
        req.user.companyId,
      );
      expect(result).toEqual(companyData);
    });
  });

  describe('updateMyCompany', () => {
    it('should update and return company data', async () => {
      const req = {
        user: {
          id: '1',
          companyId: '123',
        },
      } as RequestWithUser;

      const updateDto = {
        name: 'Updated Company',
        inn: '0987654321',
        description: 'Updated Description',
        address: 'Updated Address',
      };

      const updatedCompany = {
        id: '123',
        ...updateDto,
      };

      mockCompaniesService.updateCompany.mockResolvedValue(updatedCompany);

      const result = await controller.updateMyCompany(req, updateDto);

      expect(mockCompaniesService.updateCompany).toHaveBeenCalledWith(
        req.user.companyId,
        updateDto,
      );
      expect(result).toEqual(updatedCompany);
    });
  });

  describe('inviteEmployee', () => {
    it('should invite employee and return result', async () => {
      const req = {
        user: {
          id: '1',
          companyId: '123',
        },
      } as RequestWithUser;

      const inviteDto = {
        email: 'employee@example.com',
      };

      const inviteResult = {
        success: true,
        message: 'Invitation sent',
      };

      mockCompaniesService.inviteEmployee.mockResolvedValue(inviteResult);

      const result = await controller.inviteEmployee(req, inviteDto);

      expect(mockCompaniesService.inviteEmployee).toHaveBeenCalledWith(
        req.user.companyId,
        inviteDto,
      );
      expect(result).toEqual(inviteResult);
    });
  });

  describe('getEmployees', () => {
    it('should return employees list', async () => {
      const req = {
        user: {
          id: '1',
          companyId: '123',
        },
      } as RequestWithUser;

      const employees = [
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

      mockCompaniesService.getEmployees.mockResolvedValue(employees);

      const result = await controller.getEmployees(req);

      expect(mockCompaniesService.getEmployees).toHaveBeenCalledWith(
        req.user.companyId,
      );
      expect(result).toEqual(employees);
    });
  });

  describe('removeEmployee', () => {
    it('should remove employee and return result', async () => {
      const req = {
        user: {
          id: '1',
          companyId: '123',
        },
      } as RequestWithUser;

      const employeeId = '2';

      const removeResult = {
        success: true,
        message: 'Employee removed',
      };

      mockCompaniesService.removeEmployee.mockResolvedValue(removeResult);

      const result = await controller.removeEmployee(req, employeeId);

      expect(mockCompaniesService.removeEmployee).toHaveBeenCalledWith(
        req.user.companyId,
        employeeId,
      );
      expect(result).toEqual(removeResult);
    });
  });
});
