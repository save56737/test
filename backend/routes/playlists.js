const express = require('express');
const router = express.Router();
const Playlist = require('../models/Playlist');
const { protect } = require('../middleware/auth');

// @route   GET /api/playlists
// @desc    Get user's playlists or all public playlists
// @access  Private/Public
router.get('/', async (req, res) => {
  try {
    const { userId, limit = 20, page = 1 } = req.query;
    
    const query = { isPublic: true };
    if (userId) {
      query.owner = userId;
    }

    const playlists = await Playlist.find(query)
      .populate('owner', 'username profileImage')
      .populate('songs', 'title artist duration coverImage')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Playlist.countDocuments(query);

    res.json({
      playlists,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/playlists/:id
// @desc    Get playlist by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate('owner', 'username profileImage email')
      .populate('songs', 'title artist duration coverImage album')
      .populate('followers', 'username profileImage');

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    res.json(playlist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/playlists
// @desc    Create a new playlist
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, coverImage, isPublic } = req.body;

    const playlist = new Playlist({
      name,
      description,
      coverImage,
      isPublic,
      owner: req.user.id
    });

    await playlist.save();

    // Add playlist to user's playlists
    await require('../models/User').findByIdAndUpdate(req.user.id, {
      $push: { playlists: playlist._id }
    });

    const populatedPlaylist = await Playlist.findById(playlist._id)
      .populate('owner', 'username profileImage')
      .populate('songs', 'title artist duration coverImage');

    res.status(201).json(populatedPlaylist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/playlists/:id
// @desc    Update a playlist
// @access  Private (Owner only)
router.put('/:id', protect, async (req, res) => {
  try {
    let playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Check if user is the owner
    if (playlist.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this playlist' });
    }

    const { name, description, coverImage, isPublic } = req.body;

    playlist = await Playlist.findByIdAndUpdate(
      req.params.id,
      { name, description, coverImage, isPublic },
      { new: true }
    )
      .populate('owner', 'username profileImage')
      .populate('songs', 'title artist duration coverImage');

    res.json(playlist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/playlists/:id
// @desc    Delete a playlist
// @access  Private (Owner only)
router.delete('/:id', protect, async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Check if user is the owner
    if (playlist.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this playlist' });
    }

    await playlist.deleteOne();

    // Remove playlist from owner's playlists
    await require('../models/User').findByIdAndUpdate(playlist.owner, {
      $pull: { playlists: playlist._id }
    });

    res.json({ message: 'Playlist removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/playlists/:id/songs
// @desc    Add song to playlist
// @access  Private (Owner only)
router.post('/:id/songs', protect, async (req, res) => {
  try {
    const { songId } = req.body;
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Check if user is the owner
    if (playlist.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this playlist' });
    }

    // Check if song already in playlist
    if (playlist.songs.includes(songId)) {
      return res.status(400).json({ message: 'Song already in playlist' });
    }

    playlist.songs.push(songId);
    await playlist.save();

    const updatedPlaylist = await Playlist.findById(playlist._id)
      .populate('songs', 'title artist duration coverImage');

    res.json(updatedPlaylist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/playlists/:id/songs/:songId
// @desc    Remove song from playlist
// @access  Private (Owner only)
router.delete('/:id/songs/:songId', protect, async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Check if user is the owner
    if (playlist.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this playlist' });
    }

    playlist.songs = playlist.songs.filter(
      song => song.toString() !== req.params.songId.toString()
    );
    await playlist.save();

    const updatedPlaylist = await Playlist.findById(playlist._id)
      .populate('songs', 'title artist duration coverImage');

    res.json(updatedPlaylist);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/playlists/:id/follow
// @desc    Follow a playlist
// @access  Private
router.post('/:id/follow', protect, async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    // Check if already following
    if (playlist.followers.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already following this playlist' });
    }

    playlist.followers.push(req.user.id);
    await playlist.save();

    res.json({ message: 'Playlist followed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/playlists/:id/unfollow
// @desc    Unfollow a playlist
// @access  Private
router.delete('/:id/unfollow', protect, async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id);
    
    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' });
    }

    playlist.followers = playlist.followers.filter(
      follower => follower.toString() !== req.user.id.toString()
    );
    await playlist.save();

    res.json({ message: 'Playlist unfollowed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
