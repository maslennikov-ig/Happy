import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Проверка наличия всех необходимых полей
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email и пароль обязательны для заполнения' },
        { status: 400 }
      );
    }

    // Отправка запроса к бэкенду
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    // Если бэкенд вернул ошибку, передаем ее клиенту
    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Неверный email или пароль' },
        { status: response.status }
      );
    }

    // Сохраняем access token в cookie (для использования в клиентском коде)
    const { accessToken, refreshToken } = data;

    // Устанавливаем cookie для refresh token (httpOnly для безопасности)
    const cookieStore = cookies();
    cookieStore.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 дней
    });

    // Возвращаем успешный ответ с access token
    return NextResponse.json({
      accessToken,
      user: data.user,
    });
  } catch (error) {
    console.error('Ошибка при входе:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
} 