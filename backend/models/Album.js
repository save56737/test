const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Album title is required'],
    trim: true
  },
  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Artist',
    required: [true, 'Artist is required']
  },
  coverImage: {
    type: String,
    default: ''
  },
  releaseDate: {
    type: Date,
    default: Date.now
  },
  description: {
    type: String,
    default: ''
  },
  songs: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Song'
  }],
  genre: {
    type: String,
    default: 'Other'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Album', albumSchema);
