const express = require('express');
const router = express.Router();
const Song = require('../models/Song');
const { protect } = require('../middleware/auth');

// @route   GET /api/songs
// @desc    Get all songs with optional filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { artist, album, genre, limit = 20, page = 1 } = req.query;
    
    const query = {};
    if (artist) query.artist = artist;
    if (album) query.album = album;
    if (genre) query.genre = genre;

    const songs = await Song.find(query)
      .populate('artist', 'name profileImage')
      .populate('album', 'title coverImage')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Song.countDocuments(query);

    res.json({
      songs,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/songs/:id
// @desc    Get song by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const song = await Song.findById(req.params.id)
      .populate('artist', 'name profileImage bio')
      .populate('album', 'title coverImage artist');

    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    // Increment play count
    song.playCount += 1;
    await song.save();

    res.json(song);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/songs
// @desc    Create a new song
// @access  Private (Admin only in production)
router.post('/', protect, async (req, res) => {
  try {
    const { title, artist, album, duration, audioUrl, coverImage, genre } = req.body;

    const song = new Song({
      title,
      artist,
      album,
      duration,
      audioUrl,
      coverImage,
      genre
    });

    await song.save();

    // Add song to artist's songs array
    await require('../models/Artist').findByIdAndUpdate(artist, {
      $push: { songs: song._id }
    });

    // Add song to album's songs array if album exists
    if (album) {
      await require('../models/Album').findByIdAndUpdate(album, {
        $push: { songs: song._id }
      });
    }

    const populatedSong = await Song.findById(song._id)
      .populate('artist', 'name profileImage')
      .populate('album', 'title coverImage');

    res.status(201).json(populatedSong);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/songs/:id
// @desc    Update a song
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let song = await Song.findById(req.params.id);

    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    const { title, duration, coverImage, genre } = req.body;

    song = await Song.findByIdAndUpdate(
      req.params.id,
      { title, duration, coverImage, genre },
      { new: true }
    )
      .populate('artist', 'name profileImage')
      .populate('album', 'title coverImage');

    res.json(song);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/songs/:id
// @desc    Delete a song
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);

    if (!song) {
      return res.status(404).json({ message: 'Song not found' });
    }

    await song.deleteOne();

    res.json({ message: 'Song removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
