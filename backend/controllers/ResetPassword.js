const User = require('../models/User');
const mailSender = require('../utils/mailSender');
const bcrypt = require('bcrypt');

// resetPasswordToken
const resetPasswordToken = async (req, res) => {
  try {
    // get email from req body
    const email = req.body.email;

    // check user for email, email validation
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'This email is not registered. Please sign up.',
      });
    }

    // generate token
    const token = crypto.randomUUID();

    // update user by adding token and expiration time
    const updatedDetails = await User.findOneAndUpdate(
      { email: email },
      {
        token: token,
        resetPasswordExpires: Date.now() + 5 * 60 * 1000,
      },
      { new: true }
    );

    // create url
    const url = `http://localhost:3000/update-password/${token}`;

    // send mail containing the url
    await mailSender(
      email,
      'Password Reset Link',
      `Password Reset Link: ${url}`
    );

    // return response
    return res.json({
      success: true,
      message: 'Email sent successfully.',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message:
        'Something went wrong while trying to send the reset password email',
    });
  }
};

// resetPassword
const resetPassword = async (req, res) => {
  try {
    // data fetch
    const { password, confirmPassword, token } = req.body;

    // validation
    if (password !== confirmPassword) {
      return res.json({
        success: false,
        message: 'Password not matching',
      });
    }

    // get userdetails from db using token
    const userDetails = await User.findOne({ token: token });
    if (!userDetails) {
      return res.json({
        success: false,
        message: 'Token is invalid',
      });
    }

    // token time check
    if (userDetails.resetPasswordExpires < Date.now()) {
      return res.json({
        success: false,
        message: 'Token expired. Please try again',
      });
    }

    // hash pwd
    const hashedPassword = await bcrypt.hash(password, 10);

    // pwd update
    await User.findOneAndUpdate(
      { token: token },
      { password: hashedPassword },
      { new: true }
    );

    // return response
    return res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message:
        'Something went wrong while resetting the password. Please try again',
    });
  }
};

module.exports = {
  resetPasswordToken,
  resetPassword,
};
