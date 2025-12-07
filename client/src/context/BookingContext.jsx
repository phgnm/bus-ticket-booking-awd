// client/src/context/BookingContext.jsx
import { createContext, useContext, useState } from 'react';

const BookingContext = createContext();

export const BookingProvider = ({ children }) => {
    const [bookingData, setBookingData] = useState({
        trip: null,          // Thông tin chuyến đi (lấy từ trang Search)
        selectedSeats: [],   // Danh sách ghế đang giữ: ['A01', 'A02']
        passengerInfo: {     // Thông tin khách đặt vé
            name: '',
            email: '',
            phone: ''
        },
        paymentMethod: 'PAY_AT_STATION' // Default
    });

    const updateBookingData = (newData) => {
        setBookingData(prev => ({ ...prev, ...newData }));
    };

    const resetBooking = () => {
        setBookingData({
            trip: null,
            selectedSeats: [],
            passengerInfo: { name: '', email: '', phone: '' },
            paymentMethod: 'PAY_AT_STATION'
        });
    };

    return (
        <BookingContext.Provider value={{ bookingData, updateBookingData, resetBooking }}>
            {children}
        </BookingContext.Provider>
    );
};

export const useBooking = () => useContext(BookingContext);