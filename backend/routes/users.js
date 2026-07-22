const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Song = require('../models/Song');
const { protect } = require('../middleware/auth');

// @route   POST /api/users/like-song/:songId
// @desc    Like a song
// @access  Private
router.post('/like-song/:songId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Check if already liked
    if (user.likedSongs.includes(req.params.songId)) {
      return res.status(400).json({ message: 'Song already liked' });
    }

    user.likedSongs.push(req.params.songId);
    await user.save();

    const updatedUser = await User.findById(user._id)
      .populate('likedSongs', 'title artist duration coverImage');

    res.json(updatedUser.likedSongs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/unlike-song/:songId
// @desc    Unlike a song
// @access  Private
router.delete('/unlike-song/:songId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    user.likedSongs = user.likedSongs.filter(
      song => song.toString() !== req.params.songId.toString()
    );
    await user.save();

    const updatedUser = await User.findById(user._id)
      .populate('likedSongs', 'title artist duration coverImage');

    res.json(updatedUser.likedSongs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/liked-songs
// @desc    Get user's liked songs
// @access  Private
router.get('/liked-songs', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('likedSongs', 'title artist duration coverImage album');

    res.json(user.likedSongs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { username, profileImage } = req.body;
    
    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields
    if (username) user.username = username;
    if (profileImage) user.profileImage = profileImage;

    await user.save();

    user = await User.findById(user._id).select('-password');

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
