const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Song title is required'],
    trim: true
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
    required: [true, 'Artist is required']
  },
  album: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Album',
    default: null
  },
  duration: {
    type: Number, // in seconds
    required: [true, 'Duration is required']
  },
  audioUrl: {
    type: String,
    required: [true, 'Audio URL is required']
  },
  coverImage: {
    type: String,
    default: ''
  },
  genre: {
    type: String,
    default: 'Other'
  },
  playCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Song', songSchema);
