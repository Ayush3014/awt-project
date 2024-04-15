const express = require('express');
const router = express.Router();

// middlewares
const { auth } = require('../middlewares/auth');

// controllers
const {
  updateProfile,
  deleteAccount,
  getAllUserDetails,
} = require('../controllers/profile');

//routes
router.put('/updateProfile', auth, updateProfile);
router.delete('/deleteProfile', auth, deleteAccount);
router.get('/getUserDetails', auth, getAllUserDetails);

module.exports = router;
