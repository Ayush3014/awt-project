const Section = require('../models/Section');
const SubSection = require('../models/SubSection');
const { uploadImageToCloudinary } = require('../utils/imageUploader');
require('dotenv').config();

const createSection = async (req, res) => {
  try {
    // get data
    const { sectionId, title, timeDuration, description } = req.body;

    // extract video
    const video = req.files.videoFile;

    // validation
    if (!sectionId || !title || !timeDuration || !description || !video) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // upload video to cloudinary
    const uploadDetails = await uploadImageToCloudinary(
      video,
      process.env.FOLDER_NAME
    );

    // create a subsection
    const newSubSection = await SubSection.create({
      title,
      timeDuration,
      description,
      videoUrl: uploadDetails.secure_url,
    });

    //  update section with sub section object id
    const updatedSection = await Section.findByIdAndUpdate(
      { _id: sectionId },
      {
        $push: {
          subSection: newSubSection._id,
        },
      },
      { new: true }
    )
      .populate('subSection')
      .exec();

    // return response
    return res.status(200).json({
      success: true,
      message: 'Created a SubSection successfully',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create a SubSection',
      err,
    });
  }
};

const updateSubSection = async (req, res) => {
  try {
    const { title, description, subSectionId } = req.body;

    const subSection = await SubSection.findById(subSectionId);
    if (!subSection) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parameter',
      });
    }

    //if any field is present in body update it
    if (title !== undefined) {
      subSection.title = title;
    }

    if (description !== undefined) {
      subSection.description = description;
    }

    if (req.files && req.files.videoFile !== undefined) {
      const videoUpdate = await uploadImageToCloudinary(
        req.files.videoFile,
        process.env.FOLDER_NAME
      );

      subSection.timeDuration = videoUpdate.duration;
      subSection.videoUrl = videoUpdate.secure_url;
    }

    //save updates
    await subSection.save();

    res.status(200).json({
      success: true,
      message: 'SubSection updated successfully',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update the SubSection',
      err,
    });
  }
};

const deleteSubSection = async (req, res) => {
  try {
    const { subSectionId, sectionId } = req.body;

    const deleteSubSection = await SubSection.findByIdAndDelete(subSectionId);

    //validation
    if (!deleteSubSection) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parameter',
      });
    }

    const updatedSection = await Section.findByIdAndUpdate(
      sectionId,
      {
        $pull: {
          subSection: subSectionId,
        },
      },
      { new: true }
    );

    //response
    res.status(200).json({
      success: true,
      message: 'SubSection deleted successfully',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update the SubSection',
      err,
    });
  }
};

module.exports = {
  createSection,
  updateSubSection,
  deleteSubSection,
};
