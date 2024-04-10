const User = require('../models/User');
const OTP = require('../models/OTP');
const Profile = require('../models/Profile');
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
    console.log(err);
    return res.status(401).json({
      success: false,
      message: 'Error in sending OTP',
    });
  }
};

// signUp
exports.signUp = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      contactNumber,
      otp,
    } = req.body;

    // validating the fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !otp
    ) {
      return res.status(403).json({
        success: false,
        message: 'All fields are required',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password and confirmPassword do not match. Please try again.',
      });
    }

    const checkUserPresent = await User.findOne({ email });
    if (checkUserPresent) {
      return res.status(401).json({
        success: false,
        message: 'User already registered',
      });
    }

    // recent otp checks
    const recentOtp = await OTP.find({ email })
      .sort({ createdAt: -1 })
      .limit(1);
    console.log(recentOtp);
    if (recentOtp.length == 0) {
      return res.status(400).json({
        success: false,
        message: 'OTP Not Found',
      });
    } else if (otp !== recentOtp.otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    // hashing the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // store in the database
    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    });

    const user = await User.create({
      firstName,
      lastName,
      email,
      contactNumber,
      password: hashedPassword,
      accountType,
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
    });

    return res.status(200).json({
      success: true,
      message: 'User registered successfully',
      user,
    });
  } catch (err) {
    console.log(err);
    return res.status(401).json({
      success: false,
      message: 'User cannot be registered. Please try again',
    });
  }
};

// login

// changePassword
