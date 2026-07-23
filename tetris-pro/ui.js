// UI Manager for Tetris Pro

class UIManager {
    constructor() {
        this.currentScreen = 'main-menu';
        this.isPaused = false;
        this.gameMode = 'classic';
        this.settings = {
            das: 170,
            arr: 30,
            softDropSpeed: 1,
            lockDelay: 500,
            rotation: 'srs',
            colorBlind: false,
            highContrast: false,
            screenShake: true,
            particles: true,
            musicVolume: 70
        };
        
        this.playerProfile = {
            name: 'Player 1',
            rank: 'Unranked',
            gamesPlayed: 0,
            bestScore: 0,
            totalLines: 0,
            bestGrade: '-'
        };
        
        this.recentGames = [];
        
        this.init();
    }
    
    init() {
        this.setupNavigation();
        this.setupSettings();
        this.setupGameEvents();
        this.loadSettings();
        this.updateProfileUI();
    }
    
    setupNavigation() {
        // Main menu buttons
        document.querySelectorAll('[data-screen]').forEach(btn => {
            btn.addEventListener('click', () => {
                const screen = btn.getAttribute('data-screen');
                this.showScreen(screen);
            });
        });
        
        // Game mode buttons
        document.querySelectorAll('[data-mode]').forEach(btn => {
            btn.addEventListener('click', () => {
                const mode = btn.getAttribute('data-mode');
                this.startGame(mode);
            });
        });
        
        // Practice mode buttons
        document.querySelectorAll('[data-practice]').forEach(btn => {
            btn.addEventListener('click', () => {
                const practice = btn.getAttribute('data-practice');
                this.startPractice(practice);
            });
        });
        
        // Game over buttons
        document.getElementById('retry-btn')?.addEventListener('click', () => {
            this.startGame(this.gameMode);
        });
        
        // Pause overlay buttons
        document.getElementById('resume-btn')?.addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('quit-btn')?.addEventListener('click', () => {
            this.quitGame();
        });
        
        // Leaderboard tabs
        document.querySelectorAll('[data-tab]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-tab]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // In a real app, load different leaderboard data
            });
        });
        
        // Customization tabs
        document.querySelectorAll('[data-custom]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('[data-custom]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // In a real app, show different customization options
            });
        });
        
        // Theme selection
        document.querySelectorAll('[data-type="theme"]').forEach(option => {
            option.addEventListener('click', () => {
                const theme = option.getAttribute('data-value');
                this.applyTheme(theme);
            });
        });
    }
    
    setupSettings() {
        // DAS setting
        const dasSlider = document.getElementById('das-setting');
        const dasValue = document.getElementById('das-value');
        if (dasSlider) {
            dasSlider.addEventListener('input', () => {
                this.settings.das = parseInt(dasSlider.value);
                dasValue.textContent = `${this.settings.das}ms`;
                this.saveSettings();
                if (window.game) window.game.updateSettings(this.settings);
            });
        }
        
        // ARR setting
        const arrSlider = document.getElementById('arr-setting');
        const arrValue = document.getElementById('arr-value');
        if (arrSlider) {
            arrSlider.addEventListener('input', () => {
                this.settings.arr = parseInt(arrSlider.value);
                arrValue.textContent = `${this.settings.arr}ms`;
                this.saveSettings();
                if (window.game) window.game.updateSettings(this.settings);
            });
        }
        
        // Soft Drop Speed
        const softDropSlider = document.getElementById('softdrop-setting');
        const softDropValue = document.getElementById('softdrop-value');
        if (softDropSlider) {
            softDropSlider.addEventListener('input', () => {
                this.settings.softDropSpeed = parseInt(softDropSlider.value);
                softDropValue.textContent = `${this.settings.softDropSpeed}x`;
                this.saveSettings();
                if (window.game) window.game.updateSettings(this.settings);
            });
        }
        
        // Lock Delay
        const lockDelaySlider = document.getElementById('lockdelay-setting');
        const lockDelayValue = document.getElementById('lockdelay-value');
        if (lockDelaySlider) {
            lockDelaySlider.addEventListener('input', () => {
                this.settings.lockDelay = parseInt(lockDelaySlider.value);
                lockDelayValue.textContent = `${this.settings.lockDelay}ms`;
                this.saveSettings();
                if (window.game) window.game.updateSettings(this.settings);
            });
        }
        
        // Rotation system
        const rotationSelect = document.getElementById('rotation-setting');
        if (rotationSelect) {
            rotationSelect.addEventListener('change', () => {
                this.settings.rotation = rotationSelect.value;
                this.saveSettings();
            });
        }
        
        // Color Blind Mode
        const colorBlindCheckbox = document.getElementById('colorblind-setting');
        if (colorBlindCheckbox) {
            colorBlindCheckbox.addEventListener('change', () => {
                this.settings.colorBlind = colorBlindCheckbox.checked;
                document.body.classList.toggle('colorblind-mode', this.settings.colorBlind);
                this.saveSettings();
            });
        }
        
        // High Contrast
        const highContrastCheckbox = document.getElementById('highcontrast-setting');
        if (highContrastCheckbox) {
            highContrastCheckbox.addEventListener('change', () => {
                this.settings.highContrast = highContrastCheckbox.checked;
                document.body.classList.toggle('high-contrast', this.settings.highContrast);
                this.saveSettings();
            });
        }
        
        // Screen Shake
        const screenShakeCheckbox = document.getElementById('screenshake-setting');
        if (screenShakeCheckbox) {
            screenShakeCheckbox.addEventListener('change', () => {
                this.settings.screenShake = screenShakeCheckbox.checked;
                this.saveSettings();
            });
        }
        
        // Particles
        const particlesCheckbox = document.getElementById('particles-setting');
        if (particlesCheckbox) {
            particlesCheckbox.addEventListener('change', () => {
                this.settings.particles = particlesCheckbox.checked;
                this.saveSettings();
            });
        }
        
        // Music Volume
        const musicVolumeSlider = document.getElementById('music-volume');
        const musicVolumeValue = document.getElementById('music-volume-value');
        if (musicVolumeSlider) {
            musicVolumeSlider.addEventListener('input', () => {
                this.settings.musicVolume = parseInt(musicVolumeSlider.value);
                musicVolumeValue.textContent = `${this.settings.musicVolume}%`;
                this.saveSettings();
            });
        }
    }
    
    setupGameEvents() {
        // Update UI event
        window.addEventListener('updateUI', (e) => {
            const {score, lines, level, combo, grade, holdPiece, nextPieces} = e.detail;
            
            document.getElementById('score').textContent = score.toLocaleString();
            document.getElementById('lines').textContent = lines;
            document.getElementById('level').textContent = level;
            document.getElementById('combo').textContent = combo >= 0 ? `${combo}x` : '-';
            document.getElementById('grade').textContent = grade;
        });
        
        // Game Over event
        window.addEventListener('gameOver', (e) => {
            const {score, lines, level, grade, moveHistory, placementHeatmap} = e.detail;
            this.handleGameOver(score, lines, level, grade, moveHistory, placementHeatmap);
        });
        
        // Toggle Pause event
        window.addEventListener('togglePause', () => {
            this.togglePause();
        });
    }
    
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
        }
        
        // Hide game screen when not playing
        if (screenId !== 'game-screen') {
            this.isPaused = false;
        }
    }
    
    startGame(mode) {
        this.gameMode = mode;
        this.showScreen('game-screen');
        
        if (window.game) {
            window.game.startNewGame();
        }
        
        this.isPaused = false;
        document.getElementById('pause-overlay')?.classList.add('hidden');
    }
    
    startPractice(type) {
        // In a full implementation, this would start specific practice scenarios
        console.log('Starting practice:', type);
        this.startGame('practice');
    }
    
    togglePause() {
        if (this.currentScreen !== 'game-screen') return;
        
        this.isPaused = !this.isPaused;
        const pauseOverlay = document.getElementById('pause-overlay');
        
        if (this.isPaused) {
            pauseOverlay?.classList.remove('hidden');
        } else {
            pauseOverlay?.classList.add('hidden');
        }
    }
    
    quitGame() {
        this.showScreen('main-menu');
        this.isPaused = false;
    }
    
    handleGameOver(score, lines, level, grade, moveHistory, placementHeatmap) {
        // Update profile stats
        this.playerProfile.gamesPlayed++;
        this.playerProfile.totalLines += lines;
        
        if (score > this.playerProfile.bestScore) {
            this.playerProfile.bestScore = score;
        }
        
        if (this.compareGrades(grade, this.playerProfile.bestGrade)) {
            this.playerProfile.bestGrade = grade;
        }
        
        // Save recent game
        this.recentGames.push({
            score,
            lines,
            level,
            grade,
            moveHistory,
            placementHeatmap,
            timestamp: Date.now(),
            mode: this.gameMode
        });
        
        // Keep only last 10 games
        if (this.recentGames.length > 10) {
            this.recentGames.shift();
        }
        
        // Save to localStorage
        this.saveProfile();
        
        // Show game over screen
        document.getElementById('final-score').textContent = score.toLocaleString();
        document.getElementById('final-lines').textContent = lines;
        document.getElementById('final-level').textContent = level;
        document.getElementById('final-grade').textContent = grade;
        
        this.showScreen('game-over');
        
        // Update Tetris Lab data
        this.updateTetrisLab(moveHistory, placementHeatmap);
    }
    
    compareGrades(newGrade, oldGrade) {
        const gradeOrder = ['-', 'C', 'B', 'A', 'S', 'SS', 'SSS', 'SSS+'];
        return gradeOrder.indexOf(newGrade) > gradeOrder.indexOf(oldGrade);
    }
    
    updateProfileUI() {
        document.getElementById('player-name').textContent = this.playerProfile.name;
        document.getElementById('player-rank').textContent = this.playerProfile.rank;
        document.getElementById('games-played').textContent = this.playerProfile.gamesPlayed;
        document.getElementById('best-score').textContent = this.playerProfile.bestScore.toLocaleString();
        document.getElementById('total-lines').textContent = this.playerProfile.totalLines;
        document.getElementById('best-grade').textContent = this.playerProfile.bestGrade;
        
        // Draw heatmap if on profile screen
        if (this.currentScreen === 'profile') {
            this.drawHeatmap();
        }
    }
    
    drawHeatmap() {
        const canvas = document.getElementById('heatmap-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Aggregate heatmaps from recent games
        const aggregatedHeatmap = Array(20).fill().map(() => Array(10).fill(0));
        
        for (const game of this.recentGames) {
            if (game.placementHeatmap) {
                for (let row = 0; row < 20; row++) {
                    for (let col = 0; col < 10; col++) {
                        aggregatedHeatmap[row][col] += game.placementHeatmap[row][col] || 0;
                    }
                }
            }
        }
        
        // Find max value for normalization
        let maxValue = 0;
        for (let row = 0; row < 20; row++) {
            for (let col = 0; col < 10; col++) {
                if (aggregatedHeatmap[row][col] > maxValue) {
                    maxValue = aggregatedHeatmap[row][col];
                }
            }
        }
        
        // Draw heatmap
        const blockSize = Math.min(canvas.width / 10, canvas.height / 20);
        for (let row = 0; row < 20; row++) {
            for (let col = 0; col < 10; col++) {
                const value = aggregatedHeatmap[row][col];
                if (value > 0) {
                    const intensity = value / maxValue;
                    const r = Math.floor(255 * intensity);
                    const g = Math.floor(100 * intensity);
                    const b = Math.floor(255 * (1 - intensity));
                    
                    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                    ctx.fillRect(
                        col * blockSize,
                        row * blockSize,
                        blockSize - 1,
                        blockSize - 1
                    );
                }
            }
        }
    }
    
    updateTetrisLab(moveHistory, placementHeatmap) {
        // Store data for Tetris Lab analysis
        localStorage.setItem('tetrisLabData', JSON.stringify({
            recentGames: this.recentGames,
            totalGames: this.playerProfile.gamesPlayed
        }));
        
        // Dispatch event for Tetris Lab to update
        window.dispatchEvent(new CustomEvent('tetrisLabUpdate'));
    }
    
    applyTheme(theme) {
        const root = document.documentElement;
        
        switch(theme) {
            case 'neon':
                root.style.setProperty('--primary-color', '#00f0ff');
                root.style.setProperty('--secondary-color', '#ff00ff');
                break;
            case 'classic':
                root.style.setProperty('--primary-color', '#ff6b6b');
                root.style.setProperty('--secondary-color', '#4ecdc4');
                break;
            case 'minimal':
                root.style.setProperty('--primary-color', '#333333');
                root.style.setProperty('--secondary-color', '#666666');
                break;
            case 'nature':
                root.style.setProperty('--primary-color', '#56ab2f');
                root.style.setProperty('--secondary-color', '#a8e063');
                break;
        }
    }
    
    saveSettings() {
        localStorage.setItem('tetrisProSettings', JSON.stringify(this.settings));
    }
    
    loadSettings() {
        const saved = localStorage.getItem('tetrisProSettings');
        if (saved) {
            this.settings = {...this.settings, ...JSON.parse(saved)};
            
            // Apply settings
            if (this.settings.colorBlind) {
                document.body.classList.add('colorblind-mode');
            }
            if (this.settings.highContrast) {
                document.body.classList.add('high-contrast');
            }
            
            // Update UI sliders
            const dasSlider = document.getElementById('das-setting');
            if (dasSlider) dasSlider.value = this.settings.das;
            
            const arrSlider = document.getElementById('arr-setting');
            if (arrSlider) arrSlider.value = this.settings.arr;
            
            // Apply settings to game
            if (window.game) {
                window.game.updateSettings(this.settings);
            }
        }
    }
    
    saveProfile() {
        localStorage.setItem('tetrisProProfile', JSON.stringify(this.playerProfile));
    }
    
    loadProfile() {
        const saved = localStorage.getItem('tetrisProProfile');
        if (saved) {
            this.playerProfile = {...this.playerProfile, ...JSON.parse(saved)};
        }
    }
}

// Initialize UI Manager
document.addEventListener('DOMContentLoaded', () => {
    window.uiManager = new UIManager();
});
