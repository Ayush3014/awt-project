const Category = require('../models/Category');

const createCategory = async (req, res) => {
  try {
    // get the data
    const { name, description } = req.body;

    // validation
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // create Category in db
    const categoryDetails = await Category.create({
      name,
      description,
    });
    console.log(categoryDetails);

    return res.status(200).json({
      success: true,
      message: 'Category created successfully',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// get all categories
const showAllCategories = async (req, res) => {
  try {
    const allCategories = await Category.find(
      {},
      { name: true, description: true }
    );
    return res.status(200).json({
      success: true,
      message: 'All categories returned successfully',
      allCategories,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// category page details sorted
const categoryPageDetails = async (req, res) => {
  try {
    const categoryId = req.body.categoryId;

    if (!categoryId) {
      console.log(req.body);
      return res.status(400).json({
        success: false,
        message: 'Missing fields',
      });
    }

    // get courses for specified categoryid
    const categoryDetails = await Category.findById(categoryId)
      .populate({
        path: 'courses',
        match: { status: 'Published' },
        populate: 'ratingAndReviews',
        populate: 'instructor',
      })
      .exec();

    // validation
    if (!categoryDetails) {
      return res.status(404).json({
        success: false,
        message: 'Category details not found',
      });
    }

    // get courses for different categories
    const differentCategories = await Category.find({
      _id: { $ne: categoryId },
    });

    //top selling courses among all categories
    //to get a categorized list of courses we are flatting up the courses from all categories
    //else we could ve just called courses for all course objects
    //to get a list but in random course order

    const allCategories = await Category.find({}).populate({
      path: 'courses',
      match: { status: 'Published' },
      populate: {
        path: 'instructor',
      },
    }); //this returns array of all category objects with populated courses(+instructor)

    const allCourses = allCategories.flatMap((category) => category.courses); //this returns all courses

    //getting top 10 selling courses all categories
    const topSellingCourses = allCourses
      .sort((a, b) => b.studentsEnrolled.length - a.studentsEnrolled.length)
      .slice(0, 10);

    res.status(200).json({
      success: true,
      data: { categoryDetails, topSellingCourses, differentCategories },
      message: 'Category Details fetched',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to get category page details',
      err,
    });
  }
};

module.exports = {
  createCategory,
  showAllCategories,
  categoryPageDetails,
};
