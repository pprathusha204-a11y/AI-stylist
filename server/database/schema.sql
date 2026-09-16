CREATE DATABASE IF NOT EXISTS tech_tailor_ai
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE tech_tailor_ai;

CREATE TABLE IF NOT EXISTS conversation_sessions (
  id CHAR(36) PRIMARY KEY,
  purchase_intent VARCHAR(50) NOT NULL DEFAULT 'exploring',
  stage VARCHAR(50) NOT NULL DEFAULT 'discover_intent',
  requirements JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id CHAR(36) NOT NULL,
  role ENUM('user', 'assistant') NOT NULL,
  message TEXT NOT NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_chat_session
    FOREIGN KEY (session_id)
    REFERENCES conversation_sessions(id)
    ON DELETE CASCADE,

  INDEX idx_chat_session (session_id),
  INDEX idx_chat_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS recommendation_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id CHAR(36) NOT NULL,
  product_id VARCHAR(100) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  match_percentage DECIMAL(5, 2) NOT NULL,
  reasons JSON NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_recommendation_session
    FOREIGN KEY (session_id)
    REFERENCES conversation_sessions(id)
    ON DELETE CASCADE,

  INDEX idx_recommendation_session (session_id),
  INDEX idx_recommendation_product (product_id)
);