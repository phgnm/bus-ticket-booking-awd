const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

const generateTicketPDF = async (bookingData) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const buffers = [];

            // gather data into buffer instead of writing to file
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // header & logo
            doc.fontSize(20).font('Helvetica-Bold').text('VEXERE BUS LINES', { align: 'center' });
            doc.moveDown();
            doc.fontSize(12).font('Helvetica').text('Phieu Xac Nhan Dat Ve / Electronic Ticket', { align: 'center' });
            doc.moveDown();

            // qr code
            QRCode.toDataURL(bookingData.booking_code).then(qrCodeDataUrl => {
                doc.image(qrCodeDataUrl, (doc.page.width - 100) / 2, 130, { fit: [100, 100] });

                doc.moveDown(6);

                // detail info

                doc.fontSize(14).font('Helvetica-Bold').text(`MA VE / BOOKING CODE: ${bookingData.booking_code}`, { align: 'center', color: '#E11D48' });
                doc.moveDown();

                doc.font('Helvetica').fontSize(12).fillColor('black');

                // helper to print line
                const printLine = (label, value) => {
                    doc.font('Helvetica-Bold').text(`${label}: `, { continued: true });
                    doc.font('Helvetica').text(value);
                    doc.moveDown(0.5);
                };

                printLine('Hanh khach / Passenger', bookingData.passenger_name);
                printLine('So dien thoai / Phone', bookingData.passenger_phone);
                printLine('Email', bookingData.contact_email);
                doc.moveDown();

                printLine('Chuyen / Route', `${bookingData.from} - ${bookingData.to}`);
                printLine('Gio khoi hanh / Departure', new Date(bookingData.departure_time).toLocaleString('vi-VN'));
                printLine('Bien so xe / Bus Plate', bookingData.license_plate);
                doc.moveDown();

                printLine('Ghe / Seat(s)', bookingData.seats.join(', '));
                printLine('Tong tien / Total Amount', `${parseInt(bookingData.total_price).toLocaleString('vi-VN')} VND`);

                // footer
                doc.moveDown(2);
                doc.fontSize(10).text('Vui long dua ma ve nay cho nhan vien nha xe de len xe.', { align: 'center', oblique: true });
                doc.text('Please show this ticket to the bus attendant for boarding.', { align: 'center', oblique: true });

                doc.end();
            }).catch(reject);
        }
        catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateTicketPDF };
