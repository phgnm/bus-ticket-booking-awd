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