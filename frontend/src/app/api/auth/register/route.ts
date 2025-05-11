import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, companyName, password } = body;

    // Проверка наличия всех необходимых полей
    if (!firstName || !lastName || !email || !companyName || !password) {
      return NextResponse.json(
        { message: 'Все поля обязательны для заполнения' },
        { status: 400 }
      );
    }

    // Отправка запроса к бэкенду
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName,
        lastName,
        email,
        companyName,
        password,
      }),
    });

    const data = await response.json();

    // Если бэкенд вернул ошибку, передаем ее клиенту
    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Ошибка при регистрации' },
        { status: response.status }
      );
    }

    // Возвращаем успешный ответ
    return NextResponse.json(data);
  } catch (error) {
    console.error('Ошибка при регистрации:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
} 