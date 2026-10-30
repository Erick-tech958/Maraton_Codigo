-- MySQL 8.0.16 o superior. Ejecuta en MySQL Workbench.
CREATE DATABASE IF NOT EXISTS carreras_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE carreras_db;
CREATE TABLE IF NOT EXISTS users (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 name VARCHAR(100) NOT NULL,
 email VARCHAR(254) NOT NULL UNIQUE,
 password_hash VARCHAR(161) NOT NULL,
 role ENUM('admin','organizador','participante') NOT NULL,
 birth_date DATE NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS races (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 title VARCHAR(150) NOT NULL, location VARCHAR(200) NOT NULL,
 date DATE NOT NULL, description VARCHAR(2000) NOT NULL DEFAULT '',
 organizer_id INT UNSIGNED NOT NULL, capacity INT UNSIGNED NOT NULL,
 FOREIGN KEY (organizer_id) REFERENCES users(id), CHECK (capacity > 0)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS distances (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 race_id INT UNSIGNED NOT NULL, km DECIMAL(7,3) NOT NULL,
 UNIQUE KEY unique_distance (race_id,km), UNIQUE KEY distance_race (id,race_id),
 FOREIGN KEY (race_id) REFERENCES races(id) ON DELETE CASCADE,
 CHECK (km > 0 AND km <= 500)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS registrations (
 id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 folio VARCHAR(40) NOT NULL UNIQUE,
 user_id INT UNSIGNED NOT NULL, race_id INT UNSIGNED NOT NULL,
 distance_id INT UNSIGNED NOT NULL,
 category ENUM('infantil','edad promedio','tercera edad') NOT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY unique_registration (user_id,race_id),
 FOREIGN KEY (user_id) REFERENCES users(id),
 FOREIGN KEY (race_id) REFERENCES races(id),
 FOREIGN KEY (distance_id,race_id) REFERENCES distances(id,race_id)
) ENGINE=InnoDB;
