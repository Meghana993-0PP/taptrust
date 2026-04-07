-- Migration 003: Create Services table
-- Catalogue of service types offered on the platform

CREATE TABLE IF NOT EXISTS Services (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  category    ENUM('Plumbing','Electrical','Cleaning','Painting','Carpentry','General Construction') NOT NULL
);
