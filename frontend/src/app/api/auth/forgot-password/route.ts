import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    // Проверка наличия email
    if (!email) {
      return NextResponse.json(
        { message: 'Email обязателен для заполнения' },
        { status: 400 }
      );
    }

    // Отправка запроса к бэкенду
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    // Если бэкенд вернул ошибку, передаем ее клиенту
    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Ошибка при запросе восстановления пароля' },
        { status: response.status }
      );
    }

    // Возвращаем успешный ответ
    return NextResponse.json({
      message: 'Инструкции по восстановлению пароля отправлены на ваш email',
    });
  } catch (error) {
    console.error('Ошибка при запросе восстановления пароля:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
} 