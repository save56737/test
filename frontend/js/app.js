// API Configuration
const API_URL = 'http://localhost:5000/api';

// State
let currentUser = null;
let token = localStorage.getItem('token');
let currentTrack = null;
let isPlaying = false;
let queue = [];
let currentIndex = 0;
let likedSongs = [];

// DOM Elements
const authModal = document.getElementById('authModal');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const authBtn = document.getElementById('authBtn');
const userProfile = document.getElementById('userProfile');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const logoutBtn = document.getElementById('logoutBtn');
const audioPlayer = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const progressBar = document.getElementById('progressBar');
const volumeBar = document.getElementById('volumeBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const currentTrackTitle = document.getElementById('currentTrackTitle');
const currentTrackArtist = document.getElementById('currentTrackArtist');
const currentTrackImage = document.getElementById('currentTrackImage');
const likeBtn = document.getElementById('likeBtn');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
  setupEventListeners();
  updateGreeting();
});

// Initialize App
async function initializeApp() {
  if (token) {
    try {
      await fetchCurrentUser();
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    }
  }
  
  loadDemoData();
}

// Fetch Current User
async function fetchCurrentUser() {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  
  currentUser = await response.json();
  updateUserUI();
  loadLikedSongs();
}

// Update User UI
function updateUserUI() {
  if (currentUser) {
    authBtn.style.display = 'none';
    userProfile.style.display = 'flex';
    userAvatar.src = currentUser.profileImage || 'https://via.placeholder.com/30';
    userName.textContent = currentUser.username;
    loadUserPlaylists();
  } else {
    authBtn.style.display = 'block';
    userProfile.style.display = 'none';
  }
}

// Update Greeting
function updateGreeting() {
  const hour = new Date().getHours();
  const greetingEl = document.getElementById('greeting');
  
  if (hour < 12) {
    greetingEl.textContent = 'Good morning';
  } else if (hour < 18) {
    greetingEl.textContent = 'Good afternoon';
  } else {
    greetingEl.textContent = 'Good evening';
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Auth Modal
  authBtn.addEventListener('click', () => {
    authModal.classList.add('active');
  });
  
  document.querySelector('.close-modal').addEventListener('click', () => {
    authModal.classList.remove('active');
  });
  
  window.addEventListener('click', (e) => {
    if (e.target === authModal) {
      authModal.classList.remove('active');
    }
  });
  
  // Auth Tabs
  document.querySelectorAll('.auth-tabs .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.auth-tabs .tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
      
      btn.classList.add('active');
      const tab = btn.dataset.tab;
      document.getElementById(`${tab}Form`).classList.add('active');
    });
  });
  
  // Login Form
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      token = data.token;
      localStorage.setItem('token', token);
      currentUser = data.user;
      updateUserUI();
      authModal.classList.remove('active');
      loginForm.reset();
    } catch (error) {
      loginForm.querySelector('.auth-error').textContent = error.message;
    }
  });
  
  // Register Form
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      token = data.token;
      localStorage.setItem('token', token);
      currentUser = data.user;
      updateUserUI();
      authModal.classList.remove('active');
      registerForm.reset();
    } catch (error) {
      registerForm.querySelector('.auth-error').textContent = error.message;
    }
  });
  
  // Logout
  logoutBtn.addEventListener('click', logout);
  
  // Navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = link.dataset.page;
      navigateTo(page);
    });
  });
  
  // Player Controls
  playPauseBtn.addEventListener('click', togglePlayPause);
  prevBtn.addEventListener('click', playPrevious);
  nextBtn.addEventListener('click', playNext);
  
  progressBar.addEventListener('input', (e) => {
    const time = (e.target.value / 100) * audioPlayer.duration;
    audioPlayer.currentTime = time;
  });
  
  volumeBar.addEventListener('input', (e) => {
    audioPlayer.volume = e.target.value / 100;
  });
  
  audioPlayer.addEventListener('timeupdate', updateProgress);
  audioPlayer.addEventListener('ended', playNext);
  audioPlayer.addEventListener('loadedmetadata', () => {
    durationEl.textContent = formatTime(audioPlayer.duration);
  });
  
  // Like Button
  likeBtn.addEventListener('click', toggleLike);
  
  // Search
  const searchInput = document.getElementById('searchInput');
  searchInput.addEventListener('input', debounce(handleSearch, 300));
}

// Navigate to Page
function navigateTo(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  
  document.getElementById(`${page}Page`).classList.add('active');
  document.querySelector(`[data-page="${page}"]`).classList.add('active');
}

// Toggle Play/Pause
function togglePlayPause() {
  if (!currentTrack) return;
  
  if (isPlaying) {
    audioPlayer.pause();
    playPauseBtn.textContent = '▶';
  } else {
    audioPlayer.play();
    playPauseBtn.textContent = '⏸';
  }
  
  isPlaying = !isPlaying;
}

// Play Track
function playTrack(track) {
  currentTrack = track;
  currentTrackTitle.textContent = track.title;
  currentTrackArtist.textContent = track.artist?.name || 'Unknown Artist';
  currentTrackImage.src = track.coverImage || 'https://via.placeholder.com/56';
  
  audioPlayer.src = track.audioUrl;
  audioPlayer.play();
  isPlaying = true;
  playPauseBtn.textContent = '⏸';
  
  updateLikeButton();
}

// Play Previous
function playPrevious() {
  if (currentIndex > 0) {
    currentIndex--;
    playTrack(queue[currentIndex]);
  }
}

// Play Next
function playNext() {
  if (currentIndex < queue.length - 1) {
    currentIndex++;
    playTrack(queue[currentIndex]);
  }
}

// Update Progress
function updateProgress() {
  const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
  progressBar.value = progress || 0;
  currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
}

// Format Time
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Toggle Like
async function toggleLike() {
  if (!currentUser || !currentTrack) return;
  
  try {
    const isLiked = likedSongs.some(s => s._id === currentTrack._id);
    
    if (isLiked) {
      await fetch(`${API_URL}/users/unlike-song/${currentTrack._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      likedSongs = likedSongs.filter(s => s._id !== currentTrack._id);
    } else {
      await fetch(`${API_URL}/users/like-song/${currentTrack._id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      likedSongs.push(currentTrack);
    }
    
    updateLikeButton();
  } catch (error) {
    console.error('Failed to toggle like:', error);
  }
}

// Update Like Button
function updateLikeButton() {
  if (!currentTrack) return;
  
  const isLiked = likedSongs.some(s => s._id === currentTrack._id);
  likeBtn.textContent = isLiked ? '♥' : '♡';
  likeBtn.style.color = isLiked ? '#1db954' : '';
}

// Load Liked Songs
async function loadLikedSongs() {
  try {
    const response = await fetch(`${API_URL}/users/liked-songs`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      likedSongs = await response.json();
    }
  } catch (error) {
    console.error('Failed to load liked songs:', error);
  }
}

// Load User Playlists
async function loadUserPlaylists() {
  if (!currentUser) return;
  
  try {
    const response = await fetch(`${API_URL}/playlists?userId=${currentUser.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const playlistList = document.getElementById('userPlaylists');
      playlistList.innerHTML = '';
      
      data.playlists.forEach(playlist => {
        const li = document.createElement('li');
        li.textContent = playlist.name;
        li.addEventListener('click', () => loadPlaylist(playlist._id));
        playlistList.appendChild(li);
      });
    }
  } catch (error) {
    console.error('Failed to load playlists:', error);
  }
}

// Load Playlist
async function loadPlaylist(playlistId) {
  try {
    const response = await fetch(`${API_URL}/playlists/${playlistId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const playlist = await response.json();
      queue = playlist.songs;
      currentIndex = 0;
      if (queue.length > 0) {
        playTrack(queue[0]);
      }
    }
  } catch (error) {
    console.error('Failed to load playlist:', error);
  }
}

// Handle Search
async function handleSearch(e) {
  const query = e.target.value.trim();
  if (!query) return;
  
  try {
    const response = await fetch(`${API_URL}/songs`);
    if (response.ok) {
      const data = await response.json();
      const filtered = data.songs.filter(s => 
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.artist?.name.toLowerCase().includes(query.toLowerCase())
      );
      
      displaySearchResults(filtered);
    }
  } catch (error) {
    console.error('Search failed:', error);
  }
}

// Display Search Results
function displaySearchResults(results) {
  const resultsContainer = document.getElementById('searchResults');
  resultsContainer.innerHTML = '';
  
  results.forEach(track => {
    const card = createTrackCard(track);
    resultsContainer.appendChild(card);
  });
}

// Create Track Card
function createTrackCard(track) {
  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <img src="${track.coverImage || 'https://via.placeholder.com/180'}" alt="${track.title}" class="card-image">
    <div class="play-overlay">▶</div>
    <div class="card-title">${track.title}</div>
    <div class="card-subtitle">${track.artist?.name || 'Unknown Artist'}</div>
  `;
  
  card.addEventListener('click', () => {
    queue = [track];
    currentIndex = 0;
    playTrack(track);
  });
  
  return card;
}

// Logout
function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('token');
  updateUserUI();
}

// Debounce Function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Load Demo Data
function loadDemoData() {
  // Demo tracks for testing without backend
  const demoTracks = [
    {
      _id: '1',
      title: 'Demo Track 1',
      artist: { name: 'Demo Artist' },
      coverImage: 'https://via.placeholder.com/180/1db954/ffffff?text=Track+1',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      duration: 372
    },
    {
      _id: '2',
      title: 'Demo Track 2',
      artist: { name: 'Demo Artist' },
      coverImage: 'https://via.placeholder.com/180/1ed760/ffffff?text=Track+2',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      duration: 425
    },
    {
      _id: '3',
      title: 'Demo Track 3',
      artist: { name: 'Demo Artist' },
      coverImage: 'https://via.placeholder.com/180/ff6b6b/ffffff?text=Track+3',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      duration: 358
    }
  ];
  
  // Load recently played
  const recentlyPlayed = document.getElementById('recentlyPlayed');
  demoTracks.forEach(track => {
    const card = createTrackCard(track);
    recentlyPlayed.appendChild(card);
  });
  
  // Load made for you
  const madeForYou = document.getElementById('madeForYou');
  demoTracks.slice(0, 2).forEach(track => {
    const card = createTrackCard(track);
    madeForYou.appendChild(card);
  });
  
  // Load popular artists
  const popularArtists = document.getElementById('popularArtists');
  const demoArtists = [
    { name: 'Artist 1', image: 'https://via.placeholder.com/180/404040/ffffff?text=Artist+1' },
    { name: 'Artist 2', image: 'https://via.placeholder.com/180/404040/ffffff?text=Artist+2' }
  ];
  
  demoArtists.forEach(artist => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <img src="${artist.image}" alt="${artist.name}" class="card-image" style="border-radius: 50%;">
      <div class="card-title">${artist.name}</div>
      <div class="card-subtitle">Artist</div>
    `;
    popularArtists.appendChild(card);
  });
}

console.log('🎵 Spotify Clone initialized!');
