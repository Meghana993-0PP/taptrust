-- Migration 007: Create Messages table
-- Persists real-time chat messages between booking participants

CREATE TABLE IF NOT EXISTS Messages (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  booking_id   INT NOT NULL,
  sender_id    INT NOT NULL,
  receiver_id  INT NOT NULL,
  message_text TEXT NOT NULL,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id)  REFERENCES Bookings(id),
  FOREIGN KEY (sender_id)   REFERENCES Users(id),
  FOREIGN KEY (receiver_id) REFERENCES Users(id),
  INDEX idx_booking_id (booking_id)
);
