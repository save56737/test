const express = require('express');
const router = express.Router();
const Artist = require('../models/Artist');
const { protect } = require('../middleware/auth');

// @route   GET /api/artists
// @desc    Get all artists
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    
    const artists = await Artist.find()
      .sort({ followers: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Artist.countDocuments();

    res.json({
      artists,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/artists/:id
// @desc    Get artist by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id)
      .populate('songs', 'title duration coverImage')
      .populate('albums', 'title coverImage releaseDate');

    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }

    res.json(artist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/artists
// @desc    Create a new artist
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, bio, profileImage, coverImage, verified } = req.body;

    const artist = new Artist({
      name,
      bio,
      profileImage,
      coverImage,
      verified
    });

    await artist.save();

    const populatedArtist = await Artist.findById(artist._id)
      .populate('songs', 'title duration coverImage')
      .populate('albums', 'title coverImage');

    res.status(201).json(populatedArtist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/artists/:id
// @desc    Update an artist
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let artist = await Artist.findById(req.params.id);

    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }

    const { name, bio, profileImage, coverImage, verified } = req.body;

    artist = await Artist.findByIdAndUpdate(
      req.params.id,
      { name, bio, profileImage, coverImage, verified },
      { new: true }
    )
      .populate('songs', 'title duration coverImage')
      .populate('albums', 'title coverImage');

    res.json(artist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/artists/:id
// @desc    Delete an artist
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);

    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }

    await artist.deleteOne();

    res.json({ message: 'Artist removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/artists/:id/follow
// @desc    Follow an artist
// @access  Private
router.post('/:id/follow', protect, async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }

    // Check if already following
    if (artist.followers.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already following this artist' });
    }

    artist.followers.push(req.user.id);
    await artist.save();

    // Add artist to user's followed artists
    await require('../models/User').findByIdAndUpdate(req.user.id, {
      $push: { followedArtists: artist._id }
    });

    res.json({ message: 'Artist followed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/artists/:id/unfollow
// @desc    Unfollow an artist
// @access  Private
router.delete('/:id/unfollow', protect, async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id);
    
    if (!artist) {
      return res.status(404).json({ message: 'Artist not found' });
    }

    artist.followers = artist.followers.filter(
      follower => follower.toString() !== req.user.id.toString()
    );
    await artist.save();

    // Remove artist from user's followed artists
    await require('../models/User').findByIdAndUpdate(req.user.id, {
      $pull: { followedArtists: artist._id }
    });

    res.json({ message: 'Artist unfollowed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
