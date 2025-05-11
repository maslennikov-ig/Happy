import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Проверка наличия всех необходимых полей
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: 'Текущий и новый пароли обязательны для заполнения' },
        { status: 400 }
      );
    }

    // Получаем access token из localStorage
    const accessToken = cookies().get('accessToken')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { message: 'Не авторизован' },
        { status: 401 }
      );
    }

    // Отправка запроса к бэкенду
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001'}/users/me/password`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
      }),
    });

    const data = await response.json();

    // Если бэкенд вернул ошибку, передаем ее клиенту
    if (!response.ok) {
      return NextResponse.json(
        { message: data.message || 'Ошибка при смене пароля' },
        { status: response.status }
      );
    }

    // Возвращаем успешный ответ
    return NextResponse.json({
      message: 'Пароль успешно изменен',
    });
  } catch (error) {
    console.error('Ошибка при смене пароля:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
} 