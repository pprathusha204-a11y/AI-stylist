-- Run against the existing application database before starting the server.
CREATE TABLE IF NOT EXISTS callback_requests (
  id CHAR(36) PRIMARY KEY,
  request_key CHAR(36) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(16) NOT NULL,
  service VARCHAR(100) NOT NULL,
  status ENUM('Pending', 'Contacted', 'Closed') NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notification_status ENUM('Pending', 'Sent') NOT NULL DEFAULT 'Pending',
  notification_attempted_at TIMESTAMP NULL,
  notification_attempts INT UNSIGNED NOT NULL DEFAULT 0,
  INDEX idx_callback_pending (status, created_at),
  INDEX idx_callback_notifications (notification_status, notification_attempted_at)
);
CREATE TABLE IF NOT EXISTS callback_rate_limits (
  rate_key CHAR(64) PRIMARY KEY,
  window_start BIGINT NOT NULL,
  attempts INT UNSIGNED NOT NULL
);
