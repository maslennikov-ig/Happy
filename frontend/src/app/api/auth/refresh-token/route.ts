import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Получаем refresh token из cookie
    const cookieStore = cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { message: 'Refresh token не найден' },
        { status: 401 }
      );
    }

    // Отправка запроса к бэкенду для обновления токена
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await response.json();

    // Если бэкенд вернул ошибку, передаем ее клиенту
    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Ошибка при обновлении токена' },
        { status: response.status }
      );
    }

    // Получаем новые токены
    const { accessToken, refreshToken: newRefreshToken } = data;

    // Обновляем refresh token в cookie
    cookieStore.set('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 дней
    });

    // Возвращаем новый access token
    return NextResponse.json({
      accessToken,
      user: data.user,
    });
  } catch (error) {
    console.error('Ошибка при обновлении токена:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
} 