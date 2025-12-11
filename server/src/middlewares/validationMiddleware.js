const { body, validationResult } = require('express-validator');

// shared middleware to handle validation
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array().map((e) => e.msg),
        });
    }
    next();
};

// rules for register
exports.registerValidation = [
    body('email').isEmail().withMessage('Email không hợp lệ.'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Mật khẩu phải có ít nhất 6 ký tự.'),
    body('full_name').notEmpty().withMessage('Tên đầy đủ không được để trống.'),
    handleValidationErrors,
];

// rules for forget password
exports.forgotPasswordValidation = [
    body('email').isEmail().withMessage('Email không hợp lệ.'),
    handleValidationErrors,
];

// rules for reset password
exports.resetPasswordValidation = [
    body('token').notEmpty().withMessage('Token không được để trống.'),
    body('newPassword')
        .isLength({ min: 6 })
        .withMessage('Mật khẩu mới phải có ít nhất 6 ký tự.'),
    handleValidationErrors,
];
