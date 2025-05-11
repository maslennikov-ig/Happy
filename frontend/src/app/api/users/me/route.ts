import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Получение профиля пользователя
export async function GET() {
  try {
    // Получаем access token из localStorage
    const accessToken = cookies().get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { message: 'Не авторизован' },
        { status: 401 }
      );
    }

    // Отправка запроса к бэкенду
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/users/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    // Если бэкенд вернул ошибку, передаем ее клиенту
    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Ошибка при получении данных профиля' },
        { status: response.status }
      );
    }

    // Возвращаем данные пользователя
    return NextResponse.json(data);
  } catch (error) {
    console.error('Ошибка при получении данных профиля:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

// Обновление профиля пользователя
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, phone } = body;

    // Получаем access token из localStorage
    const accessToken = cookies().get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { message: 'Не авторизован' },
        { status: 401 }
      );
    }

    // Отправка запроса к бэкенду
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/users/me`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName,
        lastName,
        phone,
      }),
    });

    const data = await response.json();

    // Если бэкенд вернул ошибку, передаем ее клиенту
    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Ошибка при обновлении профиля' },
        { status: response.status }
      );
    }

    // Возвращаем обновленные данные
    return NextResponse.json(data);
  } catch (error) {
    console.error('Ошибка при обновлении профиля:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
} 