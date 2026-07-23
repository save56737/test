// Tetris Game Core Logic

export class TetrisGame {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.blockSize = 30;
        this.boardWidth = 10;
        this.boardHeight = 20;
        
        // Game state
        this.board = [];
        this.currentPiece = null;
        this.nextPieces = [];
        this.holdPiece = null;
        this.canHold = true;
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.combo = -1;
        this.backToBack = false;
        this.grade = '-';
        
        // Timing
        this.lastDrop = 0;
        this.dropInterval = 1000;
        this.lockDelay = 500;
        this.lockTimer = null;
        this.isLocked = false;
        
        // Settings
        this.das = 170;
        this.arr = 30;
        this.softDropSpeed = 1;
        
        // Input state
        this.keys = {};
        this.dasTimer = null;
        this.arrTimer = null;
        
        // Effects
        this.particles = [];
        this.screenShake = 0;
        this.lineClears = [];
        
        // Statistics for Tetris Lab
        this.moveHistory = [];
        this.placementHeatmap = Array(this.boardHeight).fill().map(() => Array(this.boardWidth).fill(0));
        
        this.init();
    }
    
    init() {
        this.resetBoard();
        this.setupInput();
        this.startNewGame();
    }
    
    resetBoard() {
        this.board = Array(this.boardHeight).fill().map(() => Array(this.boardWidth).fill(0));
    }
    
    startNewGame() {
        this.resetBoard();
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.combo = -1;
        this.backToBack = false;
        this.nextPieces = [];
        this.holdPiece = null;
        this.canHold = true;
        this.particles = [];
        this.moveHistory = [];
        this.placementHeatmap = Array(this.boardHeight).fill().map(() => Array(this.boardWidth).fill(0));
        
        // Generate initial pieces using 7-bag randomizer
        this.bag = this.generateBag();
        for (let i = 0; i < 7; i++) {
            this.nextPieces.push(this.getPieceFromBag());
        }
        
        this.spawnPiece();
        this.updateUI();
        this.lastDrop = performance.now();
        this.gameLoop(performance.now());
    }
    
    generateBag() {
        const pieces = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
        // Fisher-Yates shuffle
        for (let i = pieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
        }
        return pieces;
    }
    
    getPieceFromBag() {
        if (this.bag.length === 0) {
            this.bag = this.generateBag();
        }
        return this.bag.pop();
    }
    
    spawnPiece() {
        const type = this.nextPieces.shift();
        this.nextPieces.push(this.getPieceFromBag());
        
        this.currentPiece = {
            type: type,
            shape: this.getPieceShape(type),
            x: 3,
            y: 0,
            rotation: 0
        };
        
        this.canHold = true;
        
        // Check for game over
        if (this.checkCollision(this.currentPiece.x, this.currentPiece.y, this.currentPiece.shape)) {
            this.gameOver();
        }
        
        this.resetLockDelay();
    }
    
    getPieceShape(type) {
        const shapes = {
            'I': [[0,0,0,0], [1,1,1,1], [0,0,0,0], [0,0,0,0]],
            'O': [[1,1], [1,1]],
            'T': [[0,1,0], [1,1,1], [0,0,0]],
            'S': [[0,1,1], [1,1,0], [0,0,0]],
            'Z': [[1,1,0], [0,1,1], [0,0,0]],
            'J': [[1,0,0], [1,1,1], [0,0,0]],
            'L': [[0,0,1], [1,1,1], [0,0,0]]
        };
        return shapes[type];
    }
    
    getPieceColor(type) {
        const colors = {
            'I': '#00f0ff',
            'O': '#ffcc00',
            'T': '#ff00ff',
            'S': '#00ff00',
            'Z': '#ff0000',
            'J': '#0000ff',
            'L': '#ff8800'
        };
        return colors[type];
    }
    
    checkCollision(x, y, shape) {
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    
                    if (newX < 0 || newX >= this.boardWidth || 
                        newY >= this.boardHeight ||
                        (newY >= 0 && this.board[newY][newX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    movePiece(dx, dy) {
        if (!this.currentPiece) return false;
        
        const newX = this.currentPiece.x + dx;
        const newY = this.currentPiece.y + dy;
        
        if (!this.checkCollision(newX, newY, this.currentPiece.shape)) {
            this.currentPiece.x = newX;
            this.currentPiece.y = newY;
            
            // Record move for analysis
            this.recordMove('move', {dx, dy});
            
            if (dy > 0) {
                this.score += 1; // Soft drop points
                this.resetLockDelay();
            }
            
            return true;
        }
        return false;
    }
    
    rotatePiece(direction) {
        if (!this.currentPiece) return;
        
        const oldShape = this.currentPiece.shape;
        const newShape = this.rotateMatrix(oldShape, direction);
        
        // Try basic rotation
        if (!this.checkCollision(this.currentPiece.x, this.currentPiece.y, newShape)) {
            this.currentPiece.shape = newShape;
            this.currentPiece.rotation = (this.currentPiece.rotation + direction + 4) % 4;
            this.recordMove('rotate', {direction});
            this.resetLockDelay();
            return;
        }
        
        // Wall kick (SRS)
        const kicks = this.getWallKicks(this.currentPiece.type, direction);
        for (const kick of kicks) {
            if (!this.checkCollision(
                this.currentPiece.x + kick.x,
                this.currentPiece.y + kick.y,
                newShape
            )) {
                this.currentPiece.x += kick.x;
                this.currentPiece.y += kick.y;
                this.currentPiece.shape = newShape;
                this.currentPiece.rotation = (this.currentPiece.rotation + direction + 4) % 4;
                this.recordMove('rotate', {direction, kick});
                this.resetLockDelay();
                return;
            }
        }
    }
    
    rotateMatrix(matrix, direction) {
        const N = matrix.length;
        const rotated = Array(N).fill().map(() => Array(N).fill(0));
        
        for (let row = 0; row < N; row++) {
            for (let col = 0; col < N; col++) {
                if (direction === 1) { // Clockwise
                    rotated[col][N - 1 - row] = matrix[row][col];
                } else { // Counter-clockwise
                    rotated[N - 1 - col][row] = matrix[row][col];
                }
            }
        }
        return rotated;
    }
    
    getWallKicks(pieceType, direction) {
        // Simplified SRS wall kicks
        if (pieceType === 'I') {
            return [
                {x: -2, y: 0}, {x: -1, y: 0}, {x: 1, y: 0}, {x: 2, y: 0},
                {x: 0, y: -1}, {x: 0, y: 1}
            ];
        } else {
            return [
                {x: -1, y: 0}, {x: 1, y: 0},
                {x: 0, y: -1}, {x: -1, y: -1}, {x: 1, y: -1}
            ];
        }
    }
    
    hardDrop() {
        if (!this.currentPiece) return;
        
        let dropDistance = 0;
        while (!this.checkCollision(
            this.currentPiece.x,
            this.currentPiece.y + 1,
            this.currentPiece.shape
        )) {
            this.currentPiece.y++;
            dropDistance++;
        }
        
        this.score += dropDistance * 2;
        this.recordMove('hardDrop', {dropDistance});
        this.lockPiece();
        this.screenShake = 5;
    }
    
    holdCurrentPiece() {
        if (!this.canHold || !this.currentPiece) return;
        
        const currentType = this.currentPiece.type;
        
        if (this.holdPiece) {
            const temp = this.holdPiece;
            this.holdPiece = currentType;
            
            // Spawn the held piece
            this.currentPiece = {
                type: temp,
                shape: this.getPieceShape(temp),
                x: 3,
                y: 0,
                rotation: 0
            };
        } else {
            this.holdPiece = currentType;
            this.spawnPiece();
        }
        
        this.canHold = false;
        this.recordMove('hold', {});
    }
    
    resetLockDelay() {
        if (this.lockTimer) {
            clearTimeout(this.lockTimer);
        }
        
        if (this.isOnGround()) {
            this.isLocked = false;
            this.lockTimer = setTimeout(() => {
                this.lockPiece();
            }, this.lockDelay);
        }
    }
    
    isOnGround() {
        return this.checkCollision(
            this.currentPiece.x,
            this.currentPiece.y + 1,
            this.currentPiece.shape
        );
    }
    
    lockPiece() {
        if (!this.currentPiece || this.isLocked) return;
        this.isLocked = true;
        
        if (this.lockTimer) {
            clearTimeout(this.lockTimer);
            this.lockTimer = null;
        }
        
        // Place piece on board
        const {x, y, shape, type} = this.currentPiece;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    const boardY = y + row;
                    const boardX = x + col;
                    if (boardY >= 0 && boardY < this.boardHeight) {
                        this.board[boardY][boardX] = type;
                        this.placementHeatmap[boardY][boardX]++;
                    }
                }
            }
        }
        
        // Check for line clears
        this.clearLines();
        
        // Spawn next piece
        this.currentPiece = null;
        this.isLocked = false;
        this.spawnPiece();
    }
    
    clearLines() {
        const linesCleared = [];
        
        for (let row = this.boardHeight - 1; row >= 0; row--) {
            if (this.board[row].every(cell => cell !== 0)) {
                linesCleared.push(row);
            }
        }
        
        if (linesCleared.length > 0) {
            // Remove cleared lines
            for (const row of linesCleared) {
                this.board.splice(row, 1);
                this.board.unshift(Array(this.boardWidth).fill(0));
            }
            
            // Calculate score
            this.combo++;
            const baseScores = [0, 100, 300, 500, 800];
            let lineScore = baseScores[linesCleared.length] * this.level;
            
            // T-Spin detection (simplified)
            const isTSpin = this.detectTSpin();
            if (isTSpin) {
                lineScore *= 2;
                this.createParticles('T-SPIN!');
            }
            
            // Combo bonus
            if (this.combo > 0) {
                lineScore += 50 * this.combo * this.level;
            }
            
            // Back-to-Back bonus
            if (this.backToBack && linesCleared.length >= 4) {
                lineScore = Math.floor(lineScore * 1.5);
            }
            this.backToBack = linesCleared.length >= 4;
            
            this.score += lineScore;
            this.lines += linesCleared.length;
            this.lineClears = linesCleared;
            
            // Create particles for line clear
            this.createLineClearParticles(linesCleared);
            
            // Level up every 10 lines
            this.level = Math.floor(this.lines / 10) + 1;
            this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            
            // Update grade
            this.updateGrade();
            
            // Screen shake for tetris
            if (linesCleared.length >= 4) {
                this.screenShake = 10;
            }
        } else {
            this.combo = -1;
        }
        
        this.lineClears = [];
    }
    
    detectTSpin() {
        if (!this.currentPiece || this.currentPiece.type !== 'T') return false;
        
        const {x, y} = this.currentPiece;
        const corners = [
            [x, y], [x + 2, y],
            [x, y + 2], [x + 2, y + 2]
        ];
        
        let cornerCount = 0;
        for (const [cx, cy] of corners) {
            if (cx < 0 || cx >= this.boardWidth || cy >= this.boardHeight ||
                (cy >= 0 && this.board[cy][cx])) {
                cornerCount++;
            }
        }
        
        return cornerCount >= 3;
    }
    
    updateGrade() {
        const scoreThresholds = [
            {score: 0, grade: '-'},
            {score: 1000, grade: 'C'},
            {score: 3000, grade: 'B'},
            {score: 6000, grade: 'A'},
            {score: 10000, grade: 'S'},
            {score: 15000, grade: 'SS'},
            {score: 20000, grade: 'SSS'},
            {score: 30000, grade: 'SSS+'}
        ];
        
        for (let i = scoreThresholds.length - 1; i >= 0; i--) {
            if (this.score >= scoreThresholds[i].score) {
                this.grade = scoreThresholds[i].grade;
                break;
            }
        }
    }
    
    recordMove(type, data) {
        this.moveHistory.push({
            type,
            data,
            timestamp: performance.now(),
            piece: this.currentPiece?.type,
            position: {x: this.currentPiece?.x, y: this.currentPiece?.y}
        });
    }
    
    createParticles(text) {
        // Particle effects implementation
        for (let i = 0; i < 20; i++) {
            this.particles.push({
                x: this.canvas.width / 2,
                y: this.canvas.height / 2,
                vx: (Math.random() - 0.5) * 10,
                vy: (Math.random() - 0.5) * 10,
                life: 1,
                color: this.getPieceColor(this.currentPiece?.type || 'T')
            });
        }
    }
    
    createLineClearParticles(lines) {
        for (const line of lines) {
            for (let i = 0; i < 10; i++) {
                this.particles.push({
                    x: Math.random() * this.canvas.width,
                    y: line * this.blockSize,
                    vx: (Math.random() - 0.5) * 5,
                    vy: (Math.random() - 0.5) * 5,
                    life: 1,
                    color: '#ffffff'
                });
            }
        }
    }
    
    setupInput() {
        document.addEventListener('keydown', (e) => {
            if (this.keys[e.code]) return;
            this.keys[e.code] = true;
            
            switch(e.code) {
                case 'ArrowLeft':
                case 'KeyA':
                    this.movePiece(-1, 0);
                    this.startDAS(-1);
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.movePiece(1, 0);
                    this.startDAS(1);
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                case 'KeyW':
                case 'KeyX':
                    this.rotatePiece(1);
                    break;
                case 'KeyZ':
                    this.rotatePiece(-1);
                    break;
                case 'Space':
                    this.hardDrop();
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                case 'KeyC':
                    this.holdCurrentPiece();
                    break;
                case 'Escape':
                case 'KeyP':
                    this.togglePause();
                    break;
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            
            if (e.code === 'ArrowLeft' || e.code === 'KeyA' ||
                e.code === 'ArrowRight' || e.code === 'KeyD') {
                this.stopDAS();
            }
        });
    }
    
    startDAS(direction) {
        this.dasDirection = direction;
        this.dasTimer = setTimeout(() => {
            this.movePiece(direction, 0);
            this.arrTimer = setInterval(() => {
                this.movePiece(direction, 0);
            }, this.arr);
        }, this.das);
    }
    
    stopDAS() {
        if (this.dasTimer) {
            clearTimeout(this.dasTimer);
            this.dasTimer = null;
        }
        if (this.arrTimer) {
            clearInterval(this.arrTimer);
            this.arrTimer = null;
        }
    }
    
    togglePause() {
        // Implemented in UI manager
        const event = new CustomEvent('togglePause');
        window.dispatchEvent(event);
    }
    
    gameOver() {
        const event = new CustomEvent('gameOver', {
            detail: {
                score: this.score,
                lines: this.lines,
                level: this.level,
                grade: this.grade,
                moveHistory: this.moveHistory,
                placementHeatmap: this.placementHeatmap
            }
        });
        window.dispatchEvent(event);
    }
    
    updateUI() {
        const event = new CustomEvent('updateUI', {
            detail: {
                score: this.score,
                lines: this.lines,
                level: this.level,
                combo: this.combo,
                grade: this.grade,
                holdPiece: this.holdPiece,
                nextPieces: this.nextPieces
            }
        });
        window.dispatchEvent(event);
    }
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply screen shake
        this.ctx.save();
        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake;
            const shakeY = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(shakeX, shakeY);
            this.screenShake = Math.max(0, this.screenShake - 1);
        }
        
        // Draw grid
        this.drawGrid();
        
        // Draw board
        this.drawBoard();
        
        // Draw ghost piece
        this.drawGhostPiece();
        
        // Draw current piece
        this.drawCurrentPiece();
        
        // Draw line clear highlights
        this.drawLineClears();
        
        // Draw particles
        this.drawParticles();
        
        this.ctx.restore();
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.boardWidth; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.blockSize, 0);
            this.ctx.lineTo(x * this.blockSize, this.boardHeight * this.blockSize);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.boardHeight; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.blockSize);
            this.ctx.lineTo(this.boardWidth * this.blockSize, y * this.blockSize);
            this.ctx.stroke();
        }
    }
    
    drawBoard() {
        for (let row = 0; row < this.boardHeight; row++) {
            for (let col = 0; col < this.boardWidth; col++) {
                if (this.board[row][col]) {
                    this.drawBlock(col, row, this.getPieceColor(this.board[row][col]));
                }
            }
        }
    }
    
    drawCurrentPiece() {
        if (!this.currentPiece) return;
        
        const {x, y, shape, type} = this.currentPiece;
        const color = this.getPieceColor(type);
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    this.drawBlock(x + col, y + row, color);
                }
            }
        }
    }
    
    drawGhostPiece() {
        if (!this.currentPiece) return;
        
        let ghostY = this.currentPiece.y;
        while (!this.checkCollision(
            this.currentPiece.x,
            ghostY + 1,
            this.currentPiece.shape
        )) {
            ghostY++;
        }
        
        const {x, shape, type} = this.currentPiece;
        const color = this.getPieceColor(type);
        
        this.ctx.globalAlpha = 0.3;
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    this.drawBlock(x + col, ghostY + row, color);
                }
            }
        }
        this.ctx.globalAlpha = 1;
    }
    
    drawBlock(x, y, color) {
        const padding = 1;
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            x * this.blockSize + padding,
            y * this.blockSize + padding,
            this.blockSize - padding * 2,
            this.blockSize - padding * 2
        );
        
        // Highlight
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.fillRect(
            x * this.blockSize + padding,
            y * this.blockSize + padding,
            this.blockSize - padding * 2,
            3
        );
    }
    
    drawLineClears() {
        if (this.lineClears.length === 0) return;
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        for (const line of this.lineClears) {
            this.ctx.fillRect(
                0,
                line * this.blockSize,
                this.boardWidth * this.blockSize,
                this.blockSize
            );
        }
    }
    
    drawParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // Gravity
            p.life -= 0.02;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
    }
    
    drawHoldPiece(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || !this.holdPiece) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const shape = this.getPieceShape(this.holdPiece);
        const color = this.getPieceColor(this.holdPiece);
        const blockSize = 20;
        const offsetX = (canvas.width - shape[0].length * blockSize) / 2;
        const offsetY = (canvas.height - shape.length * blockSize) / 2;
        
        for (let row = 0; row < shape.length; row++) {
            for (let col = 0; col < shape[row].length; col++) {
                if (shape[row][col]) {
                    ctx.fillStyle = color;
                    ctx.fillRect(
                        offsetX + col * blockSize,
                        offsetY + row * blockSize,
                        blockSize - 1,
                        blockSize - 1
                    );
                }
            }
        }
    }
    
    drawNextPieces(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas || this.nextPieces.length === 0) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const blockSize = 20;
        let yOffset = 10;
        
        for (let i = 0; i < Math.min(5, this.nextPieces.length); i++) {
            const type = this.nextPieces[i];
            const shape = this.getPieceShape(type);
            const color = this.getPieceColor(type);
            const offsetX = (canvas.width - shape[0].length * blockSize) / 2;
            
            for (let row = 0; row < shape.length; row++) {
                for (let col = 0; col < shape[row].length; col++) {
                    if (shape[row][col]) {
                        ctx.fillStyle = color;
                        ctx.fillRect(
                            offsetX + col * blockSize,
                            yOffset + row * blockSize,
                            blockSize - 1,
                            blockSize - 1
                        );
                    }
                }
            }
            
            yOffset += shape.length * blockSize + 10;
        }
    }
    
    gameLoop(timestamp) {
        if (!this.currentPiece) return;
        
        const deltaTime = timestamp - this.lastDrop;
        
        if (deltaTime > this.dropInterval / this.softDropSpeed) {
            this.movePiece(0, 1);
            this.lastDrop = timestamp;
        }
        
        this.draw();
        this.drawHoldPiece('hold-canvas');
        this.drawNextPieces('next-canvas');
        this.updateUI();
        
        requestAnimationFrame((t) => this.gameLoop(t));
    }
    
    updateSettings(settings) {
        if (settings.das) this.das = settings.das;
        if (settings.arr) this.arr = settings.arr;
        if (settings.softDropSpeed) this.softDropSpeed = settings.softDropSpeed;
        if (settings.lockDelay) this.lockDelay = settings.lockDelay;
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.game = new TetrisGame('game-canvas');
});
