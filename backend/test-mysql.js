import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  let connection;
  try {
    console.log('��� Проверка подключения к MySQL...');
    
    // Сначала пробуем подключиться без выбора базы данных
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('✅ Успешное подключение к MySQL серверу!');
    
    // Проверяем существование базы данных
    const [databases] = await connection.execute('SHOW DATABASES');
    console.log('��� Доступные базы данных:');
    databases.forEach(db => console.log('   -', db.Database));
    
    // Проверяем есть ли наша база данных
    const hasStroyStore = databases.some(db => db.Database === 'stroy_store');
    if (!hasStroyStore) {
      console.log('ℹ️  База данных stroy_store не найдена, но она будет создана автоматически при запуске сервера');
    } else {
      console.log('✅ База данных stroy_store существует');
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Ошибка подключения к MySQL:', error.message);
    console.log('\n��� Возможные решения:');
    
    if (error.code === 'ECONNREFUSED') {
      console.log('1. Убедитесь, что MySQL сервер запущен');
      console.log('2. Проверьте, что MySQL установлен и работает на порту 3306');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('1. Проверьте правильность логина и пароля');
      console.log('2. Попробуйте подключиться с пустым паролем (оставьте DB_PASSWORD пустым в .env)');
    } else {
      console.log('1. Проверьте настройки в файле .env:');
      console.log('   DB_HOST=', process.env.DB_HOST);
      console.log('   DB_USER=', process.env.DB_USER);
      console.log('   DB_PASSWORD=', process.env.DB_PASSWORD ? '***' : 'не установлен');
    }
    
    console.log('\n��� Для устранения проблемы:');
    console.log('   - Откройте MySQL Workbench');
    console.log('   - Проверьте подключение к localhost:3306');
    console.log('   - Убедитесь, что пользователь root имеет доступ');
  }
}

testConnection();
