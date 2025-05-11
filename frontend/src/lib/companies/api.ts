import { apiRequest } from '../auth/api';
import { Company, Employee, UpdateCompanyDto, InviteEmployeeDto } from './types';

/**
 * Получает данные компании текущего пользователя
 * @returns Данные компании
 */
export async function getMyCompany(): Promise<Company> {
  const response = await apiRequest<Company>('/api/companies/my');
  if (response.error) {
    throw new Error(response.error);
  }
  return response.data as Company;
}

/**
 * Обновляет данные компании текущего пользователя
 * @param data Данные для обновления
 * @returns Обновленные данные компании
 */
export async function updateMyCompany(data: UpdateCompanyDto): Promise<Company> {
  const response = await apiRequest<Company>('/api/companies/my', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  if (response.error) {
    throw new Error(response.error);
  }
  return response.data as Company;
}

/**
 * Получает список сотрудников компании текущего пользователя
 * @returns Список сотрудников
 */
export async function getEmployees(): Promise<Employee[]> {
  const response = await apiRequest<Employee[]>('/api/companies/my/employees');
  if (response.error) {
    throw new Error(response.error);
  }
  return response.data as Employee[];
}

/**
 * Приглашает нового сотрудника в компанию текущего пользователя
 * @param data Данные для приглашения
 * @returns Результат операции
 */
export async function inviteEmployee(data: InviteEmployeeDto): Promise<{ success: boolean; message: string }> {
  const response = await apiRequest<{ success: boolean; message: string }>(
    '/api/companies/my/employees',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
  if (response.error) {
    throw new Error(response.error);
  }
  return response.data as { success: boolean; message: string };
}

/**
 * Удаляет сотрудника из компании текущего пользователя
 * @param employeeId ID сотрудника
 * @returns Результат операции
 */
export async function removeEmployee(employeeId: string): Promise<{ success: boolean; message: string }> {
  const response = await apiRequest<{ success: boolean; message: string }>(
    `/api/companies/my/employees/${employeeId}`,
    {
      method: 'DELETE',
    }
  );
  if (response.error) {
    throw new Error(response.error);
  }
  return response.data as { success: boolean; message: string };
}

/**
 * Проверить статус приглашения
 */
export async function checkInvitation(token: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/companies/invitation/check`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Ошибка при проверке приглашения');
  }

  return response.json();
}

/**
 * Принять приглашение
 */
export async function acceptInvitation(data: {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
}) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/companies/invitation/accept`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Ошибка при принятии приглашения');
  }

  return response.json();
} 