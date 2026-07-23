// Tetris Lab - AI Analysis System

class TetrisLab {
    constructor() {
        this.gamesData = [];
        this.accuracyHistory = [];
        this.missedOpportunities = [];
        this.weaknesses = [];
        
        this.init();
    }
    
    init() {
        this.loadData();
        this.setupEventListeners();
        this.analyzeGames();
    }
    
    loadData() {
        const saved = localStorage.getItem('tetrisLabData');
        if (saved) {
            const data = JSON.parse(saved);
            this.gamesData = data.recentGames || [];
        }
    }
    
    setupEventListeners() {
        window.addEventListener('tetrisLabUpdate', () => {
            this.loadData();
            this.analyzeGames();
        });
        
        document.getElementById('compare-pro-btn')?.addEventListener('click', () => {
            this.compareWithPro();
        });
    }
    
    analyzeGames() {
        if (this.gamesData.length === 0) {
            this.showNoData();
            return;
        }
        
        this.calculateAccuracy();
        this.findMissedOpportunities();
        this.detectWeaknesses();
        this.updateUI();
    }
    
    calculateAccuracy() {
        this.accuracyHistory = [];
        
        for (const game of this.gamesData) {
            if (!game.moveHistory) continue;
            
            let totalMoves = 0;
            let optimalMoves = 0;
            
            for (const move of game.moveHistory) {
                totalMoves++;
                
                // Simplified accuracy calculation
                // In a real implementation, this would use AI to find optimal moves
                if (move.type === 'hardDrop') {
                    optimalMoves++; // Hard drops are usually optimal
                } else if (move.type === 'rotate' && move.data.kick) {
                    optimalMoves += 0.8; // Wall kicks are good but not always optimal
                } else if (move.type === 'hold') {
                    optimalMoves += 0.9; // Hold is usually strategic
                } else {
                    optimalMoves += 0.7; // Regular moves
                }
            }
            
            const accuracy = totalMoves > 0 ? (optimalMoves / totalMoves) * 100 : 0;
            this.accuracyHistory.push({
                score: game.score,
                accuracy: Math.round(accuracy),
                grade: game.grade
            });
        }
    }
    
    findMissedOpportunities() {
        this.missedOpportunities = [];
        
        for (const game of this.gamesData) {
            if (!game.moveHistory) continue;
            
            // Look for potential T-Spin opportunities
            let tPieceCount = 0;
            let tspinCount = 0;
            
            for (const move of game.moveHistory) {
                if (move.piece === 'T') {
                    tPieceCount++;
                }
                // In a real implementation, we'd analyze board state
                // to detect missed T-Spin setups
            }
            
            if (tPieceCount > 5 && game.grade < 'A') {
                this.missedOpportunities.push({
                    type: 'T-Spin',
                    message: `You placed ${tPieceCount} T-pieces but may have missed T-Spin opportunities`,
                    suggestion: 'Try setting up T-Spin triples by leaving a 3x3 hole with corners filled'
                });
            }
            
            // Check for combo breaks
            if (game.lines < 20) {
                this.missedOpportunities.push({
                    type: 'Combo',
                    message: 'Your combos were broken frequently',
                    suggestion: 'Try to clear lines consistently without gaps'
                });
            }
            
            // Check for perfect clear opportunities
            if (game.lines % 10 === 0 && game.grade < 'S') {
                this.missedOpportunities.push({
                    type: 'Perfect Clear',
                    message: 'You had opportunities for Perfect Clears',
                    suggestion: 'Plan ahead to clear the entire stack every 10 pieces'
                });
            }
        }
    }
    
    detectWeaknesses() {
        this.weaknesses = [];
        
        if (this.gamesData.length === 0) return;
        
        const avgScore = this.gamesData.reduce((sum, g) => sum + g.score, 0) / this.gamesData.length;
        const avgLines = this.gamesData.reduce((sum, g) => sum + g.lines, 0) / this.gamesData.length;
        
        if (avgScore < 5000) {
            this.weaknesses.push({
                area: 'Scoring',
                level: 'Beginner',
                recommendation: 'Focus on learning hard drops and basic combos'
            });
        }
        
        if (avgLines < 30) {
            this.weaknesses.push({
                area: 'Survival',
                level: 'Beginner',
                recommendation: 'Practice keeping your stack low and flat'
            });
        }
        
        const hasTSpin = this.gamesData.some(g => g.moveHistory?.some(m => m.type === 'rotate' && m.data));
        if (!hasTSpin) {
            this.weaknesses.push({
                area: 'Advanced Techniques',
                level: 'Beginner',
                recommendation: 'Learn T-Spin setups for higher scores'
            });
        }
        
        const bestGrade = this.gamesData.reduce((best, g) => 
            this.compareGrades(g.grade, best) ? g.grade : best, '-');
        
        if (bestGrade < 'S') {
            this.weaknesses.push({
                area: 'Efficiency',
                level: 'Intermediate',
                recommendation: 'Work on piece recognition and faster decision making'
            });
        }
    }
    
    compareGrades(grade1, grade2) {
        const order = ['-', 'C', 'B', 'A', 'S', 'SS', 'SSS', 'SSS+'];
        return order.indexOf(grade1) > order.indexOf(grade2);
    }
    
    updateUI() {
        this.updateAccuracyChart();
        this.updateMissedOpportunities();
        this.updateWeaknessDetection();
    }
    
    updateAccuracyChart() {
        const canvas = document.getElementById('accuracy-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (this.accuracyHistory.length === 0) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Play games to see accuracy data', canvas.width / 2, canvas.height / 2);
            return;
        }
        
        const padding = 40;
        const chartWidth = canvas.width - padding * 2;
        const chartHeight = canvas.height - padding * 2;
        
        // Draw axes
        ctx.strokeStyle = '#00f0ff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.stroke();
        
        // Draw accuracy line
        ctx.strokeStyle = '#ff00ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        const maxAccuracy = 100;
        const stepX = chartWidth / Math.max(this.accuracyHistory.length - 1, 1);
        
        this.accuracyHistory.forEach((data, i) => {
            const x = padding + i * stepX;
            const y = canvas.height - padding - (data.accuracy / maxAccuracy) * chartHeight;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        // Draw data points
        ctx.fillStyle = '#ffffff';
        this.accuracyHistory.forEach((data, i) => {
            const x = padding + i * stepX;
            const y = canvas.height - padding - (data.accuracy / maxAccuracy) * chartHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Update accuracy score text
        const avgAccuracy = this.accuracyHistory.reduce((sum, d) => sum + d.accuracy, 0) / this.accuracyHistory.length;
        document.getElementById('accuracy-score').textContent = 
            `Average Accuracy: ${Math.round(avgAccuracy)}% (${this.accuracyHistory.length} games)`;
    }
    
    updateMissedOpportunities() {
        const container = document.getElementById('missed-opportunities');
        if (!container) return;
        
        if (this.missedOpportunities.length === 0) {
            container.innerHTML = '<p>No missed opportunities detected. Great job!</p>';
            return;
        }
        
        container.innerHTML = this.missedOpportunities.map(opp => `
            <div class="opportunity-card">
                <h4>${opp.type}</h4>
                <p>${opp.message}</p>
                <p class="suggestion">💡 ${opp.suggestion}</p>
            </div>
        `).join('');
    }
    
    updateWeaknessDetection() {
        const container = document.getElementById('weakness-detection');
        if (!container) return;
        
        if (this.weaknesses.length === 0) {
            container.innerHTML = '<p>No significant weaknesses detected. Keep improving!</p>';
            return;
        }
        
        container.innerHTML = this.weaknesses.map(weakness => `
            <div class="weakness-card">
                <h4>${weakness.area} (${weakness.level})</h4>
                <p>${weakness.recommendation}</p>
            </div>
        `).join('');
    }
    
    showNoData() {
        document.getElementById('accuracy-score').textContent = 'Accuracy: --%';
        
        const oppContainer = document.getElementById('missed-opportunities');
        if (oppContainer) {
            oppContainer.innerHTML = '<p>No games analyzed yet. Play some games to get started!</p>';
        }
        
        const weakContainer = document.getElementById('weakness-detection');
        if (weakContainer) {
            weakContainer.innerHTML = '<p>Play games to get personalized recommendations</p>';
        }
        
        const canvas = document.getElementById('accuracy-chart');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Play games to see analysis', canvas.width / 2, canvas.height / 2);
        }
    }
    
    compareWithPro() {
        // In a real implementation, this would load pro replays
        alert('Pro Comparison Feature:\n\nThis would compare your replay with professional players on the same seed.\n\nFeatures:\n- Side-by-side comparison\n- Move-by-move analysis\n- Efficiency metrics\n- Placement differences\n\nComing soon!');
    }
    
    // AI Coach suggestions (for future implementation)
    getCoachSuggestion(boardState, currentPiece) {
        // Placeholder for AI coach logic
        // This would analyze the board and suggest optimal placements
        return {
            position: {x: 3, y: 0},
            rotation: 0,
            reason: 'This placement sets up a potential T-Spin',
            confidence: 0.85
        };
    }
    
    // Calculate advanced statistics
    calculateStats() {
        if (this.gamesData.length === 0) return null;
        
        const stats = {
            totalGames: this.gamesData.length,
            averageScore: 0,
            averageLines: 0,
            averageLevel: 0,
            bestGrade: '-',
            pps: 0, // Pieces per second
            apl: 0, // Attacks per line
            efficiency: 0
        };
        
        // Calculate averages
        stats.averageScore = this.gamesData.reduce((sum, g) => sum + g.score, 0) / this.gamesData.length;
        stats.averageLines = this.gamesData.reduce((sum, g) => sum + g.lines, 0) / this.gamesData.length;
        
        // Find best grade
        stats.bestGrade = this.gamesData.reduce((best, g) => 
            this.compareGrades(g.grade, best) ? g.grade : best, '-');
        
        return stats;
    }
}

// Initialize Tetris Lab
document.addEventListener('DOMContentLoaded', () => {
    window.tetrisLab = new TetrisLab();
});
