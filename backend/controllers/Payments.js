const { instance } = require('../config/razorpay');
const User = require('../models/User');
const Course = require('../models/Course');
const mailSender = require('../utils/mailSender');
const {
  paymentSuccessEmail,
} = require('../mail/templates/paymentSuccessEmail');
const mongoose = require('mongoose');

// capture payment and initiate the razorpay order
const capturePayment = async (req, res) => {
  // get courseid and userid
  const { courseId } = req.body;
  const userId = req.user.id;

  // valid courseid
  if (!courseId) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid course id',
    });
  }

  let course;
  try {
    // valid courseDetail
    course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Could not find the course',
      });
    }
    // user already paid for the same course
    const uid = new mongoose.Types.ObjectId(userId);
    if (course.studentsEnrolled.includes(uid)) {
      return res.status(200).json({
        success: false,
        message: 'Student is already enrolled in this course',
      });
    }
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to capture the payment',
      err,
    });
  }

  // order create
  const amount = course.price;
  const currency = 'INR';
  const options = {
    amount: amount * 100,
    currency,
    receipt: Math.random(Date.now()).toString(),
    notes: {
      courseId,
      userId,
    },
  };

  try {
    // initiate the payment using razorpay
    const paymentResponse = await instance.orders.create(options);
    console.log(paymentResponse);

    // return response
    return res.status(200).json({
      success: true,
      courseName: course.courseName,
      courseDescription: course.courseDescription,
      thumbnail: course.thumbnail,
      orderId: paymentResponse.id,
      currency: paymentResponse.currency,
      amount: paymentResponse.amount,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate payment using razorpay',
      err,
    });
  }
};

// verify signature of razorpay and server
const verifySignature = async (req, res) => {
  const webHookSecret = '12345678';
  const signature = req.headers['x-razorpay-signature'];

  const shaSum = crypto.createHmac('sha256', webHookSecret);
  shaSum.update(JSON.stringify(req.body));
  const digest = shaSum.digest('hex');

  if (signature === digest) {
    console.log('Payment authorized');

    const { courseId, userId } = req.body.payload.payment.entity.notes;

    try {
      // fulfill the action

      // find the course and enroll the student in it
      const enrolledCourse = await Course.findByIdAndUpdate(
        { _id: courseId },
        {
          $push: {
            studentsEnrolled: userId,
          },
        },
        { new: true }
      );

      if (!enrolledCourse) {
        return res.status(500).json({
          success: false,
          message: 'Course not found',
        });
      }

      console.log(enrolledCourse);

      // find the student and add the course to their enrolled course list
      const enrolledStudent = await User.findByIdAndUpdate(
        { _id: userId },
        {
          $push: {
            courses: courseId,
          },
        },
        { new: true }
      );

      console.log(enrolledStudent);

      // send confirmation mail
      const emailResponse = await mailSender(
        enrolledStudent.email,
        'Congratulations',
        'Congratulations, you have enrolled in a new course'
      );
      console.log(emailResponse);

      return res.status(200).json({
        success: true,
        message: 'Signature verified and course added',
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: 'Failed to verify the signature and add the course',
        err,
      });
    }
  } else {
    return res.status(400).json({
      success: false,
      message: 'Invalid request',
    });
  }
};

//test it , to send payment confirmation mail
const sendPaymentConfirmation = async (req, res) => {
  try {
    //order details
    const { orderId, paymentId, amount } = req.body;
    const { id } = req.user;

    //validation
    if (!orderId || !paymentId || !amount || !id) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all the fields',
      });
    }

    //to get buyer email
    const enrolledStudent = await User.findById(id);

    //sending email
    await mailSender(
      enrolledStudent.email,
      `Payment Successfull-StudyNotion`,
      paymentSuccessEmail(
        `${enrolledStudent.firstName}`,
        amount / 100,
        orderId,
        paymentId
      )
    );

    res.status(200).json({
      success: true,
      message: 'Payment mail sent!',
    });
  } catch (err) {
    console.log('Err in sending payment confirmation-> ', err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong , Try again',
    });
  }
};

module.exports = {
  capturePayment,
  verifySignature,
  sendPaymentConfirmation,
};
