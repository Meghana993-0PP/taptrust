-- Migration 005: Create Reviews table
-- Stores customer ratings and text reviews for completed bookings

CREATE TABLE IF NOT EXISTS Reviews (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  booking_id  INT NOT NULL UNIQUE,
  customer_id INT NOT NULL,
  provider_id INT NOT NULL,
  rating      TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id)  REFERENCES Bookings(id),
  FOREIGN KEY (customer_id) REFERENCES Users(id),
  FOREIGN KEY (provider_id) REFERENCES Professionals(id)
);
