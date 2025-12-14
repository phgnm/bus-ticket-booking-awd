-- ================ CLEAR DATABASE =================
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS route_points CASCADE;
DROP TABLE IF EXISTS routes CASCADE;
DROP TABLE IF EXISTS points CASCADE;
DROP TABLE IF EXISTS buses CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS users CASCADE;
-- ================ TẠO DATABASE =================
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


-- === BẢNG QUẢN LÝ ĐỊA ĐIỂM (Tỉnh/Thành phố) ===
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE, -- VD: Tp. Hồ Chí Minh, Lâm Đồng, Khánh Hòa
    type VARCHAR(50),                  -- VD: Tỉnh, Thành phố
    thumbnail VARCHAR(255)             -- Ảnh đại diện cho địa điểm (để hiển thị ở trang chủ "Điểm đến phổ biến")
);

-- === BẢNG QUẢN LÝ ĐIỂM ĐÓN/TRẢ CỤ THỂ ===
CREATE TABLE IF NOT EXISTS points (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    address TEXT,              
    location_id INT REFERENCES locations(id) ON DELETE SET NULL,
    lat FLOAT,                  -- Vĩ độ (Google Maps) - Optional
    lng FLOAT                   -- Kinh độ (Google Maps) - Optional
);

-- === BẢNG QUẢN LÝ XE BUS ===
CREATE TABLE IF NOT EXISTS buses (
    id SERIAL PRIMARY KEY,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    brand VARCHAR(100),
    seat_capacity INT NOT NULL, 
    type VARCHAR(50) NOT NULL,
    seat_layout JSONB,
    amenities JSONB DEFAULT '[]',
    images JSONB DEFAULT '[]'
);

-- === BẢNG QUẢN LÝ TUYẾN ĐƯỜNG ===
CREATE TABLE IF NOT EXISTS routes (
    id SERIAL PRIMARY KEY,
    route_from INT REFERENCES locations(id), 
    route_to INT REFERENCES locations(id),
    distance INT, -- tính bằng km 
    estimated_duration INT, -- tính bằng phút 
    price_base DECIMAL(10, 2) NOT NULL
);

-- === BẢNG CẤU HÌNH ĐIỂM ĐÓN/TRẢ CHO TUYẾN ĐƯỜNG ===
CREATE TABLE IF NOT EXISTS route_points (
    id SERIAL PRIMARY KEY,
    route_id INT REFERENCES routes(id) ON DELETE CASCADE,
    point_id INT REFERENCES points(id) ON DELETE CASCADE,
    type VARCHAR(20) CHECK (type IN ('PICKUP', 'DROPOFF')),
    order_index INT NOT NULL,  -- Thứ tự xuất hiện (1, 2, 3...)
    time_offset INT DEFAULT 0, -- Thời gian dự kiến đến điểm này (tính bằng phút so với giờ xuất bến)
    UNIQUE(route_id, point_id, type) -- Một điểm không thể vừa là điểm đón thứ 1 vừa là điểm đón thứ 2 trong cùng 1 route
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
    booking_code VARCHAR(20) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    transaction_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =================== SEED DATA ====================

-- === 1. INSERT LOCATIONS ===
INSERT INTO locations (name, type, thumbnail) VALUES 
('Tp. Hồ Chí Minh', 'Thành phố', 'https://example.com/hcm.jpg'),
('Đà Lạt', 'Thành phố', 'https://example.com/dalat.jpg'),
('Vũng Tàu', 'Thành phố', 'https://example.com/vungtau.jpg');

-- === 2. INSERT POINTS (Điểm đón trả) ===
-- Points ở HCM (Location ID = 1)
INSERT INTO points (name, address, location_id) VALUES 
('Bến xe Miền Đông Mới', '501 Hoàng Hữu Nam, TP. Thủ Đức', 1),
('Ngã 4 Hàng Xanh', '486 Điện Biên Phủ, Bình Thạnh', 1),
('Văn phòng Quận 1', '200 Phạm Ngũ Lão, Quận 1', 1);

-- Points ở Đà Lạt (Location ID = 2)
INSERT INTO points (name, address, location_id) VALUES 
('Bến xe Liên Tỉnh Đà Lạt', '01 Tô Hiến Thành, Phường 3', 2),
('Chợ Đà Lạt', 'Nguyễn Thị Minh Khai, Phường 1', 2);

-- Points ở Vũng Tàu (Location ID = 3)
INSERT INTO points (name, address, location_id) VALUES 
('Bến xe Vũng Tàu', 'Nam Kỳ Khởi Nghĩa, Thắng Tam', 3);

-- === 3. INSERT BUSES ===
INSERT INTO buses (license_plate, brand, seat_capacity, type, amenities, images, seat_layout) VALUES 
('51B-123.45', 'Phương Trang', 40, 'Sleeper', 
 '["Wifi", "Air Conditioning", "Water", "Blanket"]', 
 '["https://example.com/bus1.jpg"]',
 '{"rows": 10, "cols": 4, "aisle": 2}'
),
('49B-999.99', 'Thành Bưởi', 34, 'Limousine', 
 '["Wifi", "USB Charging", "TV", "Massage Seat"]', 
 '["https://example.com/bus2.jpg"]',
 '{"rows": 9, "cols": 3, "aisle": 1}'
);

INSERT INTO buses (license_plate, brand, seat_capacity, type, amenities, images, seat_layout) VALUES 
('60B-567.89', 'Kumho Samco', 29, 'Seater', '["Wifi", "Water"]', '[]', '{"rows": 7, "cols": 4, "aisle": 2}'),
('29B-888.88', 'Vân Chính', 34, 'Limousine', '["Wifi", "TV", "USB"]', '[]', '{"rows": 9, "cols": 3, "aisle": 1}'),
('72B-111.22', 'Hoa Mai', 16, 'Minivan', '["Wifi", "Water"]', '[]', '{"rows": 5, "cols": 3, "aisle": 0}')
ON CONFLICT (license_plate) DO NOTHING;

-- === 4. INSERT ROUTES ===
-- Tuyến 1: HCM -> Đà Lạt (300km, 8 tiếng, 300k)
INSERT INTO routes (route_from, route_to, distance, estimated_duration, price_base) VALUES 
(1, 2, 300, 480, 300000);

-- Tuyến 2: HCM -> Vũng Tàu (100km, 2.5 tiếng, 180k)
INSERT INTO routes (route_from, route_to, distance, estimated_duration, price_base) VALUES 
(1, 3, 100, 150, 180000);

INSERT INTO routes (route_from, route_to, distance, estimated_duration, price_base) VALUES 
(2, 1, 300, 480, 300000), -- Đà Lạt -> HCM
(3, 1, 100, 150, 180000); -- Vũng Tàu -> HCM

-- === 5. INSERT ROUTE_POINTS (Cấu hình lộ trình) ===
-- Cấu hình cho Tuyến 1 (HCM -> Đà Lạt, RouteID = 1)
INSERT INTO route_points (route_id, point_id, type, order_index, time_offset) VALUES 
(1, 3, 'PICKUP', 1, 0),   -- Đón tại VP Quận 1 (Xuất phát)
(1, 2, 'PICKUP', 2, 30),  -- Đón tại Hàng Xanh (+30p)
(1, 1, 'PICKUP', 3, 60),  -- Đón tại BX Miền Đông (+60p)
(1, 4, 'DROPOFF', 4, 480), -- Trả tại BX Đà Lạt (+8 tiếng)
(1, 5, 'DROPOFF', 5, 500); -- Trả tại Chợ Đà Lạt (+8 tiếng 20p)

-- === 6. INSERT TRIPS (Lên lịch chuyến đi) ===
-- Xe Phương Trang chạy tuyến HCM -> Đà Lạt ngày mai lúc 22:00
INSERT INTO trips (route_id, bus_id, departure_time, status) VALUES 
(1, 1, NOW() + INTERVAL '1 day' + INTERVAL '22 hours' - CAST(NOW() AS TIME), 'SCHEDULED');
-- (Mẹo: Câu lệnh trên lấy ngày mai và set giờ cứng là 22:00 bất kể bạn chạy lệnh lúc nào)

-- Xe Thành Bưởi chạy tuyến HCM -> Đà Lạt ngày mốt lúc 23:00
INSERT INTO trips (route_id, bus_id, departure_time, status) VALUES 
(1, 2, NOW() + INTERVAL '2 days' + INTERVAL '23 hours' - CAST(NOW() AS TIME), 'SCHEDULED');

-- === 7. INSERT BOOKINGS (Cần cập nhật format mới nếu muốn seed) ===
-- Ví dụ: User đặt 1 ghế A1
INSERT INTO bookings (trip_id, passenger_name, passenger_phone, seat_number, total_price, booking_code, contact_email, booking_status) 
VALUES 
((SELECT id FROM trips LIMIT 1), 'Nguyen Van A', '0909123456', 'A01', 300000, 'SEED-12345', 'user1@example.com', 'PAID');


-- === DYNAMIC DATA GENERATION ===


-- =========== DATABASE INDEXING ===========
CREATE INDEX IF NOT EXISTS idx_routes_from_to ON routes(route_from, route_to);

CREATE INDEX IF NOT EXISTS idx_trips_departure_date ON trips ((DATE(departure_time)));

CREATE INDEX IF NOT EXISTS idx_bookings_trip_id ON bookings(trip_id);

CREATE INDEX IF NOT EXISTS idx_bookings_lookup ON bookings(booking_code, contact_email);

CREATE INDEX IF NOT EXISTS idx_bookings_code ON bookings(booking_code);

CREATE UNIQUE INDEX idx_unique_active_seat ON bookings (trip_id, seat_number) WHERE booking_status != 'CANCELLED';

-- Additional optimization indexes
CREATE INDEX IF NOT EXISTS idx_routes_price ON routes(price_base);
CREATE INDEX IF NOT EXISTS idx_buses_type ON buses(type);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);

-- Optional: For text search if pg_trgm is available (commented out to be safe unless extension is enabled)
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX IF NOT EXISTS idx_locations_name_trgm ON locations USING gin (name gin_trgm_ops);
