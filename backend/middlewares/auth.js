const jwt = require('jsonwebtoken');
require('dotenv').config();
const user = require('../models/User');

// auth
const auth = async (req, res, next) => {
  try {
    // extract token
    const token =
      req.cookies.token ||
      req.body.token ||
      req.headers('Authorisation').replace('Bearer ', '');

    // if token missing, return response
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token is missing',
      });
    }

    // verify the token
    try {
      const decode = await jwt.verify(token, process.env.JWT_SECRET);
      console.log(decode);
      req.user = decode;
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Token Invalid',
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Something went wrong in validating the token',
      err,
    });
  }
};

// isStudent
const isStudent = async (req, res, next) => {
  try {
    if (req.user.accountType !== 'Student') {
      return res.status(401).json({
        success: false,
        message: 'This is a route for students only',
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'User role cannot be verified. Please try again.',
    });
  }
};

// isInstructor
const isInstructor = async (req, res, next) => {
  try {
    if (req.user.accountType !== 'Instructor') {
      return res.status(401).json({
        success: false,
        message: 'This is a route for instructors only',
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'User role cannot be verified. Please try again.',
    });
  }
};

// isAdmin
const isAdmin = async (req, res, next) => {
  try {
    if (req.user.accountType !== 'Admin') {
      return res.status(401).json({
        success: false,
        message: 'This is a route for admins only',
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'User role cannot be verified. Please try again.',
    });
  }
};

module.exports = {
  auth,
  isStudent,
  isInstructor,
  isAdmin,
};
