export interface Company {
  id: string;
  name: string;
  inn?: string;
  description?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface UpdateCompanyDto {
  name?: string;
  inn?: string;
  description?: string;
  address?: string;
}

export interface InviteEmployeeDto {
  email: string;
  firstName?: string;
  lastName?: string;
  position?: string;
} 