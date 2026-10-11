CREATE DATABASE IF NOT EXISTS crypto_screen DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE crypto_screen;

DROP TABLE IF EXISTS detail_rows;
DROP TABLE IF EXISTS security_events;
DROP TABLE IF EXISTS resource_points;
DROP TABLE IF EXISTS system_points;
DROP TABLE IF EXISTS filing_points;
DROP TABLE IF EXISTS city_metrics;
DROP TABLE IF EXISTS cities;

CREATE TABLE cities (
  name VARCHAR(64) PRIMARY KEY,
  contact VARCHAR(64) NOT NULL,
  node_name VARCHAR(64) NOT NULL,
  sort_order INT NOT NULL
);

CREATE TABLE city_metrics (
  city VARCHAR(64) PRIMARY KEY,
  filed INT NOT NULL,
  testing INT NOT NULL,
  passed INT NOT NULL,
  failed INT NOT NULL,
  online_sys INT NOT NULL,
  offline_sys INT NOT NULL,
  online_res INT NOT NULL,
  offline_res INT NOT NULL,
  orgs INT NOT NULL,
  systems INT NOT NULL,
  devices INT NOT NULL,
  filing_rate DECIMAL(5,1) NOT NULL,
  sys_online DECIMAL(5,1) NOT NULL,
  dev_online DECIMAL(5,1) NOT NULL,
  CONSTRAINT fk_metrics_city FOREIGN KEY (city) REFERENCES cities(name)
);

CREATE TABLE filing_points (
  id INT AUTO_INCREMENT PRIMARY KEY,
  city VARCHAR(64) NOT NULL,
  month CHAR(7) NOT NULL,
  point_index INT NOT NULL,
  label VARCHAR(32) NOT NULL,
  filed INT NOT NULL,
  testing INT NOT NULL,
  passed INT NOT NULL,
  failed INT NOT NULL,
  UNIQUE KEY uk_filing (city, month, point_index)
);

CREATE TABLE system_points (
  id INT AUTO_INCREMENT PRIMARY KEY,
  city VARCHAR(64) NOT NULL,
  month CHAR(7) NOT NULL,
  point_index INT NOT NULL,
  label VARCHAR(32) NOT NULL,
  online_count INT NOT NULL,
  offline_count INT NOT NULL,
  online_rate INT NOT NULL,
  UNIQUE KEY uk_system (city, month, point_index)
);

CREATE TABLE resource_points (
  id INT AUTO_INCREMENT PRIMARY KEY,
  city VARCHAR(64) NOT NULL,
  month CHAR(7) NOT NULL,
  point_index INT NOT NULL,
  label VARCHAR(32) NOT NULL,
  access_count INT NOT NULL,
  online_rate INT NOT NULL,
  UNIQUE KEY uk_resource (city, month, point_index)
);

CREATE TABLE security_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(128) NOT NULL,
  status VARCHAR(32) NOT NULL,
  reported_at VARCHAR(32) NOT NULL,
  action VARCHAR(32) NOT NULL DEFAULT '',
  sort_order INT NOT NULL
);

CREATE TABLE detail_rows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  kind VARCHAR(32) NOT NULL,
  c1 VARCHAR(128) NOT NULL,
  c2 VARCHAR(64) NOT NULL,
  c3 VARCHAR(64) NOT NULL,
  c4 VARCHAR(64) NOT NULL,
  sort_order INT NOT NULL
);
