-- Migration 004: Create Bookings table
-- Records all service bookings between Customers and Providers

CREATE TABLE IF NOT EXISTS Bookings (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  customer_id      INT NOT NULL,
  provider_id      INT NOT NULL,
  service_category VARCHAR(50) NOT NULL,
  scheduled_date   DATE NOT NULL,
  scheduled_time   TIME NOT NULL,
  service_address  TEXT NOT NULL,
  status           ENUM('Booked','Accepted','In Progress','Completed','Cancelled','Rejected') DEFAULT 'Booked',
  estimated_cost   DECIMAL(10,2),
  rejection_reason TEXT,
  start_timestamp  DATETIME,
  end_timestamp    DATETIME,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES Users(id),
  FOREIGN KEY (provider_id) REFERENCES Professionals(id),
  INDEX idx_status       (status),
  INDEX idx_booking_date (scheduled_date),
  INDEX idx_provider_id  (provider_id),
  INDEX idx_customer_id  (customer_id)
);
