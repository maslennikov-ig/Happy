import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = body;

    // Проверка наличия всех необходимых полей
    if (!token || !password) {
      return NextResponse.json(
        { message: 'Токен и пароль обязательны для заполнения' },
        { status: 400 }
      );
    }

    // Отправка запроса к бэкенду
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        password,
      }),
    });

    const data = await response.json();

    // Если бэкенд вернул ошибку, передаем ее клиенту
    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Ошибка при сбросе пароля' },
        { status: response.status }
      );
    }

    // Возвращаем успешный ответ
    return NextResponse.json({
      message: 'Пароль успешно изменен',
    });
  } catch (error) {
    console.error('Ошибка при сбросе пароля:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
} 