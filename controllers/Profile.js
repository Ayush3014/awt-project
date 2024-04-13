const Profile = require('../models/Profile');
const User = require('../models/User');
const Course = require('../models/Course');

const updateProfile = async (req, res) => {
  try {
    // get data
    const { gender, dateOfBirth, about, contactNumber } = req.body;

    // get userId
    const id = req.user.id;

    const user = await User.findById(id);
    const profileId = user.additionalDetails;
    const profile = await Profile.findById(profileId);

    // validation
    if (gender !== undefined) {
      profile.gender = gender;
    }

    if (dateOfBirth !== undefined) {
      profile.dateOfBirth = dateOfBirth;
    }

    if (about !== undefined) {
      profile.about = about;
    }

    if (contactNumber !== undefined) {
      profile.contactNumber = contactNumber;
    }

    await profile.save();

    // update profile details in user
    const updatedUser = await User.findById(id)
      .populate('additionalDetails')
      .exec();

    // return response
    res.status(200).json({
      success: true,
      data: updatedUser,
      message: 'Profile Details updated successfully',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update the profile',
      err,
    });
  }
};

const deleteAccount = async (req, res) => {
  try {
    const id = req.user.id;
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'user not found',
      });
    }

    // delete profile
    await Profile.findByIdAndDelete({ _id: user.additionalDetails });

    // delete all courses associated with user
    const userCourses = user.courses;
    //go to each course and delete user from studentsEnrolled
    for (const singleCourseId of userCourses) {
      //fetch current iteration course
      const course = await Course.findById(singleCourseId);
      //if the course exists
      if (course) {
        await Course.findByIdAndUpdate(
          course._id,
          {
            $pull: {
              studentsEnrolled: id,
            },
          },
          { new: true }
        );
      }
    }

    // delete user
    await User.findByIdAndDelete({ _id: id });

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Something went wrong in deleting Account. Try again!',
      err,
    });
  }
};

const getAllUserDetails = async (req, res) => {
  try {
    const id = req.user.id;
    const user = await User.findById(id).populate('additionalDetails').exec();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
      message: 'User Details fetched',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Something went wrong in getAllUserDetails. Try again!',
      err,
    });
  }
};

module.exports = {
  updateProfile,
  deleteAccount,
  getAllUserDetails,
};
