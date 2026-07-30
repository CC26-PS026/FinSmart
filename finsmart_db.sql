-- ============================================================
--  Finsmart Database Setup
-- ============================================================

CREATE DATABASE IF NOT EXISTS finsmart_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE finsmart_db;

CREATE TABLE IF NOT EXISTS users (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(100) NOT NULL,
  email           VARCHAR(150) NOT NULL UNIQUE,
  password        VARCHAR(255) NOT NULL,
  avatar          LONGTEXT DEFAULT NULL,
  role            ENUM('user','admin','superadmin') DEFAULT 'user',
  two_fa_enabled  TINYINT(1) DEFAULT 0,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS admin_requests (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL,
  password    VARCHAR(255) NOT NULL,
  reason      TEXT DEFAULT NULL,
  status      ENUM('pending','approved','rejected') DEFAULT 'pending',
  reviewed_by INT DEFAULT NULL,
  reviewed_at DATETIME DEFAULT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS transactions (
  id          VARCHAR(36) PRIMARY KEY,
  user_id     INT NOT NULL,
  title       VARCHAR(150) NOT NULL,
  category    VARCHAR(100) NOT NULL,
  amount      DECIMAL(15,2) NOT NULL,
  type        ENUM('masuk','keluar') NOT NULL,
  icon        VARCHAR(10) DEFAULT '💰',
  date        DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS budgets (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT NOT NULL,
  month        VARCHAR(20) NOT NULL,
  total_income DECIMAL(15,2) DEFAULT 0,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_user_month (user_id, month),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS budget_categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  budget_id   INT NOT NULL,
  name        VARCHAR(100) NOT NULL,
  percentage  INT DEFAULT 0,
  used        DECIMAL(15,2) DEFAULT 0,
  total       DECIMAL(15,2) DEFAULT 0,
  color       VARCHAR(20) DEFAULT '#7C3AED',
  FOREIGN KEY (budget_id) REFERENCES budgets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS articles (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  content     TEXT,
  category    VARCHAR(100) NOT NULL,
  read_time   INT DEFAULT 5,
  image       VARCHAR(10) DEFAULT '📄',
  bg_color    VARCHAR(20) DEFAULT '#EDE9FE',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  type        VARCHAR(50) DEFAULT 'info',
  title       VARCHAR(150) NOT NULL,
  body        TEXT,
  is_read     TINYINT(1) DEFAULT 0,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ratings (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  user_id          INT NOT NULL,
  score            INT NOT NULL,
  comment          TEXT,
  aspect_design     TINYINT DEFAULT NULL COMMENT '1-5',
  aspect_ease       TINYINT DEFAULT NULL COMMENT '1-5',
  aspect_feature    TINYINT DEFAULT NULL COMMENT '1-5',
  aspect_performance TINYINT DEFAULT NULL COMMENT '1-5',
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS simulations (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  label         VARCHAR(150) DEFAULT NULL,
  modal         DECIMAL(15,2) NOT NULL,
  monthly       DECIMAL(15,2) NOT NULL,
  rate          DECIMAL(5,2) NOT NULL,
  years         INT NOT NULL,
  result_total  DECIMAL(15,2) NOT NULL,
  result_profit DECIMAL(15,2) NOT NULL,
  result_pct    DECIMAL(7,2) NOT NULL,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO articles (title, content, category, read_time, image, bg_color) VALUES
('Mulai Investasi Rp 100rb/Bulan','Mulai investasi dari nominal kecil secara konsisten untuk memanfaatkan bunga majemuk jangka panjang.','INVESTASI',5,'📈','#EDE9FE'),
('Bahaya Paylater untuk Gaya Hidup','Paylater berisiko mendorong gaya hidup konsumtif dan menumpuk utang jika tidak dikelola dengan bijak.','PAY LATER',4,'⚠️','#FEF3C7'),
('Metode 50/30/20 untuk Pemula','Bagi penghasilan: 50% kebutuhan, 30% keinginan, 20% tabungan dan investasi.','BUDGETING',7,'💡','#ECFDF5'),
('Cara Nabung Rp 1 Juta per Bulan','Sisihkan di awal bulan sebelum digunakan untuk kebutuhan lain agar target tabungan tercapai.','TABUNGAN',6,'🏦','#EFF6FF'),
('Reksa Dana vs Saham: Mana Lebih Baik?','Reksa dana cocok untuk pemula, saham untuk yang mau belajar lebih dalam dengan potensi imbal lebih tinggi.','INVESTASI',8,'📊','#EDE9FE'),
('Tips Hemat Belanja Bulanan','Buat daftar belanja, tentukan anggaran, dan hindari impulse buying untuk menghemat 15-30% pengeluaran.','BUDGETING',5,'🛒','#ECFDF5'),
('Memahami Dana Darurat dan Cara Menabungnya','Siapkan 3-12 bulan pengeluaran sebagai dana darurat di rekening terpisah untuk situasi tidak terduga.','TABUNGAN',6,'🆘','#FEF3C7');