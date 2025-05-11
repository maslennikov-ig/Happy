/**
 * Перечисление ролей пользователя
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
  EMPLOYEE = 'EMPLOYEE',
  CLIENT = 'CLIENT'
}

/**
 * Интерфейс пользователя
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  companyId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Интерфейс для токенов аутентификации
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Интерфейс для данных входа
 */
export interface LoginData {
  email: string;
  password: string;
}

/**
 * Интерфейс для данных регистрации
 */
export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
} 