// Скрипт для проверки и исправления кодировки
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkEncoding() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'stroy_store',
    charset: 'utf8mb4'
  });

  console.log('��� Проверяем кодировку базы данных...');
  
  const [dbInfo] = await connection.execute(
    'SELECT @@character_set_database, @@collation_database'
  );
  console.log('Кодировка базы:', dbInfo);
  
  const [products] = await connection.execute('SELECT name FROM products LIMIT 5');
  console.log('Примеры названий товаров:', products);
  
  await connection.end();
}

checkEncoding();
