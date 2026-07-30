import mysql  from 'mysql2/promise'
import dotenv from 'dotenv'
dotenv.config()

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'finsmart_db',
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
  timezone: '+07:00',  // WIB — pastikan Node dan MySQL pakai timezone yang sama
})

export async function initDB() {
  const conn = await pool.getConnection()
  try {
    await conn.query(`CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL,
      avatar MEDIUMTEXT DEFAULT NULL, role ENUM('user','admin','superadmin') DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)

    await conn.query(`CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR(36) PRIMARY KEY, user_id INT NOT NULL,
      title VARCHAR(150) NOT NULL, category VARCHAR(100) NOT NULL,
      amount DECIMAL(15,2) NOT NULL, type ENUM('masuk','keluar') NOT NULL,
      icon VARCHAR(10) DEFAULT '💰', date DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)

    await conn.query(`CREATE TABLE IF NOT EXISTS budgets (
      id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL,
      month VARCHAR(20) NOT NULL, total_income DECIMAL(15,2) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_user_month (user_id, month),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)

    await conn.query(`CREATE TABLE IF NOT EXISTS budget_categories (
      id INT AUTO_INCREMENT PRIMARY KEY, budget_id INT NOT NULL,
      name VARCHAR(100) NOT NULL, percentage INT DEFAULT 0,
      used DECIMAL(15,2) DEFAULT 0, total DECIMAL(15,2) DEFAULT 0,
      color VARCHAR(20) DEFAULT '#7C3AED',
      FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)

    await conn.query(`CREATE TABLE IF NOT EXISTS articles (
      id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255) NOT NULL,
      content TEXT, category VARCHAR(100) NOT NULL, read_time INT DEFAULT 5,
      image VARCHAR(10) DEFAULT '📄', bg_color VARCHAR(20) DEFAULT '#EDE9FE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)

    await conn.query(`CREATE TABLE IF NOT EXISTS notifications (
      id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL,
      type VARCHAR(50) DEFAULT 'info', title VARCHAR(150) NOT NULL,
      body TEXT, is_read TINYINT(1) DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)

    await conn.query(`CREATE TABLE IF NOT EXISTS ratings (
      id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL,
      score INT NOT NULL, comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)

    await conn.query(`CREATE TABLE IF NOT EXISTS simulations (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      user_id       INT           NOT NULL,
      label         VARCHAR(150)  DEFAULT NULL,
      modal         DECIMAL(15,2) NOT NULL,
      monthly       DECIMAL(15,2) NOT NULL,
      rate          DECIMAL(5,2)  NOT NULL,
      years         INT           NOT NULL,
      result_total  DECIMAL(15,2) NOT NULL,
      result_profit DECIMAL(15,2) NOT NULL,
      result_pct    DECIMAL(7,2)  NOT NULL,
      created_at    DATETIME      DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)

    await conn.query(`CREATE TABLE IF NOT EXISTS admin_requests (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      name        VARCHAR(100)  NOT NULL,
      email       VARCHAR(150)  NOT NULL,
      password    VARCHAR(255)  NOT NULL,
      reason      TEXT          DEFAULT NULL,
      status      ENUM('pending','approved','rejected') DEFAULT 'pending',
      reviewed_by INT           DEFAULT NULL,
      reviewed_at DATETIME      DEFAULT NULL,
      created_at  DATETIME      DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`)

    const [rows] = await conn.query('SELECT COUNT(*) as count FROM articles')
    if (rows[0].count === 0) {
      await conn.query(`INSERT INTO articles (title, category, read_time, image, bg_color) VALUES
        ('Mulai Investasi Rp 100rb/Bulan','INVESTASI',5,'📈','#EDE9FE'),
        ('Bahaya Paylater untuk Gaya Hidup','PAY LATER',4,'⚠️','#FEF3C7'),
        ('Metode 50/30/20 untuk Pemula','BUDGETING',7,'💡','#ECFDF5'),
        ('Cara Nabung Rp 1 Juta per Bulan','TABUNGAN',6,'🏦','#EFF6FF'),
        ('Reksa Dana vs Saham: Mana Lebih Baik?','INVESTASI',8,'📊','#EDE9FE'),
        ('Tips Hemat Belanja Bulanan','BUDGETING',5,'🛒','#ECFDF5'),
        ('Memahami Dana Darurat dan Cara Menabungnya','TABUNGAN',6,'🆘','#FEF3C7')`)
    }
    console.log('✅ Database siap — semua tabel berhasil dibuat/diverifikasi')

    // Pastikan kolom avatar cukup besar untuk Base64
    await conn.query(`ALTER TABLE users MODIFY COLUMN avatar MEDIUMTEXT DEFAULT NULL`)

    // Pastikan kolom is_active ada di tabel users
    try {
      await conn.query(`ALTER TABLE users ADD COLUMN is_active TINYINT(1) DEFAULT 1`)
    } catch (e) {
      if (e.code !== 'ER_DUP_FIELDNAME') throw e
    }

    // Pastikan kolom aspek rating ada (ignore error jika sudah ada)
    const aspectCols = ['aspect_design', 'aspect_ease', 'aspect_feature', 'aspect_performance']
    for (const col of aspectCols) {
      try {
        await conn.query(`ALTER TABLE ratings ADD COLUMN ${col} INT DEFAULT NULL`)
      } catch (e) {
        if (e.code !== 'ER_DUP_FIELDNAME') throw e
      }
    }
  } catch (err) {
    console.error('❌ Gagal inisialisasi database:', err.message)
    throw err
  } finally {
    conn.release()
  }
}

export { pool }