# Docker Setup для TalkMetrics

## Требования

- Docker
- Docker Compose

## Быстрый старт

### 1. Настройка переменных окружения

Скопируйте файл с переменными окружения:
```bash
cp .env.docker .env
```

Отредактируйте `.env` файл и заполните необходимые значения:
- `OPENAI_API_KEY` - ваш API ключ OpenAI
- `WHATSAPP_API_TOKEN` - токен WhatsApp API
- `JWT_SECRET` - секретный ключ для JWT (используйте сильный пароль)
- `SESSION_SECRET` - секретный ключ для сессий (используйте сильный пароль)

### 2. Запуск в production режиме

```bash
# Сборка и запуск всех сервисов
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановка
docker-compose down
```

### 3. Запуск в development режиме

```bash
# Сборка и запуск в режиме разработки
docker-compose -f docker-compose.dev.yml up -d

# Просмотр логов
docker-compose -f docker-compose.dev.yml logs -f

# Остановка
docker-compose -f docker-compose.dev.yml down
```

## Сервисы

После запуска доступны следующие сервисы:

- **Frontend**: http://localhost:4000
- **Backend API**: http://localhost:4001
- **PostgreSQL**: localhost:5434

## Структура

```
talk_metrics/
├── docker-compose.yml          # Production конфигурация
├── docker-compose.dev.yml      # Development конфигурация
├── .env.docker                 # Шаблон переменных окружения
├── backend/
│   ├── Dockerfile             # Production Dockerfile для backend
│   └── ...
├── frontend/
│   ├── Dockerfile             # Production Dockerfile для frontend
│   ├── Dockerfile.dev         # Development Dockerfile для frontend
│   ├── nginx.conf             # Nginx конфигурация
│   └── ...
└── database/
    ├── docker-compose.yml     # Standalone database
    ├── schema.sql
    └── seed.sql
```

## Полезные команды

```bash
# Пересборка сервисов
docker-compose build

# Запуск только базы данных
docker-compose up postgres

# Выполнение команд в контейнерах
docker-compose exec backend npm run lint
docker-compose exec frontend npm run build

# Просмотр состояния контейнеров
docker-compose ps

# Очистка volumes (ВНИМАНИЕ: удалит все данные!)
docker-compose down -v
```

## Отладка

### Проверка логов
```bash
# Все сервисы
docker-compose logs

# Конкретный сервис
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres
```

### Подключение к контейнерам
```bash
# Backend
docker-compose exec backend sh

# Frontend
docker-compose exec frontend sh

# База данных
docker-compose exec postgres psql -U talk_metrics_user -d talk_metrics
```

### Проверка сети
```bash
# Проверка подключения между сервисами
docker-compose exec backend ping postgres
docker-compose exec frontend ping backend
```

## Производственное развертывание

Для production развертывания:

1. Используйте сильные пароли в `.env`
2. Настройте SSL/TLS
3. Используйте внешнюю базу данных для высокой доступности
4. Настройте monitoring и logging
5. Регулярно обновляйте образы

```bash
# Production запуск
docker-compose -f docker-compose.yml up -d
```