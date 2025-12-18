import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL
    : (import.meta.env.MODE === 'production' ? '/api' : 'http://localhost:5000/api');

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// Interceptor: Tự động gắn token vào header nếu có
api.interceptors.request.use(
    (config) => {
        // [FIX] Đổi từ localStorage -> sessionStorage
        // [FIX] Đổi tên key từ 'idToken' -> 'token' cho khớp với lúc lưu
        const token = sessionStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);



export default api;

// 1. Hàm lấy chi tiết chuyến đi (để biết ghế nào đã full)
export const getTripDetails = async (tripId) => {
    // Giả sử bạn đã có API get trip detail, nếu chưa có thì dùng logic tìm kiếm
    // Hoặc tái sử dụng API search chuyến đi
    const res = await api.get(`/trips/${tripId}`);
    return res.data;
};

// 2. Hàm đổi ghế
export const changeBookingSeat = async (bookingId, newSeatNumber) => {
    const res = await api.put(`/bookings/change-seat/${bookingId}`, { newSeatNumber });
    return res.data;
};