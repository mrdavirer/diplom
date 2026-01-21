package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/joho/godotenv"
	_ "github.com/go-sql-driver/mysql"
	"golang.org/x/crypto/bcrypt"
)

var (
	db        *sql.DB
	jwtSecret []byte
)

type User struct {
	ID        int64     `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

type Product struct {
	ID          int64     `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Price       float64   `json:"price"`
	Category    string    `json:"category"`
	Image       string    `json:"image"`
	CreatedAt   time.Time `json:"created_at"`
}

type Job struct {
	ID          int64     `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Salary      string    `json:"salary"`
	Category    string    `json:"category"`
	Company     string    `json:"company"`
	UserID      int64     `json:"user_id"`
	Approved    bool      `json:"approved"`
	CreatedAt   time.Time `json:"created_at"`
	Username    string    `json:"username"`
}

type Claims struct {
	ID       int64  `json:"id"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

type ShopLocation struct {
	Lat          float64 `json:"lat"`
	Lon          float64 `json:"lon"`
	Address      string  `json:"address"`
	Phone        string  `json:"phone"`
	Email        string  `json:"email"`
	WorkingHours string  `json:"workingHours"`
}



func main() {
	// импорт env
	if err := godotenv.Load(); err != nil {
		log.Println(".env не найден")
	}

	jwtSecret = []byte(getEnv("JWT_SECRET", "your-secret-key"))

	if err := initializeDatabase(); err != nil {
		log.Fatalf("Ошибка инициализации базы данных: %v", err)
	}
	defer db.Close()

	router := setupRouter()
	port := getEnv("PORT", "3001")

	log.Printf("Сервер запущен на порту %s", port)
	log.Printf("API: http://localhost:%s", port)
	log.Println("Frontend: http://localhost:5173")
	log.Println("Используется MySQL база данных")
	log.Println("База данных и таблицы созданы автоматически")
	log.Println("Тестовые аккаунты:")
	log.Println(" Админ: admin / password")
	log.Println(" Пользователь: user1 / password")

	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Ошибка запуска сервера: %v", err)
	}
}

func setupRouter() *gin.Engine {
	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))


	r.GET("/", rootHandler)
	r.GET("/api/health", healthHandler)

	// Аутентификация
	r.POST("/api/register", registerHandler)
	r.POST("/api/login", loginHandler)


	r.GET("/api/products", getProductsHandler)
	r.GET("/api/jobs", getJobsHandler)
	r.GET("/api/shop/location", shopLocationHandler)
	r.GET("/api/shop/map-links", shopMapLinksHandler)


	protected := r.Group("/api")
	protected.Use(authMiddleware())
	{
		protected.POST("/products", createProductHandler)
		protected.PUT("/products/:id", updateProductHandler)
		protected.DELETE("/products/:id", deleteProductHandler)

		
		protected.POST("/jobs", createJobHandler)

		
		protected.GET("/admin/jobs", getPendingJobsHandler)
		protected.PUT("/admin/jobs/:id/approve", approveJobHandler)
		protected.DELETE("/admin/jobs/:id", deleteJobHandler)
	}

	
	r.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "Маршрут не найден",
			"path":    c.Request.URL.Path,
			"method":  c.Request.Method,
		})
	})

	return r
}



func initializeDatabase() error {
	host := getEnv("DB_HOST", "localhost")
	user := getEnv("DB_USER", "root")
	pass := getEnv("DB_PASSWORD", "")
	name := getEnv("DB_NAME", "stroy_store")

	dsnNoDB := fmt.Sprintf("%s:%s@tcp(%s:3306)/?parseTime=true&charset=utf8mb4&loc=Local",
		user, pass, host)

	tempDB, err := sql.Open("mysql", dsnNoDB)
	if err != nil {
		return fmt.Errorf("open temp db: %w", err)
	}
	defer tempDB.Close()

	if err := tempDB.Ping(); err != nil {
		return fmt.Errorf("ping temp db: %w", err)
	}

	_, err = tempDB.Exec("CREATE DATABASE IF NOT EXISTS " + name + " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
	if err != nil {
		return fmt.Errorf("create database: %w", err)
	}
	log.Println("База данных stroy_store создана/проверена")

	
	dsn := fmt.Sprintf("%s:%s@tcp(%s:3306)/%s?parseTime=true&charset=utf8mb4&loc=Local",
		user, pass, host, name)

	db, err = sql.Open("mysql", dsn)
	if err != nil {
		return fmt.Errorf("open db: %w", err)
	}

	if err := db.Ping(); err != nil {
		return fmt.Errorf("ping db: %w", err)
	}

	if err := createTables(); err != nil {
		return fmt.Errorf("create tables: %w", err)
	}

	if err := insertTestData(); err != nil {
		return fmt.Errorf("insert test data: %w", err)
	}

	return nil
}

func createTables() error {
	stmts := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id INT AUTO_INCREMENT PRIMARY KEY,
			username VARCHAR(50) UNIQUE NOT NULL,
			email VARCHAR(100) UNIQUE NOT NULL,
			password VARCHAR(255) NOT NULL,
			role VARCHAR(20) DEFAULT 'user',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS products (
			id INT AUTO_INCREMENT PRIMARY KEY,
			name VARCHAR(100) NOT NULL,
			description TEXT,
			price DECIMAL(10,2) NOT NULL,
			category VARCHAR(50),
			image VARCHAR(255),
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS jobs (
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
		)`,
	}

	for _, stmt := range stmts {
		if _, err := db.Exec(stmt); err != nil {
			return err
		}
	}

	log.Println("✅ Таблицы созданы/проверены")
	return nil
}

func insertTestData() error {
	
	var userCount int
	if err := db.QueryRow("SELECT COUNT(*) FROM users").Scan(&userCount); err != nil {
		return err
	}
	if userCount == 0 {
		hashed, err := bcrypt.GenerateFromPassword([]byte("password"), bcrypt.DefaultCost)
		if err != nil {
			return err
		}

		if _, err := db.Exec(
			"INSERT IGNORE INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
			"admin", "admin@stroystore.ru", string(hashed), "admin",
		); err != nil {
			return err
		}

		if _, err := db.Exec(
			"INSERT IGNORE INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
			"user1", "user1@example.ru", string(hashed), "user",
		); err != nil {
			return err
		}

		log.Println("Тестовые пользователи добавлены")
	}

	
	var productCount int
	if err := db.QueryRow("SELECT COUNT(*) FROM products").Scan(&productCount); err != nil {
		return err
	}
	if productCount == 0 {
		_, err := db.Exec(`
			INSERT IGNORE INTO products (name, description, price, category, image) VALUES 
			('Перфоратор', 'Мощный перфоратор для строительных работ', 15000.00, 'Электроинструменты', '/placeholder-product.jpg'),
			('Шуруповерт', 'Аккумуляторный шуруповерт', 8000.00, 'Электроинструменты', '/placeholder-product.jpg'),
			('Бетономешалка', 'Бетономешалка на 150 литров', 25000.00, 'Строительное оборудование', '/placeholder-product.jpg'),
			('Строительные перчатки', 'Защитные перчатки', 500.00, 'СИЗ', '/placeholder-product.jpg'),
			('Защитные очки', 'Строительные защитные очки', 300.00, 'СИЗ', '/placeholder-product.jpg'),
			('Молоток', 'Профессиональный строительный молоток', 1500.00, 'Ручные инструменты', '/placeholder-product.jpg'),
			('Дрель', 'Беспроводная дрель', 12000.00, 'Электроинструменты', '/placeholder-product.jpg'),
			('Строительная каска', 'Защитная каска', 800.00, 'СИЗ', '/placeholder-product.jpg')
		`)
		if err != nil {
			return err
		}
		log.Println("Тестовые продукты добавлены")
	}

	
	var jobCount int
	if err := db.QueryRow("SELECT COUNT(*) FROM jobs").Scan(&jobCount); err != nil {
		return err
	}
	if jobCount == 0 {
		var userID int64
		err := db.QueryRow("SELECT id FROM users WHERE username = ?", "user1").Scan(&userID)
		if err == sql.ErrNoRows {
			log.Println("⚠️ Пользователь user1 не найден, пропускаем создание тестовых вакансий")
			return nil
		} else if err != nil {
			return err
		}

		_, err = db.Exec(`
			INSERT IGNORE INTO jobs (title, description, salary, category, company, user_id, approved) VALUES 
			('Строитель', 'Работа на строительном объекте', '80000 ₽', 'Строительство', 'СтройГрупп', ?, true),
			('Отделочник', 'Отделочные работы', '75000 ₽', 'Отделка', 'РемонтПро', ?, true),
			('Электрик', 'Электромонтажные работы', '90000 ₽', 'Электрика', 'ЭлектроСервис', ?, true),
			('Сантехник', 'Монтаж сантехнического оборудования', '85000 ₽', 'Сантехника', 'АкваПроф', ?, true),
			('Маляр', 'Покрасочные работы', '70000 ₽', 'Отделка', 'ИнтерьерСтрой', ?, true)
		`, userID, userID, userID, userID, userID)
		if err != nil {
			return err
		}

		log.Println("Тестовые вакансии добавлены")
	}

	return nil
}



func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func createToken(id int64, username, role string) (string, error) {
	expires := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		ID:       id,
		Username: username,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expires),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func getUserClaims(c *gin.Context) *Claims {
	val, exists := c.Get("user")
	if !exists {
		return nil
	}
	claims, ok := val.(*Claims)
	if !ok {
		return nil
	}
	return claims
}



func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.JSON(http.StatusUnauthorized, gin.H{"message": "Токен не предоставлен"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", t.Header["alg"])
			}
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusForbidden, gin.H{"message": "Неверный токен"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(*Claims)
		if !ok {
			c.JSON(http.StatusForbidden, gin.H{"message": "Неверный токен"})
			c.Abort()
			return
		}

		c.Set("user", claims)
		c.Next()
	}
}



func rootHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "StroyStore API Server (MySQL, Go)",
		"status":  "Running",
		"version": "1.0.0",
	})
}

func healthHandler(c *gin.Context) {
	var one int
	if err := db.QueryRow("SELECT 1").Scan(&one); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"status":  "Error",
			"message": "Database connection failed",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":    "OK",
		"timestamp": time.Now().UTC().Format(time.RFC3339),
		"database":  "Connected",
	})
}



func registerHandler(c *gin.Context) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
		Email    string `json:"email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Неверный формат запроса"})
		return
	}

	log.Printf("Регистрация: username=%s email=%s", req.Username, req.Email)

	if req.Username == "" || req.Password == "" || req.Email == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Все поля обязательны"})
		return
	}

	var count int
	if err := db.QueryRow(
		"SELECT COUNT(*) FROM users WHERE username = ? OR email = ?",
		req.Username, req.Email,
	).Scan(&count); err != nil {
		log.Println("Ошибка проверки существования пользователя:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера при регистрации"})
		return
	}

	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Пользователь уже существует"})
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Println("Ошибка хеширования пароля:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера при регистрации"})
		return
	}

	res, err := db.Exec(
		"INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)",
		req.Username, string(hashed), req.Email, "user",
	)
	if err != nil {
	log.Println("Ошибка вставки пользователя:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера при регистрации"})
		return
	}

	id, err := res.LastInsertId()
	if err != nil {
		log.Println("Ошибка получения ID пользователя:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера при регистрации"})
		return
	}

	var user User
	if err := db.QueryRow(
		"SELECT id, username, email, role, created_at FROM users WHERE id = ?",
		id,
	).Scan(&user.ID, &user.Username, &user.Email, &user.Role, &user.CreatedAt); err != nil {
		log.Println("Ошибка чтения пользователя:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера при регистрации"})
		return
	}

	token, err := createToken(user.ID, user.Username, user.Role)
	if err != nil {
		log.Println("Ошибка создания токена:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера при регистрации"})
		return
	}

	log.Printf("Новый пользователь создан: %s", user.Username)

	c.JSON(http.StatusCreated, gin.H{
		"token": token,
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
			"role":     user.Role,
		},
	})
}

func loginHandler(c *gin.Context) {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Неверный формат запроса"})
		return
	}

	if req.Username == "" || req.Password == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Логин и пароль обязательны"})
		return
	}

	log.Printf("Логин: %s", req.Username)

	var user User
	var hashed string

	err := db.QueryRow(
		"SELECT id, username, email, role, password, created_at FROM users WHERE username = ?",
		req.Username,
	).Scan(&user.ID, &user.Username, &user.Email, &user.Role, &hashed, &user.CreatedAt)

	if err == sql.ErrNoRows {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Неверные учетные данные"})
		return
	} else if err != nil {
		log.Println("Ошибка чтения пользователя при логине:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера при входе"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hashed), []byte(req.Password)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Неверные учетные данные"})
		return
	}

	token, err := createToken(user.ID, user.Username, user.Role)
	if err != nil {
		log.Println("Ошибка создания токена при логине:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера при входе"})
		return
	}

	log.Printf("Успешный логин: %s", user.Username)

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
			"role":     user.Role,
		},
	})
}


func getProductsHandler(c *gin.Context) {
	search := c.Query("search")
	category := c.Query("category")

	query := "SELECT id, name, description, price, category, image, created_at FROM products WHERE 1=1"
	var args []interface{}

	if search != "" {
		query += " AND name LIKE ?"
		args = append(args, "%"+search+"%")
	}

	if category != "" && category != "Все" {
		query += " AND category = ?"
		args = append(args, category)
	}

	query += " ORDER BY created_at DESC"

	rows, err := db.Query(query, args...)
	if err != nil {
		log.Println("Get products error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера"})
		return
	}
	defer rows.Close()

	var products []Product
	for rows.Next() {
		var p Product
		if err := rows.Scan(
			&p.ID, &p.Name, &p.Description, &p.Price,
			&p.Category, &p.Image, &p.CreatedAt,
		); err != nil {
			log.Println("Scan product error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера"})
			return
		}
		products = append(products, p)
	}

	if err := rows.Err(); err != nil {
		log.Println("Rows error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера"})
		return
	}

	c.JSON(http.StatusOK, products)
}

func createProductHandler(c *gin.Context) {
	user := getUserClaims(c)
	if user == nil || user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"message": "Недостаточно прав"})
		return
	}

	var req struct {
		Name        string  `json:"name"`
		Description string  `json:"description"`
		Price       float64 `json:"price"`
		Category    string  `json:"category"`
		Image       string  `json:"image"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Неверный формат запроса"})
		return
	}

	if req.Name == "" || req.Description == "" || req.Price == 0 || req.Category == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Все поля обязательны"})
		return
	}

	image := req.Image
	if image == "" {
		image = "/placeholder-product.jpg"
	}

	res, err := db.Exec(
		"INSERT INTO products (name, description, price, category, image) VALUES (?, ?, ?, ?, ?)",
		req.Name, req.Description, req.Price, req.Category, image,
	)
	if err != nil {
		log.Println("Create product error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера"})
		return
	}

	id, err := res.LastInsertId()
	if err != nil {
		log.Println("Get product id error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера"})
		return
	}

	var product Product
	if err := db.QueryRow(
		"SELECT id, name, description, price, category, image, created_at FROM products WHERE id = ?",
		id,
	).Scan(&product.ID, &product.Name, &product.Description, &product.Price,
		&product.Category, &product.Image, &product.CreatedAt); err != nil {
		log.Println("Read product error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера"})
		return
	}

	c.JSON(http.StatusCreated, product)
}

func updateProductHandler(c *gin.Context) {
	user := getUserClaims(c)
	if user == nil || user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"message": "Недостаточно прав"})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Неверный id"})
		return
	}

	var req struct {
		Name        string  `json:"name"`
		Description string  `json:"description"`
		Price       float64 `json:"price"`
		Category    string  `json:"category"`
		Image       string  `json:"image"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Неверный формат запроса"})
		return
	}

	res, err := db.Exec(
		"UPDATE products SET name = ?, description = ?, price = ?, category = ?, image = ? WHERE id = ?",
		req.Name, req.Description, req.Price, req.Category, req.Image, id,
	)
	if err != nil {
		log.Println("Update product error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера"})
		return
	}

	aff, err := res.RowsAffected()
	if err != nil {
		log.Println("RowsAffected error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера"})
		return
	}
	if aff == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "Продукт не найден"})
		return
	}

	var product Product
	if err := db.QueryRow(
		"SELECT id, name, description, price, category, image, created_at FROM products WHERE id = ?",
		id,
	).Scan(&product.ID, &product.Name, &product.Description, &product.Price,
		&product.Category, &product.Image, &product.CreatedAt); err != nil {
		log.Println("Read updated product error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера"})
		return
	}

	c.JSON(http.StatusOK, product)
}

func deleteProductHandler(c *gin.Context) {
	user := getUserClaims(c)
	if user == nil || user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"message": "Недостаточно прав"})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Неверный id"})
		return
	}

	res, err := db.Exec(
		"DELETE FROM products WHERE id = ?",
		id,
	)
	if err != nil {
		log.Println("Delete product error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера"})
		return
	}

	aff, err := res.RowsAffected()
	if err != nil {
		log.Println("RowsAffected error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера"})
		return
	}
	if aff == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "Продукт не найден"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Продукт удален"})
}



func getJobsHandler(c *gin.Context) {
	search := c.Query("search")
	category := c.Query("category")

	query := `
		SELECT j.id, j.title, j.description, j.salary, j.category, j.company,
		       j.user_id, j.approved, j.created_at, u.username
		FROM jobs j
		JOIN users u ON j.user_id = u.id
		WHERE j.approved = true
	`
	var args []interface{}

	if search != "" {
		query += " AND j.title LIKE ?"
		args = append(args, "%"+search+"%")
	}

	if category != "" && category != "Все" {
		query += " AND j.category = ?"
		args = append(args, category)
	}

	query += " ORDER BY j.created_at DESC"

	rows, err := db.Query(query, args...)
	if err != nil {
		log.Println("Get jobs error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера"})
		return
	}
	defer rows.Close()

	var jobs []Job
	for rows.Next() {
		var j Job
		if err := rows.Scan(
			&j.ID, &j.Title, &j.Description, &j.Salary,
			&j.Category, &j.Company, &j.UserID, &j.Approved,
			&j.CreatedAt, &j.Username,
		); err != nil {
			log.Println("Scan job error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера"})
			return
		}
		jobs = append(jobs, j)
	}

	if err := rows.Err(); err != nil {
		log.Println("Rows error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера"})
		return
	}

	c.JSON(http.StatusOK, jobs)
}

func createJobHandler(c *gin.Context) {
	claims := getUserClaims(c)
	if claims == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"message": "Неавторизован"})
		return
	}

	var req struct {
		Title       string `json:"title"`
		Description string `json:"description"`
		Salary      string `json:"salary"`
		Category    string `json:"category"`
		Company     string `json:"company"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Неверный формат запроса"})
		return
	}

	if req.Title == "" || req.Description == "" || req.Salary == "" || req.Category == "" || req.Company == "" {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Все поля обязательны"})
		return
	}

	res, err := db.Exec(
		"INSERT INTO jobs (title, description, salary, category, company, user_id, approved) VALUES (?, ?, ?, ?, ?, ?, ?)",
		req.Title, req.Description, req.Salary, req.Category, req.Company, claims.ID, false,
	)
	if err != nil {
		log.Println("Create job error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера"})
		return
	}

	id, err := res.LastInsertId()
	if err != nil {
		log.Println("Get job id error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера"})
		return
	}

	var job Job
	err = db.QueryRow(`
		SELECT j.id, j.title, j.description, j.salary, j.category, j.company,
		       j.user_id, j.approved, j.created_at, u.username
		FROM jobs j
		JOIN users u ON j.user_id = u.id
		WHERE j.id = ?
	`, id).Scan(
		&job.ID, &job.Title, &job.Description, &job.Salary,
		&job.Category, &job.Company, &job.UserID, &job.Approved,
		&job.CreatedAt, &job.Username,
	)
	if err != nil {
		log.Println("Read job error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера"})
		return
	}

	c.JSON(http.StatusCreated, job)
}



func getPendingJobsHandler(c *gin.Context) {
	user := getUserClaims(c)
	if user == nil || user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"message": "Недостаточно прав"})
		return
	}

	rows, err := db.Query(`
		SELECT j.id, j.title, j.description, j.salary, j.category, j.company,
		       j.user_id, j.approved, j.created_at, u.username
		FROM jobs j
		JOIN users u ON j.user_id = u.id
		WHERE j.approved = false
		ORDER BY j.created_at DESC
	`)
	if err != nil {
		log.Println("Get pending jobs error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера"})
		return
	}
	defer rows.Close()

	var jobs []Job
	for rows.Next() {
		var j Job
		if err := rows.Scan(
			&j.ID, &j.Title, &j.Description, &j.Salary,
			&j.Category, &j.Company, &j.UserID, &j.Approved,
			&j.CreatedAt, &j.Username,
		); err != nil {
			log.Println("Scan pending job error:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера"})
			return
		}
		jobs = append(jobs, j)
	}

	if err := rows.Err(); err != nil {
		log.Println("Rows error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера"})
		return
	}

	c.JSON(http.StatusOK, jobs)
}

func approveJobHandler(c *gin.Context) {
	user := getUserClaims(c)
	if user == nil || user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"message": "Недостаточно прав"})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Неверный id"})
		return
	}

	if _, err := db.Exec("UPDATE jobs SET approved = true WHERE id = ?", id); err != nil {
		log.Println("Approve job error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера"})
		return
	}

	var job Job
	err = db.QueryRow(`
		SELECT j.id, j.title, j.description, j.salary, j.category, j.company,
		       j.user_id, j.approved, j.created_at, u.username
		FROM jobs j
		JOIN users u ON j.user_id = u.id
		WHERE j.id = ?
	`, id).Scan(
		&job.ID, &job.Title, &job.Description, &job.Salary,
		&job.Category, &job.Company, &job.UserID, &job.Approved,
		&job.CreatedAt, &job.Username,
	)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"message": "Вакансия не найдена"})
		return
	} else if err != nil {
		log.Println("Read approved job error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера"})
		return
	}

	c.JSON(http.StatusOK, job)
}

func deleteJobHandler(c *gin.Context) {
	user := getUserClaims(c)
	if user == nil || user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"message": "Недостаточно прав"})
		return
	}

	idStr := c.Param("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "Неверный id"})
		return
	}

	res, err := db.Exec("DELETE FROM jobs WHERE id = ?", id)
	if err != nil {
		log.Println("Delete job error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера"})
		return
	}

	aff, err := res.RowsAffected()
	if err != nil {
		log.Println("RowsAffected error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Ошибка сервера"})
		return
	}
	if aff == 0 {
		c.JSON(http.StatusNotFound, gin.H{"message": "Вакансия не найдена"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Вакансия удалена"})
}



func shopLocationHandler(c *gin.Context) {
	shopLocation := ShopLocation{
		Lat:          55.614831077219144,
		Lon:          37.48326799993517,
		Address:      "г. Москва, ул. Строителей, д. 1",
		Phone:        "+7 (999) 999-99-99",
		Email:        "info@stroystore.ru",
		WorkingHours: "Ежедневно с 9:00 до 21:00",
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    shopLocation,
	})
}

func shopMapLinksHandler(c *gin.Context) {
	lat := 55.614831077219144
	lon := 37.48326799993517

	links := gin.H{
		"2gis":   fmt.Sprintf("https://2gis.ru/moscow/firm/70000001032377759?m=%f%%2C%f%%2F16", lon, lat),
		"yandex": fmt.Sprintf("https://yandex.ru/maps/?pt=%f,%f&z=16&l=map", lon, lat),
		"google": fmt.Sprintf("https://www.google.com/maps?q=%f,%f&z=16", lat, lon),
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    links,
	})
}
