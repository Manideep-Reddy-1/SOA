-- GrandVista Hospitality Microservices Database Initialization Script

CREATE DATABASE IF NOT EXISTS grandvista_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS grandvista_rooms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS grandvista_bookings CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS grandvista_payments CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON grandvista_auth.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON grandvista_rooms.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON grandvista_bookings.* TO 'root'@'%';
GRANT ALL PRIVILEGES ON grandvista_payments.* TO 'root'@'%';

FLUSH PRIVILEGES;
