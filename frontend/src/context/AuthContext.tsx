"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, AuthTokens } from '@/lib/auth/types';
import * as authApi from '@/lib/auth/api';

// Интерфейс контекста аутентификации
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

// Создание контекста
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Провайдер контекста
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Проверка аутентификации при загрузке
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          setIsLoading(false);
          return;
        }

        const response = await authApi.getCurrentUser();
        if (response.data) {
          setUser(response.data as User);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Ошибка при проверке аутентификации:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Функция для входа пользователя
  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login({ email, password });
      
      if (response.error) {
        return { success: false, error: response.error };
      }

      const { accessToken, refreshToken } = response.data as AuthTokens;
      
      // Сохраняем токены
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Получаем данные пользователя
      const userResponse = await authApi.getCurrentUser();
      
      if (userResponse.data) {
        setUser(userResponse.data as User);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, error: userResponse.error || 'Не удалось получить данные пользователя' };
      }
    } catch (error) {
      console.error('Ошибка при входе:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Произошла ошибка при входе'
      };
    }
  };

  // Функция для регистрации пользователя
  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => {
    try {
      const response = await authApi.register(data);
      
      if (response.error) {
        return { success: false, error: response.error };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Ошибка при регистрации:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Произошла ошибка при регистрации'
      };
    }
  };

  // Функция для выхода пользователя
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setIsAuthenticated(false);
    router.push('/login');
  };

  // Функция для обновления профиля пользователя
  const updateProfile = async (data: {
    firstName?: string;
    lastName?: string;
  }) => {
    try {
      const response = await authApi.updateUserProfile(data);
      
      if (response.error) {
        return { success: false, error: response.error };
      }
      
      // Обновляем данные пользователя в контексте
      setUser(prevUser => {
        if (!prevUser) return null;
        return { ...prevUser, ...data };
      });
      
      return { success: true };
    } catch (error) {
      console.error('Ошибка при обновлении профиля:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Произошла ошибка при обновлении профиля'
      };
    }
  };

  // Функция для изменения пароля пользователя
  const changePassword = async (data: {
    currentPassword: string;
    newPassword: string;
  }) => {
    try {
      const response = await authApi.changePassword(data);
      
      if (response.error) {
        return { success: false, error: response.error };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Ошибка при изменении пароля:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Произошла ошибка при изменении пароля'
      };
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Хук для использования контекста аутентификации
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 