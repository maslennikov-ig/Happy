# Схема базы данных MVP Платформы для Предпринимателей

## 1. Обзор базы данных

### 1.1. Общая информация

- **СУБД**: PostgreSQL 15.x
- **ORM**: Prisma 5.x
- **Кодировка**: UTF-8
- **Схема миграций**: Управляется через Prisma Migrate

### 1.2. Основные принципы проектирования

- Нормализация данных до 3НФ (с компромиссами для производительности)
- Использование внешних ключей для обеспечения целостности данных
- Использование индексов для ускорения запросов
- Уникальные ограничения для предотвращения дублирования данных
- Soft delete (мягкое удаление) для критичных данных

## 2. Основные сущности

### 2.1. Диаграмма схемы базы данных

```
┌─────────────┐     ┌─────────────┐     ┌────────────┐     ┌────────────┐
│             │     │             │     │            │     │            │
│    User     │────▶│   Company   │◀────│  Employee  │     │   Request  │
│             │     │             │     │            │     │            │
└──────┬──────┘     └──────┬──────┘     └────────────┘     └─────┬──────┘
       │                   │                                      │
       │             ┌─────▼──────┐     ┌────────────┐     ┌─────▼──────┐
       │             │            │     │            │     │            │
       └────────────▶│   Tariff   │     │  Template  │◀────│ RequestLog │
                     │            │     │            │     │            │
                     └──────┬─────┘     └────────────┘     └────────────┘
                            │                 ▲
                     ┌──────▼─────┐          │
                     │            │          │
                     │  Payment   │          │
                     │            │          │
                     └──────┬─────┘          │
                            │                │
                     ┌──────▼─────┐     ┌────▼───────┐     ┌────────────┐
                     │            │     │            │     │            │
                     │Subscription│     │ Contractor │─────│  Category  │
                     │            │     │            │     │            │
                     └────────────┘     └────────────┘     └────────────┘
                                              │
                     ┌────────────┐           │
                     │            │           │
                     │ ChatRoom   │◀──────────┘
                     │            │
                     └─────┬──────┘
                           │
                     ┌─────▼──────┐
                     │            │
                     │  Message   │
                     │            │
                     └────────────┘
```

## 3. Описание таблиц

### 3.1. User (Пользователи)

Таблица для хранения данных пользователей системы.

| Поле | Тип | Описание | Ограничения |
|------|-----|----------|-------------|
| `id` | UUID | Уникальный идентификатор пользователя | PK |
| `email` | VARCHAR(255) | Email пользователя | UNIQUE, NOT NULL |
| `password_hash` | VARCHAR(255) | Хеш пароля | NOT NULL |
| `first_name` | VARCHAR(100) | Имя | NOT NULL |
| `last_name` | VARCHAR(100) | Фамилия | NOT NULL |
| `phone` | VARCHAR(20) | Телефон | UNIQUE, NULL |
| `avatar_url` | VARCHAR(255) | URL аватара | NULL |
| `role` | ENUM | Роль пользователя (USER, ADMIN, MANAGER) | NOT NULL, DEFAULT 'USER' |
| `is_email_verified` | BOOLEAN | Флаг верификации email | NOT NULL, DEFAULT false |
| `is_phone_verified` | BOOLEAN | Флаг верификации телефона | NOT NULL, DEFAULT false |
| `created_at` | TIMESTAMP | Дата создания | NOT NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Дата обновления | NOT NULL, DEFAULT NOW() |
| `deleted_at` | TIMESTAMP | Дата удаления | NULL |
| `last_login_at` | TIMESTAMP | Дата последнего входа | NULL |

**Индексы:**
- `email_idx` на поле `email`
- `phone_idx` на поле `phone`

### 3.2. Company (Компании)

Таблица для хранения данных о компаниях.

| Поле | Тип | Описание | Ограничения |
|------|-----|----------|-------------|
| `id` | UUID | Уникальный идентификатор компании | PK |
| `name` | VARCHAR(255) | Название компании | NOT NULL |
| `inn` | VARCHAR(12) | ИНН | UNIQUE, NULL |
| `ogrn` | VARCHAR(15) | ОГРН | UNIQUE, NULL |
| `legal_address` | VARCHAR(255) | Юридический адрес | NULL |
| `actual_address` | VARCHAR(255) | Фактический адрес | NULL |
| `owner_id` | UUID | ID владельца компании | FK → User.id, NOT NULL |
| `created_at` | TIMESTAMP | Дата создания | NOT NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Дата обновления | NOT NULL, DEFAULT NOW() |
| `deleted_at` | TIMESTAMP | Дата удаления | NULL |

**Индексы:**
- `owner_id_idx` на поле `owner_id`
- `inn_idx` на поле `inn`
- `name_idx` на поле `name`

### 3.3. Employee (Сотрудники компании)

Связующая таблица между пользователями и компаниями.

| Поле | Тип | Описание | Ограничения |
|------|-----|----------|-------------|
| `id` | UUID | Уникальный идентификатор сотрудника | PK |
| `user_id` | UUID | ID пользователя | FK → User.id, NOT NULL |
| `company_id` | UUID | ID компании | FK → Company.id, NOT NULL |
| `position` | VARCHAR(100) | Должность | NULL |
| `permissions` | JSONB | Права доступа | NULL |
| `created_at` | TIMESTAMP | Дата создания | NOT NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Дата обновления | NOT NULL, DEFAULT NOW() |
| `deleted_at` | TIMESTAMP | Дата удаления | NULL |

**Индексы:**
- `user_company_idx` на поля `user_id`, `company_id` (уникальный)

### 3.4. Tariff (Тарифы)

Таблица для хранения тарифных планов.

| Поле | Тип | Описание | Ограничения |
|------|-----|----------|-------------|
| `id` | UUID | Уникальный идентификатор тарифа | PK |
| `name` | VARCHAR(100) | Название тарифа | NOT NULL |
| `description` | TEXT | Описание тарифа | NULL |
| `price` | DECIMAL(10,2) | Стоимость тарифа | NOT NULL |
| `period` | ENUM | Период (MONTH, QUARTER, YEAR) | NOT NULL |
| `features` | JSONB | Список функций, доступных на тарифе | NOT NULL |
| `is_active` | BOOLEAN | Активен ли тариф | NOT NULL, DEFAULT true |
| `created_at` | TIMESTAMP | Дата создания | NOT NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Дата обновления | NOT NULL, DEFAULT NOW() |

**Индексы:**
- `is_active_idx` на поле `is_active`

### 3.5. Payment (Платежи)

Таблица для хранения данных о платежах.

| Поле | Тип | Описание | Ограничения |
|------|-----|----------|-------------|
| `id` | UUID | Уникальный идентификатор платежа | PK |
| `user_id` | UUID | ID пользователя | FK → User.id, NOT NULL |
| `company_id` | UUID | ID компании | FK → Company.id, NULL |
| `tariff_id` | UUID | ID тарифа | FK → Tariff.id, NOT NULL |
| `amount` | DECIMAL(10,2) | Сумма платежа | NOT NULL |
| `status` | ENUM | Статус платежа (PENDING, COMPLETED, FAILED, REFUNDED) | NOT NULL |
| `payment_method` | ENUM | Метод оплаты (CARD, INVOICE) | NOT NULL |
| `external_id` | VARCHAR(255) | Внешний ID платежа (от платежной системы) | NULL |
| `payment_data` | JSONB | Дополнительные данные о платеже | NULL |
| `created_at` | TIMESTAMP | Дата создания | NOT NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Дата обновления | NOT NULL, DEFAULT NOW() |

**Индексы:**
- `user_id_idx` на поле `user_id`
- `company_id_idx` на поле `company_id`
- `external_id_idx` на поле `external_id`
- `status_idx` на поле `status`

### 3.6. Subscription (Подписки)

Таблица для хранения данных о подписках на тарифы.

| Поле | Тип | Описание | Ограничения |
|------|-----|----------|-------------|
| `id` | UUID | Уникальный идентификатор подписки | PK |
| `user_id` | UUID | ID пользователя | FK → User.id, NOT NULL |
| `company_id` | UUID | ID компании | FK → Company.id, NULL |
| `tariff_id` | UUID | ID тарифа | FK → Tariff.id, NOT NULL |
| `payment_id` | UUID | ID последнего платежа | FK → Payment.id, NULL |
| `start_date` | TIMESTAMP | Дата начала подписки | NOT NULL |
| `end_date` | TIMESTAMP | Дата окончания подписки | NOT NULL |
| `is_auto_renewal` | BOOLEAN | Автоматическое продление | NOT NULL, DEFAULT false |
| `status` | ENUM | Статус подписки (ACTIVE, CANCELED, EXPIRED) | NOT NULL |
| `created_at` | TIMESTAMP | Дата создания | NOT NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Дата обновления | NOT NULL, DEFAULT NOW() |

**Индексы:**
- `user_id_idx` на поле `user_id`
- `company_id_idx` на поле `company_id`
- `status_idx` на поле `status`
- `end_date_idx` на поле `end_date`

### 3.7. Category (Категории)

Таблица для хранения категорий подрядчиков и шаблонов.

| Поле | Тип | Описание | Ограничения |
|------|-----|----------|-------------|
| `id` | UUID | Уникальный идентификатор категории | PK |
| `name` | VARCHAR(100) | Название категории | NOT NULL |
| `description` | TEXT | Описание категории | NULL |
| `parent_id` | UUID | ID родительской категории | FK → Category.id, NULL |
| `type` | ENUM | Тип категории (CONTRACTOR, TEMPLATE) | NOT NULL |
| `created_at` | TIMESTAMP | Дата создания | NOT NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Дата обновления | NOT NULL, DEFAULT NOW() |

**Индексы:**
- `parent_id_idx` на поле `parent_id`
- `type_idx` на поле `type`

### 3.8. Contractor (Подрядчики)

Таблица для хранения данных о подрядчиках.

| Поле | Тип | Описание | Ограничения |
|------|-----|----------|-------------|
| `id` | UUID | Уникальный идентификатор подрядчика | PK |
| `name` | VARCHAR(255) | Название компании/ФИО подрядчика | NOT NULL |
| `description` | TEXT | Описание подрядчика | NULL |
| `contacts` | JSONB | Контактные данные | NOT NULL |
| `category_id` | UUID | ID категории | FK → Category.id, NOT NULL |
| `rating` | DECIMAL(3,2) | Рейтинг подрядчика | NULL |
| `is_verified` | BOOLEAN | Проверен ли подрядчик | NOT NULL, DEFAULT false |
| `created_at` | TIMESTAMP | Дата создания | NOT NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Дата обновления | NOT NULL, DEFAULT NOW() |
| `deleted_at` | TIMESTAMP | Дата удаления | NULL |

**Индексы:**
- `category_id_idx` на поле `category_id`
- `is_verified_idx` на поле `is_verified`
- `rating_idx` на поле `rating`

### 3.9. Template (Шаблоны документов)

Таблица для хранения шаблонов документов.

| Поле | Тип | Описание | Ограничения |
|------|-----|----------|-------------|
| `id` | UUID | Уникальный идентификатор шаблона | PK |
| `title` | VARCHAR(255) | Название шаблона | NOT NULL |
| `description` | TEXT | Описание шаблона | NULL |
| `category_id` | UUID | ID категории | FK → Category.id, NOT NULL |
| `file_url` | VARCHAR(255) | Ссылка на файл шаблона | NOT NULL |
| `file_type` | ENUM | Тип файла (DOCX, PDF, XLS) | NOT NULL |
| `variables` | JSONB | Переменные для замены в шаблоне | NULL |
| `is_premium` | BOOLEAN | Доступен только на премиум-тарифе | NOT NULL, DEFAULT false |
| `created_at` | TIMESTAMP | Дата создания | NOT NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Дата обновления | NOT NULL, DEFAULT NOW() |
| `deleted_at` | TIMESTAMP | Дата удаления | NULL |

**Индексы:**
- `category_id_idx` на поле `category_id`
- `is_premium_idx` на поле `is_premium`

### 3.10. Request (Запросы на услуги)

Таблица для хранения запросов на услуги.

| Поле | Тип | Описание | Ограничения |
|------|-----|----------|-------------|
| `id` | UUID | Уникальный идентификатор запроса | PK |
| `title` | VARCHAR(255) | Заголовок запроса | NOT NULL |
| `description` | TEXT | Описание запроса | NOT NULL |
| `user_id` | UUID | ID пользователя-автора | FK → User.id, NOT NULL |
| `company_id` | UUID | ID компании | FK → Company.id, NULL |
| `status` | ENUM | Статус запроса (NEW, IN_PROGRESS, COMPLETED, CANCELED) | NOT NULL, DEFAULT 'NEW' |
| `priority` | ENUM | Приоритет (LOW, MEDIUM, HIGH) | NOT NULL, DEFAULT 'MEDIUM' |
| `deadline` | TIMESTAMP | Крайний срок | NULL |
| `manager_id` | UUID | ID консьерж-менеджера | FK → User.id, NULL |
| `contractor_id` | UUID | ID подрядчика | FK → Contractor.id, NULL |
| `attachments` | JSONB | Прикрепленные файлы | NULL |
| `created_at` | TIMESTAMP | Дата создания | NOT NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Дата обновления | NOT NULL, DEFAULT NOW() |
| `deleted_at` | TIMESTAMP | Дата удаления | NULL |

**Индексы:**
- `user_id_idx` на поле `user_id`
- `company_id_idx` на поле `company_id`
- `status_idx` на поле `status`
- `manager_id_idx` на поле `manager_id`
- `contractor_id_idx` на поле `contractor_id`

### 3.11. RequestLog (Журнал изменений запросов)

Таблица для отслеживания истории изменений запросов.

| Поле | Тип | Описание | Ограничения |
|------|-----|----------|-------------|
| `id` | UUID | Уникальный идентификатор записи | PK |
| `request_id` | UUID | ID запроса | FK → Request.id, NOT NULL |
| `user_id` | UUID | ID пользователя, внесшего изменения | FK → User.id, NOT NULL |
| `action` | ENUM | Тип действия (CREATE, UPDATE, STATUS_CHANGE) | NOT NULL |
| `previous_data` | JSONB | Предыдущие данные | NULL |
| `new_data` | JSONB | Новые данные | NULL |
| `comment` | TEXT | Комментарий к изменению | NULL |
| `created_at` | TIMESTAMP | Дата создания | NOT NULL, DEFAULT NOW() |

**Индексы:**
- `request_id_idx` на поле `request_id`
- `user_id_idx` на поле `user_id`

### 3.12. ChatRoom (Чаты)

Таблица для хранения данных о чатах.

| Поле | Тип | Описание | Ограничения |
|------|-----|----------|-------------|
| `id` | UUID | Уникальный идентификатор чата | PK |
| `name` | VARCHAR(255) | Название чата | NULL |
| `type` | ENUM | Тип чата (REQUEST, DIRECT, GROUP) | NOT NULL |
| `request_id` | UUID | ID запроса (для чатов по запросам) | FK → Request.id, NULL |
| `contractor_id` | UUID | ID подрядчика (для чатов с подрядчиками) | FK → Contractor.id, NULL |
| `created_at` | TIMESTAMP | Дата создания | NOT NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Дата обновления | NOT NULL, DEFAULT NOW() |

**Индексы:**
- `request_id_idx` на поле `request_id`
- `contractor_id_idx` на поле `contractor_id`

### 3.13. ChatParticipant (Участники чатов)

Связующая таблица между пользователями и чатами.

| Поле | Тип | Описание | Ограничения |
|------|-----|----------|-------------|
| `id` | UUID | Уникальный идентификатор записи | PK |
| `chat_room_id` | UUID | ID чата | FK → ChatRoom.id, NOT NULL |
| `user_id` | UUID | ID пользователя | FK → User.id, NOT NULL |
| `role` | ENUM | Роль в чате (OWNER, MEMBER) | NOT NULL, DEFAULT 'MEMBER' |
| `last_read_message_id` | UUID | ID последнего прочитанного сообщения | FK → Message.id, NULL |
| `created_at` | TIMESTAMP | Дата добавления | NOT NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Дата обновления | NOT NULL, DEFAULT NOW() |

**Индексы:**
- `chat_user_idx` на поля `chat_room_id`, `user_id` (уникальный)

### 3.14. Message (Сообщения)

Таблица для хранения сообщений в чатах.

| Поле | Тип | Описание | Ограничения |
|------|-----|----------|-------------|
| `id` | UUID | Уникальный идентификатор сообщения | PK |
| `chat_room_id` | UUID | ID чата | FK → ChatRoom.id, NOT NULL |
| `sender_id` | UUID | ID отправителя | FK → User.id, NOT NULL |
| `content` | TEXT | Текст сообщения | NOT NULL |
| `attachments` | JSONB | Прикрепленные файлы | NULL |
| `is_system` | BOOLEAN | Системное ли сообщение | NOT NULL, DEFAULT false |
| `created_at` | TIMESTAMP | Дата создания | NOT NULL, DEFAULT NOW() |
| `updated_at` | TIMESTAMP | Дата обновления | NOT NULL, DEFAULT NOW() |
| `deleted_at` | TIMESTAMP | Дата удаления | NULL |

**Индексы:**
- `chat_room_id_idx` на поле `chat_room_id`
- `sender_id_idx` на поле `sender_id`
- `chat_created_idx` на поля `chat_room_id`, `created_at`

## 4. Миграции и управление схемой

### 4.1. Prisma Schema

Схема базы данных определена в файле `schema.prisma` и управляется через Prisma ORM.

```prisma
// Пример определения моделей в Prisma

model User {
  id                String          @id @default(uuid()) @db.Uuid
  email             String          @unique
  passwordHash      String          @map("password_hash")
  firstName         String          @map("first_name")
  lastName          String          @map("last_name")
  phone             String?         @unique
  avatarUrl         String?         @map("avatar_url")
  role              Role            @default(USER)
  isEmailVerified   Boolean         @default(false) @map("is_email_verified")
  isPhoneVerified   Boolean         @default(false) @map("is_phone_verified")
  createdAt         DateTime        @default(now()) @map("created_at")
  updatedAt         DateTime        @updatedAt @map("updated_at")
  deletedAt         DateTime?       @map("deleted_at")
  lastLoginAt       DateTime?       @map("last_login_at")
  
  // Отношения
  companies         Company[]
  employees         Employee[]
  payments          Payment[]
  subscriptions     Subscription[]
  requestsCreated   Request[]       @relation("RequestCreator")
  requestsManaged   Request[]       @relation("RequestManager")
  requestLogs       RequestLog[]
  messages          Message[]
  chatParticipants  ChatParticipant[]

  @@map("users")
}

enum Role {
  USER
  ADMIN
  MANAGER
}
```

### 4.2. Миграции

Миграции создаются и применяются через Prisma Migrate:

```bash
# Создание миграции
npx prisma migrate dev --name init

# Применение миграций на production
npx prisma migrate deploy
```

### 4.3. Заполнение начальными данными

Начальные данные (admin пользователь, базовые тарифы, категории) загружаются через seed-скрипты:

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Создание admin пользователя
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash: await bcrypt.hash('adminPassword123', 10),
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isEmailVerified: true
    }
  });

  // Создание базовых тарифов
  const basicTariff = await prisma.tariff.create({
    data: {
      name: 'Базовый',
      description: 'Базовый тариф для малого бизнеса',
      price: 1990.00,
      period: 'MONTH',
      features: {
        requestsLimit: 10,
        templatesAccess: true,
        premiumTemplates: false
      },
      isActive: true
    }
  });

  // ... другие seed-данные
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## 5. Индексирование и оптимизация

### 5.1. Стратегия индексирования

- Первичные ключи: UUID для всех таблиц
- Внешние ключи: индексы на всех полях внешних ключей
- Поля часто используемые в фильтрации: `status`, `is_active`, `created_at`
- Составные индексы для часто используемых сочетаний полей в WHERE

### 5.2. Оптимизация запросов

- Использование Prisma для генерации оптимальных запросов
- Установка разумных лимитов на выборку данных
- Пагинация для больших наборов данных
- Кэширование часто используемых данных в Redis
- Использование JSONB для хранения произвольных структур данных 