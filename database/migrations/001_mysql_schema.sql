-- Создание базы данных
CREATE DATABASE IF NOT EXISTS stroy_store;
USE stroy_store;

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица продуктов
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category VARCHAR(50),
    image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица вакансий
CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    salary VARCHAR(50),
    category VARCHAR(50),
    company VARCHAR(100),
    user_id INT,
    approved BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Тестовые данные
INSERT IGNORE INTO users (username, email, password, role) VALUES 
('admin', 'admin@stroystore.ru', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('user1', 'user1@example.ru', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user');

INSERT IGNORE INTO products (name, description, price, category, image) VALUES 
('Перфоратор', 'Мощный перфоратор для строительных работ', 15000.00, 'Электроинструменты', '/placeholder-product.jpg'),
('Шуруповерт', 'Аккумуляторный шуруповерт', 8000.00, 'Электроинструменты', '/placeholder-product.jpg'),
('Бетономешалка', 'Бетономешалка на 150 литров', 25000.00, 'Строительное оборудование', '/placeholder-product.jpg'),
('Строительные перчатки', 'Защитные перчатки', 500.00, 'СИЗ', '/placeholder-product.jpg'),
('Защитные очки', 'Строительные защитные очки', 300.00, 'СИЗ', '/placeholder-product.jpg');

-- Получаем ID пользователя user1 для вставки вакансий
SET @user_id = (SELECT id FROM users WHERE username = 'user1');

INSERT IGNORE INTO jobs (title, description, salary, category, company, user_id, approved) VALUES 
('Строитель', 'Работа на строительном объекте', '80000 ₽', 'Строительство', 'СтройГрупп', @user_id, true),
('Отделочник', 'Отделочные работы', '75000 ₽', 'Отделка', 'РемонтПро', @user_id, true),
('Электрик', 'Электромонтажные работы', '90000 ₽', 'Электрика', 'ЭлектроСервис', @user_id, true);
