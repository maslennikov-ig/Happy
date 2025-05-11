# Архитектура MVP Платформы для Предпринимателей

## 1. Общая архитектура системы

### 1.1. Архитектурная схема

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│                │     │                │     │                │
│   Клиентская   │     │   API-шлюз     │     │   Сервисная    │
│   часть        │◄───►│   (Backend)    │◄───►│   база данных  │
│   (Frontend)   │     │                │     │                │
│                │     │                │     │                │
└────────────────┘     └───────┬────────┘     └────────────────┘
                                │
                                │
                       ┌────────▼────────┐
                       │                 │
                       │   Внешние       │
                       │   интеграции    │
                       │                 │
                       └─────────────────┘
```

### 1.2. Основные компоненты

MVP Платформы для Предпринимателей состоит из следующих основных компонентов:

1. **Клиентская часть (Frontend)**
   - React/TypeScript приложение на базе Next.js
   - App Router для маршрутизации
   - Tailwind CSS и библиотека компонентов shadcn/ui для стилизации
   - Компонентная архитектура, ориентированная на переиспользование

2. **API-шлюз (Backend)**
   - NestJS/TypeScript приложение
   - Модульная архитектура
   - RESTful API
   - JWT-аутентификация
   - Валидация DTO
   - Middleware и Guards для безопасности

3. **Сервисная база данных**
   - PostgreSQL
   - Управление через Prisma ORM
   - Миграции для отслеживания изменений схемы

4. **Внешние интеграции MVP**
   - Платежный шлюз (Tinkoff Kassa)
   - Email-сервис для уведомлений

## 2. Клиентская архитектура (Frontend)

### 2.1. Структура директорий

```
frontend/
│
├── app/                      # Next.js App Router
│   ├── (auth)/               # Страницы аутентификации (логин, регистрация, восст. пароля)
│   ├── (marketing)/          # Публичные маркетинговые страницы
│   ├── dashboard/            # Страницы личного кабинета предпринимателя
│   ├── concierge/            # Страницы интерфейса консьерж-менеджера
│   ├── admin/                # Страницы админ-панели
│   ├── api/                  # API роуты (если потребуются)
│   └── layout.tsx            # Корневой layout
│
├── components/               # React компоненты
│   ├── ui/                   # Базовые UI компоненты (shadcn/ui)
│   ├── shared/               # Общие компоненты (шапка, подвал, навигация)
│   ├── auth/                 # Компоненты авторизации (формы, защищенные роуты)
│   ├── dashboard/            # Компоненты дашборда
│   ├── requests/             # Компоненты для работы с запросами
│   ├── chat/                 # Компоненты чата
│   ├── contractors/          # Компоненты для работы с подрядчиками
│   └── templates/            # Компоненты для работы с шаблонами
│
├── lib/                      # Вспомогательные функции и утилиты
│   ├── api/                  # Обертки для API запросов
│   ├── auth/                 # Утилиты аутентификации
│   ├── validations/          # Схемы валидации с Zod
│   └── utils/                # Общие утилиты
│
├── hooks/                    # React хуки
│   ├── useAuth.ts            # Хук для работы с аутентификацией
│   ├── useRequests.ts        # Хук для работы с запросами
│   └── useForm.ts            # Обертка для react-hook-form
│
├── context/                  # React контексты
│   ├── AuthContext.tsx       # Контекст аутентификации
│   └── NotificationContext.tsx # Контекст уведомлений
│
├── styles/                   # Глобальные стили
│   └── globals.css           # Глобальные CSS стили и конфигурация Tailwind
│
├── public/                   # Статические файлы
│
├── middleware.ts             # Next.js middleware (защита маршрутов)
│
└── конфигурационные файлы    # package.json, next.config.js, tailwind.config.js и т.д.
```

### 2.2. Стратегия управления состоянием

1. **Локальное состояние компонентов**
   - Используем React state (useState, useReducer) для состояния отдельных компонентов

2. **Глобальное состояние**
   - React Context API для основных глобальных состояний (аутентификация, уведомления)
   - Может быть расширено до использования Zustand для более сложных сценариев

3. **Состояние сервера**
   - Кэширование и инвалидация данных через SWR или React Query
   - Оптимистичные обновления UI для улучшения UX

### 2.3. Обработка аутентификации на клиенте

1. **Хранение токенов**
   - Access token хранится в памяти (React state + Context)
   - Refresh token обрабатывается через httpOnly cookie
   
2. **Защита маршрутов**
   - Next.js middleware для защиты разделов, требующих аутентификации
   - Компоненты-обертки для дополнительной защиты по ролям

3. **Перехват ошибок аутентификации**
   - Автоматическое обновление через refresh token при истечении access token
   - Перенаправление на страницу входа при полной деаутентификации

## 3. Серверная архитектура (Backend)

### 3.1. Структура директорий

```
backend/
│
├── src/
│   ├── main.ts              # Точка входа приложения
│   ├── app.module.ts        # Корневой модуль приложения
│   │
│   ├── config/              # Конфигурация приложения
│   │   ├── env.validation.ts  # Валидация переменных окружения
│   │   └── app.config.ts      # Конфигурация приложения
│   │
│   ├── auth/                # Модуль аутентификации
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── strategies/      # JWT стратегии
│   │   ├── guards/          # Guards аутентификации
│   │   └── dto/             # DTO для аутентификации
│   │
│   ├── users/               # Модуль пользователей
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── dto/             # DTO для пользователей
│   │
│   ├── companies/           # Модуль компаний
│   │   ├── companies.module.ts
│   │   ├── companies.controller.ts
│   │   ├── companies.service.ts
│   │   ├── guards/          # Guards для проверки владельца компании
│   │   └── dto/             # DTO для компаний
│   │
│   ├── requests/            # Модуль запросов
│   │   ├── requests.module.ts
│   │   ├── requests.controller.ts
│   │   ├── requests.service.ts
│   │   ├── guards/          # Guards для проверки доступа к запросам
│   │   └── dto/             # DTO для запросов
│   │
│   ├── chat/                # Модуль чата
│   │   ├── chat.module.ts
│   │   ├── chat.controller.ts
│   │   ├── chat.service.ts
│   │   └── dto/             # DTO для чата
│   │
│   ├── contractors/         # Модуль подрядчиков
│   │   ├── contractors.module.ts
│   │   ├── contractors.controller.ts
│   │   ├── contractors.service.ts
│   │   └── dto/             # DTO для подрядчиков
│   │
│   ├── templates/           # Модуль шаблонов документов
│   │   ├── templates.module.ts
│   │   ├── templates.controller.ts
│   │   ├── templates.service.ts
│   │   └── dto/             # DTO для шаблонов
│   │
│   ├── payments/            # Модуль платежей
│   │   ├── payments.module.ts
│   │   ├── payments.controller.ts
│   │   ├── payments.service.ts
│   │   ├── strategies/      # Стратегии интеграции с платежными шлюзами
│   │   └── dto/             # DTO для платежей
│   │
│   ├── tariffs/             # Модуль тарифов
│   │   ├── tariffs.module.ts
│   │   ├── tariffs.controller.ts
│   │   ├── tariffs.service.ts
│   │   └── dto/             # DTO для тарифов
│   │
│   ├── notifications/       # Модуль уведомлений
│   │   ├── notifications.module.ts
│   │   ├── notifications.controller.ts
│   │   ├── notifications.service.ts
│   │   ├── channels/        # Каналы уведомлений (email, внутрисистемные)
│   │   └── dto/             # DTO для уведомлений
│   │
│   ├── admin/               # Модуль администрирования
│   │   ├── admin.module.ts
│   │   ├── admin.controller.ts
│   │   ├── admin.service.ts
│   │   └── dto/             # DTO для админ-функций
│   │
│   ├── files/               # Модуль для работы с файлами
│   │   ├── files.module.ts
│   │   ├── files.controller.ts
│   │   ├── files.service.ts  # Обработка, хранение, доступ к файлам
│   │   └── dto/             # DTO для файлов
│   │
│   └── common/              # Общие функции и утилиты
│       ├── decorators/      # Пользовательские декораторы
│       ├── filters/         # Фильтры исключений
│       ├── guards/          # Общие guards
│       ├── interceptors/    # Перехватчики
│       └── utils/           # Утилиты
│
├── prisma/                  # Prisma ORM
│   ├── schema.prisma        # Схема базы данных
│   ├── migrations/          # Миграции
│   └── seed.ts              # Скрипт начального наполнения БД
│
├── test/                    # Тесты
│   ├── e2e/                 # E2E тесты
│   └── unit/                # Unit тесты
│
└── конфигурационные файлы   # package.json, nest-cli.json, tsconfig.json и т.д.
```

### 3.2. Модульная архитектура NestJS

В соответствии с принципами NestJS, бэкенд организован в модули, каждый из которых инкапсулирует связанную функциональность:

1. **Модульная структура**
   - Каждый функциональный блок выделен в отдельный модуль
   - Явная декларация зависимостей между модулями
   - Возможность повторного использования модулей

2. **Слои в модулях**
   - Controller: обработка HTTP-запросов, маршрутизация
   - Service: бизнес-логика
   - Repository: взаимодействие с базой данных (через Prisma)
   - DTO: объекты передачи данных для валидации и типизации
   - Entity/Model: представление сущностей базы данных (через Prisma)

3. **Инверсия зависимостей**
   - Dependency Injection для управления зависимостями между компонентами
   - Возможность подмены реализаций для тестирования

### 3.3. API-шаблоны и практики

1. **RESTful API**
   - Использование стандартных HTTP-методов (GET, POST, PUT, DELETE)
   - Ресурсно-ориентированные эндпоинты
   - Стандартизированные ответы и коды ошибок

2. **Валидация и трансформация**
   - Валидация входящих данных через DTO и class-validator
   - Трансформация данных через class-transformer
   - Строгая типизация с TypeScript

3. **Безопасность**
   - Аутентификация через JWT
   - Авторизация через Guards и декораторы
   - Валидация и санитизация пользовательского ввода
   - Защита от известных атак (CSRF, XSS, SQL-инъекции)

## 4. Модель данных

### 4.1. Схема базы данных (Prisma Schema)

Основные сущности системы и их связи:

```prisma
// Упрощенное представление схемы Prisma для MVP

model User {
  id                 String    @id @default(uuid())
  email              String    @unique
  passwordHash       String
  firstName          String
  lastName           String
  role               Role      @default(ENTREPRENEUR)
  companyId          String?
  company            Company?  @relation(fields: [companyId], references: [id])
  phone              String?
  isEmailVerified    Boolean   @default(false)
  isActive           Boolean   @default(true)
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  resetPasswordToken String?
  resetPasswordExpires DateTime?
  
  // Связи с другими сущностями
  clientRequests     Request[] @relation("ClientRequests")
  conciergeRequests  Request[] @relation("ConciergeRequests")
  chatMessages       ChatMessage[]
  notifications      Notification[]
  payments           Payment[]
}

model Company {
  id                 String    @id @default(uuid())
  name               String
  inn                String?
  description        String?
  address            String?
  ownerId            String    @unique
  owner              User      @relation(fields: [ownerId], references: [id])
  tariffPlanId       String?
  tariffPlan         TariffPlan? @relation(fields: [tariffPlanId], references: [id])
  subscriptionEndDate DateTime?
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  
  // Связи с другими сущностями
  employees          User[]
  requests           Request[]
  payments           Payment[]
}

model Request {
  id                 String    @id @default(uuid())
  title              String
  description        String
  category           String
  status             RequestStatus @default(NEW)
  priority           Priority?
  desiredDueDate     DateTime?
  budget             String?
  expectedResult     String
  clientId           String
  client             User      @relation("ClientRequests", fields: [clientId], references: [id])
  companyId          String
  company            Company   @relation(fields: [companyId], references: [id])
  conciergeId        String?
  concierge          User?     @relation("ConciergeRequests", fields: [conciergeId], references: [id])
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  
  // Связи с другими сущностями
  files              RequestFile[]
  chatMessages       ChatMessage[]
}

model RequestFile {
  id                 String    @id @default(uuid())
  requestId          String
  request            Request   @relation(fields: [requestId], references: [id])
  fileName           String
  fileUrl            String
  fileSize           Int
  mimeType           String
  uploadedAt         DateTime  @default(now())
}

model Contractor {
  id                 String    @id @default(uuid())
  name               String
  logoUrl            String?
  shortDescription   String
  specializations    String[]
  servicesDescription String
  cases              String
  reviews            String
  rating             Float?
  isActive           Boolean   @default(true)
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
}

model DocumentTemplate {
  id                 String    @id @default(uuid())
  title              String
  description        String?
  category           String?
  fileUrl            String
  fileName           String
  lastUpdatedAt      DateTime  @default(now())
  isActive           Boolean   @default(true)
  createdAt          DateTime  @default(now())
}

model TariffPlan {
  id                 String    @id @default(uuid())
  name               String    @unique
  description        String
  priceMonthly       Decimal
  priceYearly        Decimal?
  features           Json
  isActive           Boolean   @default(true)
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  
  // Связи с другими сущностями
  companies          Company[]
  payments           Payment[]
}

model Payment {
  id                 String    @id @default(uuid())
  userId             String
  user               User      @relation(fields: [userId], references: [id])
  companyId          String
  company            Company   @relation(fields: [companyId], references: [id])
  tariffPlanId       String?
  tariffPlan         TariffPlan? @relation(fields: [tariffPlanId], references: [id])
  amount             Decimal
  currency           String    @default("RUB")
  status             PaymentStatus
  paymentGateway     String
  gatewayPaymentId   String
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
}

model Notification {
  id                 String    @id @default(uuid())
  userId             String
  user               User      @relation(fields: [userId], references: [id])
  type               NotificationType
  message            String
  relatedEntityId    String?
  isRead             Boolean   @default(false)
  createdAt          DateTime  @default(now())
}

model ChatMessage {
  id                 String    @id @default(uuid())
  requestId          String
  request            Request   @relation(fields: [requestId], references: [id])
  senderId           String
  sender             User      @relation(fields: [senderId], references: [id])
  messageText        String
  createdAt          DateTime  @default(now())
  isReadByReceiver   Boolean   @default(false)
  fileUrl            String?
}

// Перечисления (Enums)
enum Role {
  ENTREPRENEUR
  EMPLOYEE
  CONCIERGE
  ADMIN
}

enum RequestStatus {
  NEW
  IN_PROGRESS
  NEEDS_CLARIFICATION
  WAITING_FOR_CLIENT
  WITH_CONTRACTOR
  COMPLETED
  CANCELED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}

enum PaymentStatus {
  PENDING
  SUCCEEDED
  FAILED
}

enum NotificationType {
  NEW_MESSAGE
  REQUEST_STATUS_CHANGED
  PAYMENT_SUCCESSFUL
  PAYMENT_FAILED
  PAYMENT_REMINDER
  EMPLOYEE_INVITED
  // другие типы
}
```

### 4.2. Доступ к данным через Prisma ORM

1. **Преимущества Prisma ORM**
   - Типобезопасный доступ к данным
   - Автогенерация клиента на основе схемы
   - Встроенные миграции
   - Интеграция с TypeScript

2. **Шаблоны доступа к данным**
   - Инкапсуляция запросов к БД в сервисах
   - Использование транзакций для атомарных операций
   - Оптимизация запросов через включение связей (include)
   - Пагинация для списков

## 5. Безопасность

### 5.1. Аутентификация и авторизация

1. **Аутентификация**
   - Регистрация пользователей с валидацией
   - Вход по email/паролю
   - JWT (access token + refresh token)
   - Сброс пароля через email

2. **Авторизация**
   - RBAC (Role-Based Access Control) на основе ролей пользователей
   - Проверка прав доступа через Guards
   - Защита от несанкционированного доступа к ресурсам других компаний/пользователей

### 5.2. Защита данных

1. **Защита от внешних угроз**
   - Защита от CSRF через токены
   - Защита от XSS через санитизацию ввода
   - Защита от SQL-инъекций через ORM
   - HTTPS для всего трафика

2. **Обработка чувствительных данных**
   - Хеширование паролей (bcrypt/Argon2)
   - Безопасное хранение JWT
   - Ограниченное время жизни токенов
   - Валидация пользовательского ввода

### 5.3. Уязвимости и методы защиты

MVP реализует защиту от основных веб-уязвимостей (OWASP Top 10):

1. **Инъекции**
   - Использование ORM и параметризованных запросов
   - Валидация и санитизация пользовательского ввода

2. **Сломанная аутентификация**
   - Надежное хранение паролей
   - Защита сессий через JWT
   - Блокировка после неудачных попыток входа

3. **Чувствительные данные**
   - Шифрование чувствительных данных
   - HTTPS для передачи данных
   - Безопасная обработка платежной информации

4. **XXE, XSS, CSRF**
   - Защита через заголовки CSP
   - CSRF-токены
   - Санитизация пользовательского ввода

5. **Небезопасная конфигурация**
   - Безопасные настройки по умолчанию
   - Правила безопасности для загрузки файлов
   - Контроль доступа к API

## 6. Интеграции

### 6.1. Платежный шлюз (MVP)

Интеграция с Tinkoff Kassa для обработки платежей:

1. **Функциональность**
   - Оплата подписок
   - Регулярные (рекуррентные) платежи
   - Обработка уведомлений о платежах
   - Генерация квитанций/чеков

2. **Технические аспекты**
   - REST API интеграция
   - Webhook для уведомлений
   - Безопасная обработка платежных данных
   - Журналирование операций

### 6.2. Email-сервис

Интеграция с сервисом отправки email (SendGrid или аналог):

1. **Функциональность**
   - Подтверждение регистрации
   - Сброс пароля
   - Уведомления об изменении статуса запросов
   - Уведомления о новых сообщениях
   - Напоминания о платежах

2. **Технические аспекты**
   - Шаблоны email-сообщений
   - Очередь отправки сообщений
   - Отслеживание доставки
   - Ограничение частоты отправки

### 6.3. Взаимодействие между Frontend и Backend

1. **REST API**
   - JSON формат данных
   - JWT для аутентификации
   - Стандартизованные ответы и ошибки

2. **Безопасность взаимодействия**
   - CORS настройки
   - HTTPS для всех взаимодействий
   - Защита от атак

## 7. Стратегия развертывания

### 7.1. Окружения разработки

1. **Локальная разработка**
   - Docker для изоляции окружения
   - Docker Compose для оркестрации
   - Локальные .env файлы

2. **CI/CD**
   - Автоматические проверки при коммите
   - Линтинг и тесты
   - Сборка и развертывание

### 7.2. Непрерывная интеграция

1. **Проверки качества кода**
   - ESLint для JS/TS
   - Prettier для форматирования
   - Запуск тестов

2. **Автоматические тесты**
   - Unit-тесты
   - Интеграционные тесты
   - Тесты API

### 7.3. Будущие соображения по масштабированию

1. **Горизонтальное масштабирование**
   - Подготовка к будущему росту нагрузки
   - Stateless архитектура API
   - Возможность запуска нескольких инстансов

2. **Кэширование**
   - Потенциальное внедрение Redis
   - Стратегии кэширования для часто запрашиваемых данных

3. **Оптимизация базы данных**
   - Индексирование критических полей
   - Партиционирование данных (при необходимости)
   - Мониторинг производительности запросов 