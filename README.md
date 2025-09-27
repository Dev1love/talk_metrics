# TalkMetrics

TalkMetrics — это прототип системы анализа качества коммуникации в мессенджерах WhatsApp и Telegram.

## Описание проекта

TalkMetrics позволяет загружать и анализировать чаты из мессенджеров для автоматического расчета метрик качества коммуникации и генерации инсайтов с рекомендациями по улучшению.

### Основные возможности

- **Загрузка чатов**: Поддержка файлов .txt и .json из WhatsApp и Telegram
- **API интеграция**: Подключение к WhatsApp через сторонние API (например, Wazzup)
- **Парсинг и нормализация**: Обработка переписок с нормализацией участников и временных меток
- **Автоматический расчет метрик**:
  - Время первого ответа
  - Среднее время ответа
  - Время до закрытия запроса
  - Доля завершённых диалогов
  - Конверсия в бронирование/оплату
  - Доля предложений допродаж
- **Индекс качества коммуникации (CCI)**: Сводный индекс от 0 до 100
- **AI анализ**: Определение интенций сообщений и оценка вежливости ответов
- **Дашборд**: React Web/PWA интерфейс с карточками метрик и инсайтами
- **Экспорт отчетов**: Выгрузка в PDF и CSV форматах

### Технологический стек

- **Frontend**: React (Web/PWA)
- **Backend**: Node.js
- **База данных**: PostgreSQL
- **AI интеграция**: GPT API или аналоги
- **Архитектура**: Монорепозиторий

### Структура проекта

```
talk_metrics/
├── backend/              # Node.js API сервер
│   ├── src/             # Исходный код backend
│   ├── Dockerfile       # Docker образ для production
│   └── .env.example     # Пример конфигурации
├── frontend/            # React приложение
│   ├── src/             # Исходный код frontend
│   ├── Dockerfile       # Docker образ для production
│   ├── Dockerfile.dev   # Docker образ для development
│   └── nginx.conf       # Конфигурация Nginx
├── database/            # SQL схемы и миграции
│   ├── docker-compose.yml  # Standalone PostgreSQL
│   ├── schema.sql       # Схема базы данных
│   └── seed.sql         # Тестовые данные
├── scripts/             # Вспомогательные скрипты
│   └── docker-check.sh  # Проверка Docker настройки
├── docker-compose.yml   # Production конфигурация
├── docker-compose.dev.yml  # Development конфигурация
├── .env.docker         # Шаблон переменных окружения
├── README.md           # Описание проекта
├── README.docker.md    # Руководство по Docker
├── requirements.md     # Пользовательские истории
└── task.md            # Чеклист задач
```

### Цель прототипа

Демонстрация рабочего сценария:
1. Загрузка тестовых чатов
2. Подсчёт метрик и индекса CCI
3. Генерация инсайтов с пруфами
4. Выгрузка отчёта

## Статус разработки

✅ **Основная реализация завершена** - готово к демонстрации!

### Текущий прогресс
- ✅ Структура проекта и документация
- ✅ Полная схема БД PostgreSQL с 9 таблицами
- ✅ Полноценный бэкенд Node.js/Express с парсерами и API
- ✅ Комплексный фронтенд React/TypeScript с PWA поддержкой
- ✅ AI интеграция с OpenAI GPT-4 для анализа и инсайтов
- ✅ Продвинутый движок расчёта метрик с CCI индексом
- ✅ Адаптивный дашборд с обновлениями в реальном времени
- ✅ **Docker Compose настройка для быстрого развертывания**
- 🔄 Функциональность экспорта PDF/CSV (в разработке)
- ⏳ Тестовые данные и end-to-end тестирование

## Быстрый старт

### Вариант 1: Docker Compose (Рекомендуется) 🐳

1. Клонируйте репозиторий:
```bash
git clone https://github.com/Dev1love/talk_metrics.git
cd talk_metrics
```

2. Настройте переменные окружения:
```bash
cp .env.docker .env
# Отредактируйте .env файл - добавьте OpenAI API ключ и другие настройки
```

3. Запустите приложение:
```bash
# Production режим
docker compose up -d

# Development режим (с hot reload)
docker compose -f docker-compose.dev.yml up -d
```

4. Откройте приложение:
- Frontend: http://localhost:4000
- Backend API: http://localhost:4001

Подробнее см. [README.docker.md](README.docker.md)

### Вариант 2: Ручная установка

1. Настройте базу данных:
```bash
cd database
docker-compose up -d
psql -U postgres -d talk_metrics < schema.sql
```

2. Запустите бэкенд:
```bash
cd backend
npm install
cp .env.example .env  # настройте переменные окружения
npm run dev
```

3. Запустите фронтенд:
```bash
cd frontend
npm install
npm run dev
```

Приложение будет доступно по адресу http://localhost:5173

## Лицензия

MIT License