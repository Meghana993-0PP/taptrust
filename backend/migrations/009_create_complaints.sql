-- Migration 009: Create Complaints table
-- Feature: taptrust-platform, Task 10.6

CREATE TABLE IF NOT EXISTS Complaints (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  booking_id  INT,
  description TEXT NOT NULL,
  status      ENUM('Open', 'Resolved') DEFAULT 'Open',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES Users(id),
  FOREIGN KEY (booking_id) REFERENCES Bookings(id),
  INDEX idx_complaints_user_id   (user_id),
  INDEX idx_complaints_status    (status),
  INDEX idx_complaints_created_at (created_at)
);
