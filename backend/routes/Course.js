const express = require('express');
const router = express.Router();

// route middlewares
const {
  auth,
  isStudent,
  isInstructor,
  isAdmin,
} = require('../middlewares/auth');

// fetching controllers
const {
  createCourse,
  getAllCourses,
  getCourseDetails,
} = require('../controllers/Course');

const {
  createCategory,
  showAllCategories,
  categoryPageDetails,
} = require('../controllers/Category');

const {
  getAllRatings,
  getAverageRating,
  createRating,
} = require('../controllers/RatingAndReview');

const {
  createSection,
  updateSection,
  deleteSection,
} = require('../controllers/Section');

const {
  createSubSection,
  updateSubSection,
  deleteSubSection,
} = require('../controllers/SubSection');

// routes for course
router.post('/getCourseDetails', getCourseDetails);
router.post('/createCourse', auth, isInstructor, createCourse);
router.get('/getAllCourses', getAllCourses);

// routes for category
router.post('/createCategory', auth, isAdmin, createCategory);
router.post('/categoryPageDetails', categoryPageDetails);
router.get('/showAllCategories', showAllCategories);

// routes for RatingAndReview
router.get('/getAllRatings', getAllRatings);
router.get('/getAverageRating', getAverageRating);
router.post('/createRating', auth, isStudent, createRating);

// routes for section
router.post('/createSection', auth, isInstructor, createSection);
router.post('/updateSection', auth, isInstructor, updateSection);
router.post('/deleteSection', auth, isInstructor, deleteSection);

// routes for subsection
router.post('/createSubSection', auth, isInstructor, createSubSection);
router.post('/updateSubSection', auth, isInstructor, updateSubSection);
router.post('/deleteSubSection', auth, isInstructor, deleteSubSection);

module.exports = router;
