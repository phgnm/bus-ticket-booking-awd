const transporter = require('../config/mail');

const sendTicketEmail = async (toEmail, generateBookingCode, ticketPdfBuffer, tripInfo) => {
    try {
        const mailOptions = {
            from: '"Vexere Bus Lines" <noreply@vexerebus.com>', // Tên hiển thị
            to: toEmail,
            subject: `Vé điện tử của bạn - Mã: ${bookingCode} 🎫`,
            // HTML Template: Nên tách ra file riêng nếu phức tạp, nhưng MVP để đây cũng ổn
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #0060c4; text-align: center;">Cảm ơn bạn đã đặt vé!</h2>
                    <p>Xin chào,</p>
                    <p>Đơn hàng <strong>${bookingCode}</strong> của bạn đã được xác nhận thành công.</p>
                    
                    <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 5px;">
                        <p><strong>Chuyến:</strong> ${tripInfo.from} đi ${tripInfo.to}</p>
                        <p><strong>Thời gian:</strong> ${new Date(tripInfo.departure_time).toLocaleString('vi-VN')}</p>
                        <p><strong>Số ghế:</strong> ${tripInfo.seats.join(', ')}</p>
                    </div>

                    <p style="color: #d9534f;">⚠️ <strong>Quan trọng:</strong> Vé điện tử (định dạng PDF) đã được đính kèm trong email này. Vui lòng tải về và xuất trình cho nhân viên khi lên xe.</p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #777; text-align: center;">Đây là email tự động, vui lòng không trả lời.</p>
                </div>
            `,
            attachments: [
                {
                    filename: `Ve_xe_${bookingCode}.pdf`,
                    content: ticketPdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        };

        const info = await transporter.sendMail(mailOptions);
        return info;
    }
    catch (error) {
        console.error('❌ Lỗi khi gửi mail vé:', error);
        // Clean Architecture: Service có thể throw error để Controller biết và log lại, 
        // nhưng không nên làm crash app.
        throw error; 
    }
};

module.exports = {
    sendTicketEmail
};