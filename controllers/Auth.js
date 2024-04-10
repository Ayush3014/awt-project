const User = require('../models/User');
const OTP = require('../models/OTP');
const otpGenerator = require('otp-generator');

// sendOTP
exports.sendOTP = async (req, res) => {
  try {
    // extract email from req body
    const { email } = req.body;

    // check if user exists in the database
    const checkUserPresent = await User.findOne({ email });
    if (checkUserPresent) {
      return res.status(401).json({
        success: false,
        message: 'User already registered',
      });
    }

    // if user doesnt exist, generate otp
    var otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    console.log('OTP generated: ', otp);

    // check for unique otp
    const result = await OTP.findOne({ otp });

    // if not unique, keep on generating different otps until unique generated
    while (result) {
      otp = otpGenerator.generate(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });

      result = await OTP.findOne({ otp });
    }

    const otpPayload = { email, otp };

    // adding otp to the database
    const otpBody = await OTP.create(otpPayload);
    console.log(otpBody);

    return res.status(200).json({
      success: true,
      message: 'OTP send successfully',
      otp,
    });
  } catch (err) {
    console.error('Error in sending OTP: ', err);
  }
};

// signUp

// login

// changePassword
