import { fetchWithAuth } from './fetch';

// Интерфейс для ответа API
interface ApiResponse<T> {
  data?: T;
  error?: string;
  status?: boolean;
}

// Опции для запроса
interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: string;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
}

// Функция для установки cookie
const setCookie = (name: string, value: string, days: number = 7) => {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `; expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value}${expires}; path=/; samesite=lax`;
};

// Функция для удаления cookie
const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

/**
 * Базовая функция для выполнения запросов к API с обработкой ошибок
 */
export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetchWithAuth(
      `${process.env.NEXT_PUBLIC_API_URL}${url}`,
      options
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.message || 'Произошла ошибка при выполнении запроса',
        status: false
      };
    }

    return { 
      data,
      status: true
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Неизвестная ошибка',
      status: false
    };
  }
}

/**
 * Регистрация нового пользователя
 */
export async function register(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Вход пользователя
 */
export async function login(data: { email: string; password: string }) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Обновление токена доступа
 */
export async function refreshToken(refreshToken: string) {
  return apiRequest('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

/**
 * Запрос на восстановление пароля
 */
export async function forgotPassword(email: string) {
  return apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

/**
 * Сброс пароля
 */
export async function resetPassword(token: string, password: string) {
  return apiRequest('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

/**
 * Получение данных текущего пользователя
 */
export async function getCurrentUser() {
  return apiRequest('/users/me');
}

/**
 * Обновление данных пользователя
 */
export async function updateUserProfile(data: {
  firstName?: string;
  lastName?: string;
}) {
  return apiRequest('/users/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Изменение пароля пользователя
 */
export async function changePassword(data: {
  currentPassword: string;
  newPassword: string;
}) {
  return apiRequest('/users/me/password', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Выполняет запрос к API с автоматическим обновлением токена при необходимости
 * @param url URL для запроса
 * @param options Опции запроса
 * @returns Ответ API
 */
export async function apiRequestWithAutoRefresh<T = unknown>(
  url: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    body,
    headers = {},
    requiresAuth = true,
  } = options;

  // Формируем базовые заголовки
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // Если запрос требует аутентификации, добавляем токен
  if (requiresAuth) {
    const token = localStorage.getItem('accessToken');
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    // Если получаем 401 (Unauthorized), пытаемся обновить токен
    if (response.status === 401 && requiresAuth) {
      const refreshed = await refreshAccessToken();
      
      // Если токен успешно обновлен, повторяем запрос
      if (refreshed) {
        const newToken = localStorage.getItem('accessToken');
        requestHeaders['Authorization'] = `Bearer ${newToken}`;
        
        const newResponse = await fetch(url, {
          method,
          headers: requestHeaders,
          body: body ? JSON.stringify(body) : undefined,
        });
        
        const data = await newResponse.json();
        return {
          data,
          status: true,
        };
      } else {
        // Если не удалось обновить токен, возвращаем ошибку аутентификации
        return {
          error: 'Сессия истекла. Пожалуйста, войдите снова.',
          status: false,
        };
      }
    }

    // Обрабатываем обычный ответ
    const data = await response.json();
    
    if (!response.ok) {
      return {
        error: data.message || 'Произошла ошибка при выполнении запроса',
        status: false,
      };
    }

    return {
      data,
      status: true,
    };
  } catch (error) {
    console.error('Ошибка при выполнении запроса:', error);
    return {
      error: 'Произошла ошибка при выполнении запроса',
      status: false,
    };
  }
}

/**
 * Обновляет access token с использованием refresh token
 * @returns true, если обновление успешно, иначе false
 */
export async function refreshAccessToken(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/refresh-token', {
      method: 'POST',
    });

    if (!response.ok) {
      // Если не удалось обновить токен, очищаем localStorage и cookie
      localStorage.removeItem('accessToken');
      deleteCookie('accessToken');
      return false;
    }

    const data = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    setCookie('accessToken', data.accessToken);
    return true;
  } catch (error) {
    console.error('Ошибка при обновлении токена:', error);
    localStorage.removeItem('accessToken');
    deleteCookie('accessToken');
    return false;
  }
} 