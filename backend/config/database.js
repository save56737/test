const mongoose = require('mongoose');

module.exports = mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/spotify-clone', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});
