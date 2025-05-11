/**
 * Функция для выполнения fetch-запросов с авторизационным токеном
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Получаем токен из localStorage
  const accessToken = localStorage.getItem('accessToken');

  // Объединяем заголовки
  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(options.headers || {}),
  };

  // Выполняем запрос с объединенными опциями
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Если получили 401 (Unauthorized), можно добавить логику обновления токена
  if (response.status === 401) {
    // Здесь может быть логика обновления токена через refresh token
    // и повторного выполнения запроса
  }

  return response;
} 