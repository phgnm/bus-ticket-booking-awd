import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            return setError('Mật khẩu xác nhận không khớp');
        }

        try {
            const res = await api.post('/auth/register', {
                email: formData.email,
                password: formData.password,
                full_name: formData.full_name
            });

            const { token, user } = res.data;
            login(token, user);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.msg || 'Đăng ký thất bại. Vui lòng thử lại.');
        }
    };

    return (
        <div className="flex min-h-[80vh] items-center justify-center px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Đăng ký tài khoản</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="full_name">Họ và tên</Label>
                            <Input id="full_name" required value={formData.full_name} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" required value={formData.email} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Mật khẩu</Label>
                            <Input id="password" type="password" required value={formData.password} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                            <Input id="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange} />
                        </div>

                        {error && <p className="text-sm text-destructive text-center">{error}</p>}

                        <Button type="submit" className="w-full">Đăng ký</Button>
                    </form>

                    <div className="mt-4 text-center text-sm">
                        Đã có tài khoản? <Link to="/login" className="text-primary hover:underline">Đăng nhập</Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}