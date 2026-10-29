-- Видаляє базу cake_shop_db (усі дані зникають).
-- Виконай у SSMS: підключись до master, відкрий цей файл, F5.
-- Потім по черзі: 01_create_tables.sql → 02_seed_data.sql

USE master;
GO

IF DB_ID(N'cake_shop_db') IS NOT NULL
BEGIN
    ALTER DATABASE [cake_shop_db] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE [cake_shop_db];
END
GO
