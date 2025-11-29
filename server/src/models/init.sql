-- === BẢNG NGƯỜI DÙNG ===
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user',
    google_id VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE, 
    verification_token TEXT,           
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- === BẢNG REFRESH TOKENS ĐỂ DUY TRÌ ĐĂNG NHẬP ===
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    token TEXT NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- === BẢNG HỖ TRỢ CHỨC NĂNG QUÊN MẬT KHẨU ===
CREATE TABLE IF NOT EXISTS password_resets (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

-- === BẢNG QUẢN LÝ XE BUS ===
CREATE TABLE IF NOT EXISTS buses (
    id SERIAL PRIMARY KEY,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    seat_capacity INT NOT NULL, 
    type VARCHAR(50) NOT NULL,
    seat_layout JSONB 
);

-- === BẢNG QUẢN LÝ TUYẾN ĐƯỜNG ===
CREATE TABLE IF NOT EXISTS routes (
    id SERIAL PRIMARY KEY,
    route_from VARCHAR(100) NOT NULL, 
    route_to VARCHAR(100) NOT NULL,
    distance INT, -- tính bằng km 
    estimated_duration INT, -- tính bằng phút 
    price_base DECIMAL(10, 2) NOT NULL
);

-- === BẢNG QUẢN LÝ CHUYẾN ĐI ===
CREATE TABLE IF NOT EXISTS trips (
    id SERIAL PRIMARY KEY,
    route_id INT REFERENCES routes(id) ON DELETE RESTRICT,
    bus_id INT REFERENCES buses(id) ON DELETE RESTRICT,
    departure_time TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'SCHEDULED',     -- Trạng thái chuyến đi: 'SCHEDULED', 'DEPARTED', 'COMPLETED', 'CANCELLED'
    UNIQUE(bus_id, departure_time)
);

-- === BẢNG QUẢN LÝ ĐẶT VÉ ===
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    trip_id INT REFERENCES trips(id) ON DELETE RESTRICT,
    passenger_name VARCHAR(100) NOT NULL, 
    passenger_phone VARCHAR(20) NOT NULL, 
    seat_number VARCHAR(10) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL, 
    booking_status VARCHAR(20) DEFAULT 'PENDING_PAYMENT', 
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(trip_id, seat_number) 
);