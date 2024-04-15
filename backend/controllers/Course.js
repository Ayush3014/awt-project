const Course = require('../models/Course');
const User = require('../models/User');
const Category = require('../models/Category');
const { uploadImageToCloudinary } = require('../utils/imageUploader');

// createCourse handler function
const createCourse = async (req, res) => {
  try {
    // get data
    const { courseName, courseDescription, whatYouWillLearn, price, category } =
      req.body;

    // get thumbnail
    const thumbnail = req.files.thumbnailImage;

    // validation
    if (
      !courseName ||
      !courseDescription ||
      !whatYouWillLearn ||
      !price ||
      !category ||
      !thumbnail
    ) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // check for instructor
    const userId = req.user.id;
    const instructorDetails = await User.findById(userId, {
      accountType: 'Instructor',
    });
    console.log(instructorDetails);

    if (!instructorDetails) {
      return res.status(404).json({
        success: false,
        message: 'Instructor details not found',
      });
    }

    const categoryDetails = await Category.findById(category);
    if (!categoryDetails) {
      return res.status(404).json({
        success: false,
        message: 'Category details not found',
      });
    }

    // upload image to cloudinary
    const thumbnailImage = await uploadImageToCloudinary(
      thumbnail,
      process.env.FOLDER_NAME
    );

    // create course in db
    const newCourse = await Course.create({
      courseName,
      courseDescription,
      instructor: instructorDetails._id,
      whatYouWillLearn,
      price,
      category: categoryDetails._id,
      thumbnail: thumbnailImage.secure_url,
    });

    // add the new course to the user schema of instructor
    await User.findByIdAndUpdate(
      { _id: instructorDetails._id },
      {
        $push: {
          courses: newCourse._id,
        },
      },
      { new: true }
    );

    // update the category schema
    await Category.findIdAndUpdate(
      { _id: categoryDetails._id },
      {
        $push: {
          course: newCourse._id,
        },
      },
      { new: true }
    );

    // return response
    return res.status(200).json({
      success: true,
      message: 'Course created successfully',
      data: newCourse,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// getAllCourses handler function
const getAllCourses = async (req, res) => {
  try {
    const allCourses = await Course.find({});
    return res.status(200).json({
      success: true,
      message: 'All courses returned successfully',
      allCourses,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getCourseDetails = async (req, res) => {
  try {
    const { courseId } = req.body;

    //validation
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Missing fields',
      });
    }

    const course = await Course.findById(courseId)
      .populate('category')
      .populate('ratingAndReviews')
      .populate({
        path: 'courseContent',
        populate: {
          path: 'subSection',
        },
      })
      .populate({
        path: 'instructor',
        populate: {
          path: 'additionalDetails',
        },
      })
      .exec();

    //validation
    if (!course) {
      return res.status(400).json({
        success: false,
        message: 'Course not found',
      });
    }

    //response
    res.status(200).json({
      success: true,
      data: course,
      message: 'Course details fetched successfully',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Something went wrong! , Try again',
      err,
    });
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourseDetails,
};
