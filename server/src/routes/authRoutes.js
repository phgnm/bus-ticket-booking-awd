const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { 
    registerValidation, 
    forgotPasswordValidation,
    resetPasswordValidation 
} = require('../middlewares/validationMiddleware');

router.post('/register', registerValidation, authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/google-login', authController.googleLogin);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);

module.exports = router;
