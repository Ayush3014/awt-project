const Rating = require('../models/RatingAndReview');
const Course = require('../models/Course');

const mongoose = require('mongoose');

const createRating = async (req, res) => {
  try {
    // get user id
    const userId = req.user.id;

    // fetch data
    const { rating, review, courseId } = req.body;

    //input validation
    if (!rating || !review || !courseId) {
      return res.status(400).json({
        success: false,
        message: 'Missing fields',
      });
    }

    //check if user is enrolled in course
    const courseDetails = await Course.findOne({
      _id: courseId,
      studentsEnrolled: { $elemMatch: { $eq: userId } },
    });

    if (!courseDetails) {
      return res.status(404).json({
        success: false,
        message: 'User not enrolled into the course',
      });
    }

    //check for existing reviews
    const alreadyReviewed = await Rating.findOne({
      user: userId,
      course: courseId,
    });

    if (alreadyReviewed) {
      return res.status(403).json({
        success: false,
        message: 'Review by user already exists',
      });
    }

    //create new rating & review
    const newRating = await Rating.create({
      user: userId,
      rating,
      review,
      course: courseId,
    });

    if (!newRating) {
      return res.status(500).json({
        success: false,
        message: 'Something went wrong while pushing new rating',
      });
    }

    //update course with new rating
    const updateCourse = await Course.findByIdAndUpdate(courseId, {
      $push: {
        ratingAndReviews: newRating._id,
      },
    });

    if (!updateCourse) {
      return res.status(500).json({
        success: false,
        message: 'Something went wrong while pushing new rating to course',
      });
    }

    //response
    res.status(200).json({
      success: true,
      message: 'Rating published',
      newRating,
    });
  } catch (err) {
    console.log('Err in creating rating-> ', err);
    return res.status(500).json({
      success: false,
      message: 'Soemthing went wrong in creating the rating , Try again!',
    });
  }
};

const getAverageRating = async (req, res) => {
  try {
    const courseId = req.body.courseId;

    const averageRating = await Rating.aggregate([
      {
        $match: {
          // matches all objects with courseId
          course: new mongoose.Types.ObjectId(courseId),
        },
      },
      {
        $group: {
          //all docs from match -> calc avg rating and store in average
          _id: null,
          rating: { $avg: '$rating' },
        },
      },
    ]);

    //if rating exists
    if (averageRating.length > 0) {
      return res.status(200).json({
        success: true,
        data: averageRating[0].rating,
        message: 'average rating fetched',
      });
    }

    // no ratings found for course
    res.status(200).json({
      success: true,
      data: 0,
      message: 'No ratings exist for the course yet',
    });
  } catch (err) {
    console.log('Err in getAverageRating-> ', err);
    return res.status(500).json({
      success: false,
      message: 'Soemthing went wrong in getting Average Rating , Try again!',
    });
  }
};

const getAllRatings = async (req, res) => {
  try {
    //fetch all rating objects -> sort by highest ratings -> populate
    //user-> name email image & course -> courseName
    const allReviews = await Rating.find({})
      .sort({
        rating: 'desc',
      })
      .populate({
        path: 'user',
        select: 'firstName lastName email image',
      })
      .populate({
        path: 'course',
        select: 'courseName',
      })
      .exec();

    //response
    res.status(200).json({
      success: true,
      data: allReviews,
      message: 'All reviews fetched',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch all ratings.',
      err,
    });
  }
};

// const checkReviewExists = async (req, res) => {
//   try {
//     const { courseId } = req.body;
//     const { id } = req.user;

//     //add validation

//     const checkReviews = await Rating.findOne({
//       user: id,
//       course: courseId,
//     });

//     if (checkReviews) {
//       return res.status(400).json({
//         success: false,
//         message: 'Course is already reviewed by user!',
//       });
//     } else {
//       res.status(200).json({
//         success: true,
//         message: 'No exisitng review found!',
//       });
//     }
//   } catch (err) {
//     console.log('Err in getAllRatings-> ', err);
//     return res.status(500).json({
//       success: false,
//       message: 'Soemthing went wrong in checking for reviews, Try again!',
//     });
//   }
// };

module.exports = {
  getAllRatings,
  getAverageRating,
  createRating,
  //   checkReviewExists,
};
