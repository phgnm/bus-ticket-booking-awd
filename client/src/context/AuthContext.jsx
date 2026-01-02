import { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    // Khởi tạo state từ sessionStorage
    const [token, setToken] = useState(sessionStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        //  Kiểm tra user từ sessionStorage khi reload trang
        const storedUser = sessionStorage.getItem('user');
        if (token && storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Error parsing user data", e);
            }
        }
        setLoading(false);
    }, [token]);

    const login = (newToken, userData) => {
        setToken(newToken);
        setUser(userData);
        //  Lưu vào sessionStorage (mất khi đóng tab)
        sessionStorage.setItem('token', newToken);
        sessionStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Failed to logout from server', error);
        } finally {
            setToken(null);
            setUser(null);
            //  Xóa khỏi sessionStorage
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            // Dùng window.location để clear state sạch sẽ và redirect về home
            window.location.href = '/login';
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);