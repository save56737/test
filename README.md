# Spotify Clone - Full Stack Web Application

A full-stack Spotify clone with a modern web interface and RESTful API backend.

## 🎵 Features

### Frontend
- **Music Player**: Play, pause, skip tracks with progress bar
- **Authentication**: Login/Register with JWT tokens
- **Library Management**: Create and manage playlists
- **Search**: Search for songs and artists
- **Like Songs**: Save your favorite tracks
- **Responsive Design**: Works on desktop and mobile
- **Dark Theme**: Spotify-inspired UI

### Backend API
- **User Authentication**: Register, login, JWT-based auth
- **Songs**: CRUD operations for music tracks
- **Artists**: Manage artists with follow/unfollow functionality
- **Albums**: Album management
- **Playlists**: Create, update, delete playlists, add/remove songs
- **User Profiles**: Update profile, manage liked songs

## 📁 Project Structure

```
/workspace
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── middleware/
│   │   └── auth.js              # JWT authentication middleware
│   ├── models/
│   │   ├── User.js              # User schema
│   │   ├── Song.js              # Song schema
│   │   ├── Artist.js            # Artist schema
│   │   ├── Album.js             # Album schema
│   │   └── Playlist.js          # Playlist schema
│   ├── routes/
│   │   ├── auth.js              # Auth routes
│   │   ├── songs.js             # Song routes
│   │   ├── artists.js           # Artist routes
│   │   ├── playlists.js         # Playlist routes
│   │   └── users.js             # User routes
│   ├── .env.example             # Environment variables template
│   ├── package.json
│   └── server.js                # Express server entry point
│
└── frontend/
    ├── css/
    │   └── style.css            # Application styles
    ├── js/
    │   └── app.js               # Frontend JavaScript
    └── index.html               # Main HTML file
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd /workspace/backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Update the `.env` file with your MongoDB connection string:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/spotify-clone
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

5. Start the server:
```bash
npm start
```

The API will be available at `http://localhost:5000`

### Frontend Setup

1. Open `frontend/index.html` in your browser, or serve it with a local server:

Using Python:
```bash
cd /workspace/frontend
python3 -m http.server 3000
```

Using Node.js (http-server):
```bash
npx http-server frontend -p 3000
```

2. Open `http://localhost:3000` in your browser

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Songs
- `GET /api/songs` - Get all songs
- `GET /api/songs/:id` - Get song by ID
- `POST /api/songs` - Create song (protected)
- `PUT /api/songs/:id` - Update song (protected)
- `DELETE /api/songs/:id` - Delete song (protected)

### Artists
- `GET /api/artists` - Get all artists
- `GET /api/artists/:id` - Get artist by ID
- `POST /api/artists` - Create artist (protected)
- `PUT /api/artists/:id` - Update artist (protected)
- `DELETE /api/artists/:id` - Delete artist (protected)
- `POST /api/artists/:id/follow` - Follow artist (protected)
- `DELETE /api/artists/:id/unfollow` - Unfollow artist (protected)

### Playlists
- `GET /api/playlists` - Get playlists
- `GET /api/playlists/:id` - Get playlist by ID
- `POST /api/playlists` - Create playlist (protected)
- `PUT /api/playlists/:id` - Update playlist (protected)
- `DELETE /api/playlists/:id` - Delete playlist (protected)
- `POST /api/playlists/:id/songs` - Add song to playlist (protected)
- `DELETE /api/playlists/:id/songs/:songId` - Remove song from playlist (protected)

### Users
- `POST /api/users/like-song/:songId` - Like a song (protected)
- `DELETE /api/users/unlike-song/:songId` - Unlike a song (protected)
- `GET /api/users/liked-songs` - Get liked songs (protected)
- `PUT /api/users/profile` - Update profile (protected)

## 🎨 Technologies Used

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **HTML5** - Markup
- **CSS3** - Styling with CSS Grid and Flexbox
- **Vanilla JavaScript** - Interactivity
- **Web Audio API** - Audio playback

## 🔒 Security Features

- Password hashing with bcrypt
- JWT-based authentication
- Protected routes with middleware
- Input validation
- CORS enabled

## 📝 Notes

- The frontend includes demo data that works without the backend
- For full functionality, run both backend and frontend
- Update the `API_URL` in `frontend/js/app.js` if your backend runs on a different port
- Sample audio tracks are provided by SoundHelix for testing

## 🤝 Contributing

Feel free to fork this project and submit pull requests!

## 📄 License

This project is for educational purposes.

---

**Enjoy your Spotify Clone! 🎵**
