import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Включаем CORS
  app.enableCors();

  // Включаем глобальную валидацию
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Отсекаем лишние поля
      forbidNonWhitelisted: true, // Запрещаем лишние поля
      transform: true, // Автоматически преобразуем примитивы в нужные типы
    }),
  );

  // Используем префикс для API
  app.setGlobalPrefix('api');

  // Получаем порт из переменных окружения
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
}

// Запускаем приложение
void bootstrap();
