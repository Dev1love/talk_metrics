#!/bin/bash

# Docker Compose Setup Validation Script for TalkMetrics

echo "🐳 Проверка настройки Docker Compose для TalkMetrics"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Check if Docker is installed
check_docker() {
    echo "📋 Проверка Docker..."
    if command -v docker &> /dev/null; then
        print_status $GREEN "✓ Docker установлен"
        docker --version
    else
        print_status $RED "✗ Docker не найден. Установите Docker перед продолжением."
        echo "  Инструкции: https://docs.docker.com/get-docker/"
        return 1
    fi
}

# Check if Docker Compose is available
check_docker_compose() {
    echo "📋 Проверка Docker Compose..."
    if docker compose version &> /dev/null; then
        print_status $GREEN "✓ Docker Compose доступен"
        docker compose version
    elif command -v docker-compose &> /dev/null; then
        print_status $GREEN "✓ Docker Compose (legacy) доступен"
        docker-compose --version
    else
        print_status $RED "✗ Docker Compose не найден"
        echo "  Docker Compose обычно идет в комплекте с Docker Desktop"
        return 1
    fi
}

# Validate docker-compose.yml files
validate_compose_files() {
    echo "📋 Проверка файлов конфигурации..."

    if [[ -f "docker-compose.yml" ]]; then
        print_status $GREEN "✓ docker-compose.yml найден"

        # Try to validate the file
        if docker compose config &> /dev/null || docker-compose config &> /dev/null; then
            print_status $GREEN "✓ docker-compose.yml валиден"
        else
            print_status $YELLOW "⚠ Не удалось валидировать docker-compose.yml (Docker недоступен)"
        fi
    else
        print_status $RED "✗ docker-compose.yml не найден в корневой папке"
        return 1
    fi

    if [[ -f "docker-compose.dev.yml" ]]; then
        print_status $GREEN "✓ docker-compose.dev.yml найден"
    fi
}

# Check required files
check_required_files() {
    echo "📋 Проверка необходимых файлов..."

    local files=(
        "backend/Dockerfile"
        "backend/.dockerignore"
        "backend/package.json"
        "frontend/Dockerfile"
        "frontend/Dockerfile.dev"
        "frontend/.dockerignore"
        "frontend/nginx.conf"
        "frontend/package.json"
        "database/schema.sql"
        "database/seed.sql"
        ".env.docker"
    )

    for file in "${files[@]}"; do
        if [[ -f "$file" ]]; then
            print_status $GREEN "✓ $file"
        else
            print_status $RED "✗ $file не найден"
        fi
    done
}

# Check environment configuration
check_env_config() {
    echo "📋 Проверка конфигурации окружения..."

    if [[ -f ".env" ]]; then
        print_status $GREEN "✓ .env файл найден"

        # Check for required variables
        local required_vars=("OPENAI_API_KEY" "JWT_SECRET" "SESSION_SECRET")

        for var in "${required_vars[@]}"; do
            if grep -q "^${var}=" .env && ! grep -q "^${var}=your_" .env; then
                print_status $GREEN "✓ $var настроен"
            else
                print_status $YELLOW "⚠ $var требует настройки"
            fi
        done
    else
        print_status $YELLOW "⚠ .env файл не найден"
        echo "   Скопируйте .env.docker в .env и заполните необходимые значения:"
        echo "   cp .env.docker .env"
    fi
}

# Print usage instructions
print_instructions() {
    echo ""
    echo "📚 Инструкции по запуску:"
    echo "========================"
    print_status $BLUE "Production режим:"
    echo "  docker compose up -d"
    echo ""
    print_status $BLUE "Development режим:"
    echo "  docker compose -f docker-compose.dev.yml up -d"
    echo ""
    print_status $BLUE "Просмотр логов:"
    echo "  docker compose logs -f"
    echo ""
    print_status $BLUE "Остановка:"
    echo "  docker compose down"
    echo ""
    print_status $BLUE "Сервисы будут доступны на:"
    echo "  Frontend: http://localhost:4000"
    echo "  Backend:  http://localhost:4001"
    echo "  Database: localhost:5434"
}

# Main execution
main() {
    cd "$(dirname "$0")/.." || exit 1

    check_docker
    check_docker_compose
    validate_compose_files
    check_required_files
    check_env_config
    print_instructions

    echo ""
    print_status $GREEN "🎉 Проверка завершена!"
    echo "   Для получения дополнительной информации см. README.docker.md"
}

main "$@"