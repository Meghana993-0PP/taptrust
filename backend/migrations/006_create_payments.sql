-- Migration 006: Create Payments table
-- Records payment transactions for completed bookings

CREATE TABLE IF NOT EXISTS Payments (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  booking_id          INT NOT NULL,
  customer_id         INT NOT NULL,
  amount              DECIMAL(10,2) NOT NULL,
  status              ENUM('Pending','Completed','Failed') DEFAULT 'Pending',
  transaction_ref     VARCHAR(255),
  payment_gateway     VARCHAR(50) DEFAULT 'stripe',
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id)  REFERENCES Bookings(id),
  FOREIGN KEY (customer_id) REFERENCES Users(id)
);
