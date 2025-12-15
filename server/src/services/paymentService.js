const pool = require('../config/db');
const payos = require('../config/payos');
const paymentRepository = require('../repositories/paymentRepository');
const { generateTicketPDF } = require('../utils/ticketGenerator');
const { sendTicketEmail } = require('../utils/emailService');

class PaymentService {
    async processWebhook(webhookBody) {
        console.log("------------------------------------------------");
        console.log(" [DEBUG] Webhook Body RAW:", JSON.stringify(webhookBody));

        // 1. Verify Signature
        // Chỉ dùng hàm này để kiểm tra bảo mật (nếu sai key nó sẽ throw error)
        // Ta không cần dùng giá trị return của nó để tránh bị undefined
        try {
            payos.webhooks.verify(webhookBody);
            console.log(" [DEBUG] Verify Signature thành công!");
        } catch (error) {
            console.error(" [DEBUG] Lỗi Verify Signature (Sai Checksum Key?):", error.message);
            return null;
        }

        // 2. Lấy dữ liệu từ webhookBody (Theo đúng cấu trúc Log đã in ra)
        // Cấu trúc: { code:Str, data: { orderCode:Num, ... } }
        const { code, data } = webhookBody;
        const orderCode = data ? data.orderCode : undefined;

        console.log(` [DEBUG] Info trích xuất -> Code: ${code} | OrderCode: ${orderCode}`);

        // 3. Kiểm tra logic
        if (code !== '00') {
            console.log(" [DEBUG] Giao dịch thất bại hoặc bị hủy (Code != 00)");
            return null;
        }

        if (!orderCode) {
            console.error(" [DEBUG] Không tìm thấy OrderCode trong gói tin!");
            return null;
        }

        // 4. Update Database
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            console.log(" [DEBUG] Đang update DB cho OrderCode:", orderCode);
            const updatedBooking = await paymentRepository.updateBookingStatus(
                client,
                orderCode, // Dùng biến orderCode đã lấy chính xác ở trên
                'PAID',
            );

            if (!updatedBooking) {
                console.error(` [DEBUG] Update thất bại! Có thể không tìm thấy OrderCode: ${orderCode} trong DB.`);
                // Lưu ý: Kiểm tra xem lúc tạo vé orderCode là số hay chuỗi.
                // Log của bạn cho thấy PayOS trả về số: 765702109
                await client.query('COMMIT');
                return null;
            }

            // 5. Get Details để gửi mail
            const tripData = await paymentRepository.getBookingDetails(
                client,
                updatedBooking.booking_code,
            );

            await client.query('COMMIT');

            if (!tripData) {
                console.error(" [DEBUG] Không lấy được chi tiết chuyến đi sau khi update");
                return null;
            }

            const fullBookingData = {
                booking_code: updatedBooking.booking_code,
                passenger_name: tripData.passenger_name,
                passenger_phone: tripData.passenger_phone,
                contact_email: tripData.contact_email,
                from: tripData.from_loc,
                to: tripData.to_loc,
                departure_time: tripData.departure_time,
                license_plate: tripData.license_plate,
                seats: tripData.seats,
                total_price: parseFloat(tripData.total_price),
                trip_id: tripData.trip_id,
            };

            // 6. Send Email
            console.log(" [DEBUG] Đang tạo và gửi email tới:", fullBookingData.contact_email);
            this._sendEmailInBackground(fullBookingData);

            return fullBookingData;
        } catch (err) {
            await client.query('ROLLBACK');
            console.error(" [DEBUG] Lỗi Transaction Database:", err);
            throw err;
        } finally {
            client.release();
        }
    }

    async _sendEmailInBackground(bookingData) {
        try {
            const pdfBuffer = await generateTicketPDF(bookingData);
            await sendTicketEmail(
                bookingData.contact_email,
                bookingData.booking_code,
                pdfBuffer,
                bookingData,
            );
            console.log(` [SUCCESS] Email sent successfully for: ${bookingData.booking_code}`);
        } catch (err) {
            console.error(' [ERROR] Gửi Email thất bại:', err);
        }
    }
}

module.exports = new PaymentService();