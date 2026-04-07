-- Migration 008: Create Notifications table
-- Stores in-app notifications for all users

CREATE TABLE IF NOT EXISTS Notifications (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  type        VARCHAR(50) NOT NULL,
  message     TEXT NOT NULL,
  link        VARCHAR(255),
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id),
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read)
);
