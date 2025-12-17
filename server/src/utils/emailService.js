const transporter = require('../config/mail');

const sendTicketEmail = async (
    toEmail,
    bookingCode,
    ticketPdfBuffer,
    tripInfo,
) => {
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
                    contentType: 'application/pdf',
                },
            ],
        };

        const info = await transporter.sendMail(mailOptions);
        return info;
    } catch (error) {
        console.error('❌ Lỗi khi gửi mail vé:', error);
        // Clean Architecture: Service có thể throw error để Controller biết và log lại,
        // nhưng không nên làm crash app.
        throw error;
    }
};

const sendReminderEmail = async (toEmail, passengerName, tripInfo) => {
    try {
        const mailOptions = {
            from: '"Vexere Bus Lines" <noreply@vexerebus.com>',
            to: toEmail,
            subject: `🔔 Nhắc nhở: Chuyến xe đi ${tripInfo.to} của bạn khởi hành ngày mai!`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
                    <h2 style="color: #f0ad4e; text-align: center;">Sắp đến giờ khởi hành! 🚌</h2>
                    <p>Xin chào <strong>${passengerName}</strong>,</p>
                    <p>Chuyến xe của bạn sẽ khởi hành trong vòng 24 giờ tới. Đừng quên chuẩn bị hành lý nhé!</p>
                    
                    <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px; border: 1px solid #ffeeba;">
                        <p><strong>Điểm đi:</strong> ${tripInfo.from}</p>
                        <p><strong>Điểm đến:</strong> ${tripInfo.to}</p>
                        <p><strong>Giờ xuất bến:</strong> ${new Date(tripInfo.departure_time).toLocaleString('vi-VN')}</p>
                        <p><strong>Biển số xe:</strong> ${tripInfo.license_plate}</p>
                        <p><strong>Ghế:</strong> ${tripInfo.seats}</p>
                    </div>

                    <p>Vui lòng có mặt tại bến xe trước 15-30 phút để làm thủ tục.</p>
                    <p style="text-align: center;">
                        <a href="http://localhost:5173/lookup-ticket" style="background-color: #0060c4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Xem lại vé của bạn</a>
                    </p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #777; text-align: center;">Chúc bạn có một chuyến đi thượng lộ bình an!</p>
                </div>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Reminder sent to ${toEmail}`);
    } catch (error) {
        console.error(`Error sending email: `, error);
    }
};

const sendCancellationEmail = async (toEmail, bookingCode, refundAmountStr) => {
    try {
        let subject = 'Xác nhận Hủy vé xe';
        let htmlContent = `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                <h2 style="color: #d9534f;">Thông báo Hủy vé</h2>
                <p>Xin chào,</p>
                <p>Hệ thống đã ghi nhận yêu cầu hủy vé <b>${bookingCode}</b> của bạn.</p>
                <p>Trạng thái vé hiện tại: <b style="color: #d9534f;">ĐÃ HỦY</b></p>
        `;

        if (refundAmountStr) {
            subject = 'Xác nhận Hủy vé và Hoàn tiền';
            htmlContent += `
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0;">Thông tin hoàn tiền</h3>
                    <p>Số tiền hoàn lại (sau khi trừ phí hủy): <b style="color: #28a745; font-size: 18px;">${refundAmountStr} VNĐ</b></p>
                    <p><i>Lưu ý: Tiền sẽ được hoàn về tài khoản thanh toán ban đầu trong vòng 5-7 ngày làm việc.</i></p>
                </div>
            `;
        } else {
             htmlContent += `
                <p>Vì vé chưa thanh toán, bạn sẽ không mất phí hủy.</p>
            `;
        }

        htmlContent += `
                <p>Nếu bạn có thắc mắc, vui lòng liên hệ hotline 1900 xxxx.</p>
                <p>Cảm ơn bạn đã sử dụng dịch vụ.</p>
            </div>
        `;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: toEmail,
            subject: subject,
            html: htmlContent,
        };

        await transporter.sendMail(mailOptions);
        console.log(`📧 Đã gửi email hủy vé cho: ${toEmail}`);
        return true;
    } catch (err) {
        console.error('❌ Lỗi gửi email hủy vé:', err);
        return false; // Không throw lỗi để tránh crash luồng hủy vé chính
    }
};

module.exports = {
    sendTicketEmail,
    sendReminderEmail,
    sendCancellationEmail,
};
