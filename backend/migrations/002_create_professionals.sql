-- Migration 002: Create Professionals table
-- Stores provider-specific profile data linked to a Users record

CREATE TABLE IF NOT EXISTS Professionals (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  user_id             INT NOT NULL,
  service_category    ENUM('Plumbing','Electrical','Cleaning','Painting','Carpentry','General Construction') NOT NULL,
  years_experience    INT NOT NULL,
  hourly_rate         DECIMAL(10,2) NOT NULL,
  bio                 TEXT,
  skills              TEXT,
  verification_status ENUM('Pending','Verified','Rejected') DEFAULT 'Pending',
  verification_doc    VARCHAR(500),
  average_rating      DECIMAL(3,2) DEFAULT 0.00,
  total_reviews       INT DEFAULT 0,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES Users(id),
  INDEX idx_service_category    (service_category),
  INDEX idx_verification_status (verification_status)
);
