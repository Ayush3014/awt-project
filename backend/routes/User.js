const express = require('express');
const router = express.Router();

// middlewares
const { auth } = require('../middlewares/auth');

// controllers
const {
  sendOTP,
  signUp,
  login,
  changePassword,
} = require('../controllers/Auth');

const {
  resetPassword,
  resetPasswordToken,
} = require('../controllers/ResetPassword');

//routes
router.post('/sendOtp', sendOTP);
router.post('/signup', signUp);
router.post('/login', login);
router.post('/changePassword', auth, changePassword);

router.post('/reset-password-token', resetPasswordToken);
router.post('/reset-password', resetPassword);

module.exports = router;
