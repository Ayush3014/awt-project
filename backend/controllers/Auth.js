const User = require('../models/User');
const OTP = require('../models/OTP');
const Profile = require('../models/Profile');
const otpGenerator = require('otp-generator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

// sendOTP
const sendOTP = async (req, res) => {
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
const signUp = async (req, res) => {
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
const login = async (req, res) => {
  try {
    // get data from req body
    const { email, password } = req.body;

    // data validation
    if (!email || !password) {
      return res.status(403).json({
        success: false,
        message: 'Both email and password are required. Please try again',
      });
    }

    // check user exists or not
    const user = await User.findOne({ email }).populate('additionalDetails');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User is not registered. Please sign up first.',
      });
    }

    // generate JWT, after password matching
    if (await bcrypt.compare(password, user.password)) {
      const payload = {
        email: user.email,
        id: user._id,
        role: user.role,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: '2h',
      });

      user.token = token;
      user.password = undefined;

      // create cookie and send response
      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        httpOnly: true,
      };

      res.cookie('token', token, options).status(200).json({
        success: true,
        token,
        user,
        message: 'Logged in successfully',
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Incorrect Password ',
      });
    }
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: 'User cannot be logged in. Please try again',
    });
  }
};

// changePassword
const changePassword = async (req, res) => {
  try {
    // get data from req body
    const { id } = req.user;

    // get oldpwd, newpwd, confirmNewPwd
    const { oldPassword, newPassword, confirmNewPassword } = req.body;
    const user = await User.findById(id);

    // validation
    if (oldPassword !== user.password) {
      return res.status(400).json({
        success: false,
        message: "Existing Password doesn't match",
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        success: false,
        message: 'The passwords do not match. Please try again',
      });
    }

    if (oldPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'The old and the new passwords cannot be the same.',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // update pwd in DB
    const updatedDetails = await User.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    );

    // send mail - pwd updated
    try {
      const emailResponse = await mailSender(
        updatedDetails.email,
        'Password Updated successfully!',
        'Password updated successfully'
      );
      console.log('Email sent successfully: ', emailResponse);
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: 'Error occurred while sending email',
        err,
      });
    }

    // return response
    return res.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Password change failed. Please try again.',
    });
  }
};

module.exports = {
  sendOTP,
  signUp,
  login,
  changePassword,
};
