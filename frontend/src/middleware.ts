import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Массив путей, которые не требуют аутентификации
const publicPaths = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/invitation',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Проверяем, является ли путь публичным
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );

  // Получаем токен из cookie или localStorage
  const token = request.cookies.get('accessToken')?.value;

  // Если путь публичный и пользователь аутентифицирован, перенаправляем на дашборд
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Если путь не публичный и пользователь не аутентифицирован, перенаправляем на страницу входа
  if (!isPublicPath && !token) {
    // Сохраняем текущий URL для перенаправления после входа
    const redirectUrl = new URL('/login', request.url);
    redirectUrl.searchParams.set('callbackUrl', encodeURI(request.url));
    
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
}

// Конфигурация middleware - применяем ко всем маршрутам
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}; 