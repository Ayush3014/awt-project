const Course = require('../models/Course');
const User = require('../models/User');
const Tag = require('../models/Tag');
const { uploadImageToCloudinary } = require('../utils/imageUploader');

// createCourse handler function
exports.createCourse = async (req, res) => {
  try {
    // get data
    const { courseName, courseDescription, whatYouWillLearn, price, tag } =
      req.body;

    // get thumbnail
    const thumbnail = req.files.thumbnailImage;

    // validation
    if (
      !courseName ||
      !courseDescription ||
      !whatYouWillLearn ||
      !price ||
      !tag ||
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

    const tagDetails = await Tag.findById(tag);
    if (!tagDetails) {
      return res.status(404).json({
        success: false,
        message: 'Tag details not found',
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
      tag: tagDetails._id,
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

    // update the tag schema
    await Tag.findIdAndUpdate(
      { _id: tagDetails._id },
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
exports.showAllCourses = async (req, res) => {
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
