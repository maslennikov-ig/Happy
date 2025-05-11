import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    // Удаляем refresh token из cookie
    const cookieStore = cookies();
    
    // Устанавливаем пустое значение и короткий срок жизни для cookie
    cookieStore.delete('refreshToken');

    // Возвращаем успешный ответ
    return NextResponse.json({
      message: 'Выход выполнен успешно',
    });
  } catch (error) {
    console.error('Ошибка при выходе из системы:', error);
    return NextResponse.json(
      { message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
} 