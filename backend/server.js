import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Подключение к MySQL
let pool;
async function initializeDatabase() {
  try {
    // Сначала подключаемся без выбора базы данных
    const tempPool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Создаем базу данных если её нет
    await tempPool.execute('CREATE DATABASE IF NOT EXISTS stroy_store');
    console.log('✅ База данных stroy_store создана/проверена');

    // Теперь подключаемся к конкретной базе данных
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'stroy_store',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Создаем таблицы если их нет
    await createTables();
    await insertTestData();
  } catch (error) {
    console.error('❌ Ошибка инициализации базы данных:', error);
    throw error;
  }
}

async function createTables() {
  try {
    // Таблица пользователей
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Таблица продуктов
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        category VARCHAR(50),
        image VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Таблица вакансий
    await pool.execute(`
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
      )
    `);

    console.log('✅ Таблицы созданы/проверены');
  } catch (error) {
    console.error('❌ Ошибка создания таблиц:', error);
    throw error;
  }
}

async function insertTestData() {
  try {
    // Проверяем есть ли тестовые пользователи
    const [users] = await pool.execute('SELECT COUNT(*) as count FROM users');
    if (users[0].count === 0) {
      const hashedPassword = await bcrypt.hash('password', 10);
      
      // Добавляем тестовых пользователей
      await pool.execute(
        'INSERT IGNORE INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        ['admin', 'admin@stroystore.ru', hashedPassword, 'admin']
      );
      
      await pool.execute(
        'INSERT IGNORE INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        ['user1', 'user1@example.ru', hashedPassword, 'user']
      );

      console.log('✅ Тестовые пользователи добавлены');
    }

    // Проверяем есть ли тестовые продукты
    const [products] = await pool.execute('SELECT COUNT(*) as count FROM products');
    if (products[0].count === 0) {
      await pool.execute(`
        INSERT IGNORE INTO products (name, description, price, category, image) VALUES 
        ('Перфоратор', 'Мощный перфоратор для строительных работ', 15000.00, 'Электроинструменты', '/placeholder-product.jpg'),
        ('Шуруповерт', 'Аккумуляторный шуруповерт', 8000.00, 'Электроинструменты', '/placeholder-product.jpg'),
        ('Бетономешалка', 'Бетономешалка на 150 литров', 25000.00, 'Строительное оборудование', '/placeholder-product.jpg'),
        ('Строительные перчатки', 'Защитные перчатки', 500.00, 'СИЗ', '/placeholder-product.jpg'),
        ('Защитные очки', 'Строительные защитные очки', 300.00, 'СИЗ', '/placeholder-product.jpg'),
        ('Молоток', 'Профессиональный строительный молоток', 1500.00, 'Ручные инструменты', '/placeholder-product.jpg'),
        ('Дрель', 'Беспроводная дрель', 12000.00, 'Электроинструменты', '/placeholder-product.jpg'),
        ('Строительная каска', 'Защитная каска', 800.00, 'СИЗ', '/placeholder-product.jpg')
      `);
      console.log('✅ Тестовые продукты добавлены');
    }

    // Проверяем есть ли тестовые вакансии
    const [jobs] = await pool.execute('SELECT COUNT(*) as count FROM jobs');
    if (jobs[0].count === 0) {
      // Получаем ID пользователя user1
      const [users] = await pool.execute('SELECT id FROM users WHERE username = ?', ['user1']);
      if (users.length > 0) {
        const userId = users[0].id;
        
        await pool.execute(`
          INSERT IGNORE INTO jobs (title, description, salary, category, company, user_id, approved) VALUES 
          ('Строитель', 'Работа на строительном объекте', '80000 ₽', 'Строительство', 'СтройГрупп', ?, true),
          ('Отделочник', 'Отделочные работы', '75000 ₽', 'Отделка', 'РемонтПро', ?, true),
          ('Электрик', 'Электромонтажные работы', '90000 ₽', 'Электрика', 'ЭлектроСервис', ?, true),
          ('Сантехник', 'Монтаж сантехнического оборудования', '85000 ₽', 'Сантехника', 'АкваПроф', ?, true),
          ('Маляр', 'Покрасочные работы', '70000 ₽', 'Отделка', 'ИнтерьерСтрой', ?, true)
        `, [userId, userId, userId, userId, userId]);
        console.log('✅ Тестовые вакансии добавлены');
      }
    }
  } catch (error) {
    console.error('❌ Ошибка добавления тестовых данных:', error);
  }
}

// Middleware для проверки JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Токен не предоставлен' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Неверный токен' });
    }
    req.user = user;
    next();
  });
};

// Маршруты
app.get('/', (req, res) => {
  res.json({ 
    message: 'StroyStore API Server (MySQL)',
    status: 'Running',
    version: '1.0.0'
  });
});

app.get('/api/health', async (req, res) => {
  try {
    await pool.execute('SELECT 1');
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      database: 'Connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'Error', 
      message: 'Database connection failed',
      error: error.message 
    });
  }
});

// Маршруты аутентификации
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    
    console.log('��� Регистрация:', { username, email });
    
    if (!username || !password || !email) {
      return res.status(400).json({ message: 'Все поля обязательны' });
    }
    
    // Проверяем существование пользователя
    const [existingUsers] = await pool.execute(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Пользователь уже существует' });
    }
    
    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Создаем пользователя
    const [result] = await pool.execute(
      'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, email, 'user']
    );
    
    // Получаем созданного пользователя
    const [users] = await pool.execute(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [result.insertId]
    );
    
    const newUser = users[0];
    
    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    console.log('✅ Новый пользователь создан:', newUser.username);
    
    res.status(201).json({
      token,
      user: newUser
    });
  } catch (error) {
    console.error('❌ Ошибка регистрации:', error);
    res.status(500).json({ message: 'Ошибка сервера при регистрации' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    console.log('��� Логин:', username);
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Логин и пароль обязательны' });
    }
    
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    if (users.length === 0) {
      return res.status(400).json({ message: 'Неверные учетные данные' });
    }
    
    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(400).json({ message: 'Неверные учетные данные' });
    }
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };
    
    console.log('✅ Успешный логин:', userResponse.username);
    
    res.json({
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('❌ Ошибка логина:', error);
    res.status(500).json({ message: 'Ошибка сервера при входе' });
  }
});

// Маршруты продуктов
app.get('/api/products', async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];
    
    if (search) {
      params.push(`%${search}%`);
      query += ` AND name LIKE ?`;
    }
    
    if (category && category !== 'Все') {
      params.push(category);
      query += ` AND category = ?`;
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [products] = await pool.execute(query, params);
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Недостаточно прав' });
    }
    
    const { name, description, price, category, image } = req.body;
    
    if (!name || !description || !price || !category) {
      return res.status(400).json({ message: 'Все поля обязательны' });
    }
    
    const [result] = await pool.execute(
      'INSERT INTO products (name, description, price, category, image) VALUES (?, ?, ?, ?, ?)',
      [name, description, price, category, image || '/placeholder-product.jpg']
    );
    
    const [products] = await pool.execute(
      'SELECT * FROM products WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json(products[0]);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.put('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Недостаточно прав' });
    }
    
    const { id } = req.params;
    const { name, description, price, category, image } = req.body;
    
    await pool.execute(
      'UPDATE products SET name = ?, description = ?, price = ?, category = ?, image = ? WHERE id = ?',
      [name, description, price, category, image, id]
    );
    
    const [products] = await pool.execute(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );
    
    if (products.length === 0) {
      return res.status(404).json({ message: 'Продукт не найден' });
    }
    
    res.json(products[0]);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Недостаточно прав' });
    }
    
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM products WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Продукт не найден' });
    }
    
    res.json({ message: 'Продукт удален' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Маршруты вакансий
app.get('/api/jobs', async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = `
      SELECT j.*, u.username 
      FROM jobs j 
      JOIN users u ON j.user_id = u.id 
      WHERE j.approved = true
    `;
    const params = [];
    
    if (search) {
      params.push(`%${search}%`);
      query += ` AND j.title LIKE ?`;
    }
    
    if (category && category !== 'Все') {
      params.push(category);
      query += ` AND j.category = ?`;
    }
    
    query += ' ORDER BY j.created_at DESC';
    
    const [jobs] = await pool.execute(query, params);
    res.json(jobs);
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.post('/api/jobs', authenticateToken, async (req, res) => {
  try {
    const { title, description, salary, category, company } = req.body;
    
    if (!title || !description || !salary || !category || !company) {
      return res.status(400).json({ message: 'Все поля обязательны' });
    }
    
    const [result] = await pool.execute(
      'INSERT INTO jobs (title, description, salary, category, company, user_id, approved) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description, salary, category, company, req.user.id, false]
    );
    
    const [jobs] = await pool.execute(
      'SELECT j.*, u.username FROM jobs j JOIN users u ON j.user_id = u.id WHERE j.id = ?',
      [result.insertId]
    );
    
    res.status(201).json(jobs[0]);
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Админские маршруты для модерации вакансий
app.get('/api/admin/jobs', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Недостаточно прав' });
    }
    
    const [jobs] = await pool.execute(
      `SELECT j.*, u.username 
       FROM jobs j 
       JOIN users u ON j.user_id = u.id 
       WHERE j.approved = false 
       ORDER BY j.created_at DESC`
    );
    
    res.json(jobs);
  } catch (error) {
    console.error('Get pending jobs error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.put('/api/admin/jobs/:id/approve', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Недостаточно прав' });
    }
    
    const { id } = req.params;
    
    await pool.execute(
      'UPDATE jobs SET approved = true WHERE id = ?',
      [id]
    );
    
    const [jobs] = await pool.execute(
      'SELECT j.*, u.username FROM jobs j JOIN users u ON j.user_id = u.id WHERE j.id = ?',
      [id]
    );
    
    if (jobs.length === 0) {
      return res.status(404).json({ message: 'Вакансия не найдена' });
    }
    
    res.json(jobs[0]);
  } catch (error) {
    console.error('Approve job error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.delete('/api/admin/jobs/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Недостаточно прав' });
    }
    
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'DELETE FROM jobs WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Вакансия не найдена' });
    }
    
    res.json({ message: 'Вакансия удалена' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Маршруты для информации о магазине
app.get('/api/shop/location', (req, res) => {
  const shopLocation = {
    lat: 55.614831077219144,
    lon: 37.48326799993517,
    address: 'г. Москва, ул. Строителей, д. 1',
    phone: '+7 (999) 999-99-99',
    email: 'info@stroystore.ru',
    workingHours: 'Ежедневно с 9:00 до 21:00'
  };
  
  res.json({
    success: true,
    data: shopLocation
  });
});

app.get('/api/shop/map-links', (req, res) => {
  const shopLocation = {
    lat: 55.614831077219144,
    lon: 37.48326799993517
  };
  
  const { lat, lon } = shopLocation;
  
  const links = {
    '2gis': `https://2gis.ru/moscow/firm/70000001032377759?m=${lon}%2C${lat}%2F16`,
    'yandex': `https://yandex.ru/maps/?pt=${lon},${lat}&z=16&l=map`,
    'google': `https://www.google.com/maps?q=${lat},${lon}&z=16`
  };
  
  res.json({
    success: true,
    data: links
  });
});

// Обработка 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Маршрут не найден',
    path: req.originalUrl,
    method: req.method
  });
});

// Инициализация сервера
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`��� Сервер запущен на порту ${PORT}`);
      console.log(`��� API: http://localhost:${PORT}`);
      console.log(`��� Frontend: http://localhost:5173`);
      console.log('��� Используется MySQL база данных');
      console.log('✅ База данных и таблицы созданы автоматически');
      console.log('��� Тестовые аккаунты:');
      console.log('   ��� Админ: admin / password');
      console.log('   ��� Пользователь: user1 / password');
    });
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error);
    console.log('��� Проверьте настройки подключения к MySQL в файле .env');
  }
}

startServer();
