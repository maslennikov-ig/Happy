# Инфраструктура MVP Платформы для Предпринимателей

## 1. Инфраструктурная схема

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    Инфраструктура проекта                       │
│                                                                 │
├─────────────────┬─────────────────────────┬─────────────────────┤
│                 │                         │                     │
│  Development    │       Staging           │     Production      │
│  Environment    │       Environment       │     Environment     │
│                 │                         │                     │
├─────────────────┴─────────────────────────┴─────────────────────┤
│                                                                 │
│                      Docker Ecosystem                           │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐   │
│  │                  │  │                  │  │              │   │
│  │  Frontend        │  │  Backend         │  │  Database    │   │
│  │  (Next.js)       │  │  (NestJS)        │  │  (PostgreSQL)│   │
│  │                  │  │                  │  │              │   │
│  └──────────────────┘  └──────────────────┘  └──────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                      CI/CD Pipeline                             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                      Cloud Hosting                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 2. Окружения разработки

### 2.1. Локальное окружение (Development)

Локальное окружение предназначено для разработки и первичного тестирования функциональности.

#### Компоненты локального окружения:

1. **Docker & Docker Compose**
   - Изолированные контейнеры для каждого сервиса
   - Воспроизводимое окружение на любой машине разработчика
   - Hot-reloading для быстрой итерации при разработке

2. **Локальные .env файлы**
   - Отдельные файлы для frontend и backend
   - Конфигурация для подключения к локальной БД
   - Тестовые ключи API для интеграций

3. **Локальные сервисы**
   - Frontend (Next.js) - доступен на `http://localhost:5000`
   - Backend (NestJS) - доступен на `http://localhost:5001`
   - PostgreSQL - доступен на стандартном порту `5432`

#### Docker Compose конфигурация:

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    volumes:
      - ./frontend:/app
      - /app/node_modules
    ports:
      - "5000:3000"
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://localhost:5001
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    volumes:
      - ./backend:/app
      - /app/node_modules
    ports:
      - "5001:3001"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/mvp_platform
    depends_on:
      - postgres

  postgres:
    image: postgres:14-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=mvp_platform
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 2.2. Тестовое окружение (Staging)

Тестовое окружение предназначено для проверки интеграций и функциональности перед выпуском в production.

#### Компоненты тестового окружения:

1. **Изолированные ресурсы**
   - Отдельный инстанс приложения
   - Отдельная база данных
   - Тестовые учетные данные для внешних сервисов

2. **Доступ**
   - Ограниченный доступ для команды разработки и тестирования
   - Защита паролем или IP-ограничения

3. **Конфигурация**
   - Максимально приближена к production
   - Использование тестовых API ключей платежных систем
   - Перенаправление email-уведомлений на тестовые ящики

### 2.3. Производственное окружение (Production)

Производственное окружение предназначено для конечных пользователей.

#### Компоненты производственного окружения:

1. **Основные сервисы**
   - Frontend (Next.js)
   - Backend (NestJS)
   - PostgreSQL

2. **Дополнительные сервисы**
   - Nginx в качестве обратного прокси и балансировщика нагрузки
   - SSL-сертификаты (Let's Encrypt)
   - Система мониторинга (для MVP: базовый мониторинг)

3. **Безопасность**
   - Брандмауэр (Firewall)
   - HTTPS для всего трафика
   - Защита от DDoS (на уровне хостинг-провайдера)

## 3. Процесс CI/CD

### 3.1. Непрерывная интеграция (CI)

GitHub Actions будет использоваться для автоматизации тестов и проверок при коммитах.

#### Основные этапы CI:

1. **Проверка кода**
   - Линтинг (ESLint, Prettier)
   - Статический анализ типов (TypeScript)
   - Проверка форматирования кода

2. **Тестирование**
   - Запуск unit-тестов
   - Запуск интеграционных тестов
   - Проверка сборки проекта

3. **Сканирование безопасности**
   - Проверка зависимостей на уязвимости (npm audit)
   - Статический анализ безопасности

#### Пример GitHub Actions Workflow:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16.x'
          cache: 'yarn'
          cache-dependency-path: 'frontend/yarn.lock'
      - name: Install dependencies
        run: cd frontend && yarn install
      - name: Lint
        run: cd frontend && yarn lint
      - name: Build
        run: cd frontend && yarn build
      - name: Test
        run: cd frontend && yarn test

  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16.x'
          cache: 'yarn'
          cache-dependency-path: 'backend/yarn.lock'
      - name: Install dependencies
        run: cd backend && yarn install
      - name: Lint
        run: cd backend && yarn lint
      - name: Build
        run: cd backend && yarn build
      - name: Test
        run: cd backend && yarn test
```

### 3.2. Непрерывное развертывание (CD)

GitHub Actions также будет использоваться для автоматического развертывания в тестовое и производственное окружения.

#### Основные этапы CD:

1. **Сборка Docker-образов**
   - Сборка образов frontend и backend
   - Тегирование образов (по ветке/тегу)

2. **Публикация образов**
   - Загрузка образов в Docker Hub или GitHub Container Registry

3. **Развертывание**
   - Автоматическое развертывание в тестовое окружение при коммите в `develop`
   - Ручное подтверждение для развертывания в производственное окружение при коммите в `main`

#### Пример GitHub Actions Workflow для CD:

```yaml
# .github/workflows/cd.yml
name: CD

on:
  push:
    branches: [ main, develop ]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_HUB_USERNAME }}
          password: ${{ secrets.DOCKER_HUB_ACCESS_TOKEN }}
          
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
        
      - name: Build and push Frontend
        uses: docker/build-push-action@v3
        with:
          context: ./frontend
          push: true
          tags: user/mvp-frontend:${{ github.ref_name }}
          
      - name: Build and push Backend
        uses: docker/build-push-action@v3
        with:
          context: ./backend
          push: true
          tags: user/mvp-backend:${{ github.ref_name }}
          
  deploy-staging:
    needs: build-and-push
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Staging
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USER }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /path/to/app
            docker-compose pull
            docker-compose up -d
            
  deploy-production:
    needs: build-and-push
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to Production
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_USER }}
          key: ${{ secrets.PRODUCTION_SSH_KEY }}
          script: |
            cd /path/to/app
            docker-compose pull
            docker-compose up -d
```

## 4. Docker-конфигурация

### 4.1. Frontend Dockerfile

```dockerfile
# Dockerfile for Next.js frontend (production)
FROM node:16-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM node:16-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

FROM node:16-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

CMD ["yarn", "start"]
```

### 4.2. Backend Dockerfile

```dockerfile
# Dockerfile for NestJS backend (production)
FROM node:16-alpine AS deps
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

FROM node:16-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

FROM node:16-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

RUN yarn prisma generate

EXPOSE 4000

CMD ["node", "dist/main"]
```

### 4.3. Production Docker Compose

```yaml
# Production docker-compose.yml
version: '3.8'

services:
  frontend:
    image: user/mvp-frontend:latest
    restart: always
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.example.com
    depends_on:
      - backend

  backend:
    image: user/mvp-backend:latest
    restart: always
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/mvp_platform
      # Другие переменные окружения (секреты)
    depends_on:
      - postgres

  postgres:
    image: postgres:14-alpine
    restart: always
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  nginx:
    image: nginx:alpine
    restart: always
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - frontend
      - backend

  certbot:
    image: certbot/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"
    volumes:
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot

volumes:
  postgres_data:
```

### 4.4. Nginx конфигурация

```nginx
# nginx.conf
server {
    listen 80;
    server_name example.com www.example.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name example.com www.example.com;
    
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api {
        proxy_pass http://backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 5. Требования к хостингу

### 5.1. Рекомендуемые спецификации для MVP

1. **Веб-сервер**
   - ОС: Ubuntu 20.04 LTS или более новая
   - CPU: 2+ vCPU
   - RAM: 4+ GB
   - Диск: 50+ GB SSD
   - Сеть: 100+ Mbps

2. **База данных**
   - Для MVP может быть на том же сервере
   - В дальнейшем: отдельный инстанс или managed PostgreSQL сервис

### 5.2. Масштабирование для будущего роста

1. **Вертикальное масштабирование**
   - Увеличение ресурсов (CPU, RAM) существующих серверов

2. **Горизонтальное масштабирование**
   - Добавление дополнительных инстансов сервисов
   - Балансировка нагрузки между инстансами
   - Переход на Kubernetes для управления контейнерами

3. **Отдельные сервисы**
   - Выделенный DB сервер
   - Выделенный сервер для файлового хранилища
   - Кэширующий слой (Redis)

## 6. Резервное копирование и восстановление

### 6.1. Стратегия резервного копирования

1. **База данных**
   - Ежедневное полное резервное копирование
   - Инкрементальные резервные копии каждые 6 часов
   - Хранение резервных копий за последние 7 дней

2. **Файлы пользователей**
   - Ежедневное резервное копирование
   - Репликация в облачное хранилище

3. **Конфигурационные файлы**
   - Резервное копирование при каждом значительном изменении
   - Хранение в системе контроля версий

### 6.2. Процедура восстановления

1. **Подготовка**
   - Инструкции по восстановлению из резервных копий
   - Тестирование процедуры восстановления

2. **Автоматизация**
   - Скрипты для автоматического восстановления
   - Регулярные проверки целостности резервных копий

## 7. Мониторинг и журналирование

### 7.1. Мониторинг

1. **Мониторинг работоспособности**
   - Проверка доступности основных эндпоинтов
   - Мониторинг времени отклика API
   - Оповещения при недоступности сервисов

2. **Мониторинг ресурсов**
   - Использование CPU, RAM, диска
   - Производительность базы данных
   - Пропускная способность сети

### 7.2. Журналирование

1. **Журналы приложений**
   - Структурированное журналирование (JSON формат)
   - Различные уровни детализации (DEBUG, INFO, ERROR)
   - Ротация журналов

2. **Централизованное журналирование**
   - Для MVP: локальное хранение журналов
   - В будущем: сбор журналов в централизованную систему (ELK Stack, Graylog)

## 8. Интеграция с внешними сервисами

### 8.1. Платежный шлюз

1. **Tinkoff Kassa**
   - Интеграция через API
   - Обработка webhook-уведомлений
   - Тестовый режим для разработки и тестирования

### 8.2. Email-сервис

1. **SendGrid или аналог**
   - Настройка DKIM, SPF для улучшения доставляемости
   - Шаблоны для различных типов уведомлений
   - Отслеживание статистики доставки

## 9. Безопасность инфраструктуры

### 9.1. Доступ к инфраструктуре

1. **SSH-доступ**
   - Аутентификация по ключам (отключение парольной аутентификации)
   - Доступ только с авторизованных IP-адресов
   - Многофакторная аутентификация для критических систем

2. **Управление доступом**
   - Принцип наименьших привилегий
   - Регулярный аудит доступа
   - Журналирование действий администраторов

### 9.2. Защита сети

1. **Брандмауэр**
   - Разрешение только необходимых портов
   - Блокировка доступа из подозрительных источников
   - Правила для защиты от распространенных атак

2. **HTTPS**
   - SSL/TLS сертификаты для всех публичных endpoint-ов
   - Автоматическое обновление сертификатов (Let's Encrypt)
   - Современные криптографические протоколы

### 9.3. Регулярные проверки безопасности

1. **Аудит зависимостей**
   - Регулярные проверки на уязвимости (npm audit)
   - Обновление зависимостей

2. **Аудит конфигурации**
   - Проверка конфигурационных файлов на безопасность
   - Удаление неиспользуемых сервисов и портов 