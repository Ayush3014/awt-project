const Section = require('../models/Section');
const Course = require('../models/Course');

exports.createSection = async (req, res) => {
  try {
    // data fetch
    const { sectionName, courseId } = req.body;

    // validation
    if (!sectionName || !courseId) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // create a section
    const newSection = await Section.create({ sectionName });

    // update course with section objectid
    const updatedCourseDetails = await Course.findByIdAndUpdate(
      { courseId },
      {
        $push: {
          courseContent: newSection._id,
        },
      },
      { new: true }
    )
      .populate({
        path: 'courseContent',
        populate: {
          path: 'subSection', // send sections with populated sub sections
        },
      })
      .exec();

    // return a response
    return res.status(200).json({
      success: true,
      message: 'Section created successfully',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create a section',
      err,
    });
  }
};

exports.updateSection = async (req, res) => {
  try {
    // data input
    const { sectionName, sectionId } = req.body;

    // validation
    if ((!sectionName, !sectionId)) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // update in db
    const section = await Section.findByIdAndUpdate(
      sectionId,
      { sectionName },
      { new: true }
    );

    // return response
    return res.status(200).json({
      success: true,
      message: 'Updated the section successfully',
      section,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update the section',
      err,
    });
  }
};

exports.deleteSection = async (req, res) => {
  try {
    const { sectionId, courseId } = req.body;

    if (!sectionId) {
      return res.status(400).json({
        success: false,
        message: 'Missing field',
      });
    }

    const deleteSection = await Section.findByIdAndDelete(sectionId);

    // deleting the section from course as well
    if (courseId) {
      const updatedCourseDetails = await Course.findByIdAndUpdate(
        { courseId },
        {
          $pull: {
            courseContent: sectionId,
          },
        },
        { new: true }
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Section deleted successfully',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete the section',
      err,
    });
  }
};
