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

// category page details
// category page details sorted

module.exports = {
  createCategory,
  showAllCategories,
};
