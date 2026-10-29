# SweetVenom

Вебзастосунок для замовлення тортів і керування замовленнями кондитерської.

## Можливості

- Каталог тортів із категоріями, описами, складом, вагою та цінами.
- Перегляд цілого торта й розрізу з плавним переходом.
- Вибір ваги, бісквіта, крему та побажань до оформлення.
- Кошик і оформлення замовлень.
- Кабінет клієнта з історією та статусами замовлень.
- Кабінет кондитера для роботи з каталогом і замовленнями.
- Адаптивне оформлення для комп’ютерів і телефонів.

## Технології

React 19, Vite 8, React Router, ASP.NET Core 9, Entity Framework Core і SQL Server.

## Вимоги

- Node.js 22.12 або новіший.
- .NET 9 SDK.
- SQL Server з доступом через Windows Authentication.

## Підготовка бази даних

У SQL Server Management Studio послідовно виконайте:

1. `sql/01_create_tables.sql` — створення бази та таблиць.
2. `sql/02_seed_data.sql` — початковий каталог.

Рядок підключення в `sweetVenomServer/sweetVenomServer/appsettings.json` налаштований на `localhost\SQLEXPRESS` і базу `cake_shop_db`. За потреби задайте власний рядок через змінну середовища `ConnectionStrings__DefaultConnection`.

## Запуск сервера

У PowerShell із кореня проєкту згенеруйте локальний ключ і запустіть API:

```powershell
$jwtBytes = New-Object byte[] 48
$jwtRandom = [Security.Cryptography.RandomNumberGenerator]::Create()
$jwtRandom.GetBytes($jwtBytes)
$jwtRandom.Dispose()
$env:Jwt__Key = [Convert]::ToBase64String($jwtBytes)
dotnet run --project .\sweetVenomServer\sweetVenomServer\sweetVenomServer.csproj --launch-profile http
```

API: http://localhost:5023. Swagger: http://localhost:5023/swagger.
Ключ JWT задавайте в середовищі запуску; не додавайте його в репозиторій.

## Запуск сайту

В іншому терміналі з кореня проєкту:

```powershell
npm install
npm run dev
```

Відкрийте http://localhost:5173.
За замовчуванням запити `/api` проксуються на порт 5023. Для іншої адреси скопіюйте `.env.example` у `.env.development` і змініть `VITE_API_TARGET`.

## Збірка

```powershell
npm run build
```

Готові файли сайту створюються в `dist/`. Сервер API запускається окремо.

## Структура

- `src/` — компоненти, сторінки, стилі та сервіси сайту.
- `public/images/` — зображення каталогу.
- `sweetVenomServer/sweetVenomServer/` — сервер API.
- `sql/` — SQL-скрипти бази даних.

Джерела сторонніх фотографій наведено на сторінці джерел зображень у застосунку. Зображення каталогу є ілюстраціями.
