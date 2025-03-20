class SoundManager {
    constructor() {
        this.sounds = {
            playerMove: new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'),
            botMove: new Audio('https://assets.mixkit.co/active_storage/sfx/2570/2570-preview.mp3'),
            snake: new Audio('https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3'),
            ladder: new Audio('https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3'),
            win: new Audio('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3'),
            diceRoll: new Audio('https://assets.mixkit.co/active_storage/sfx/2575/2575-preview.mp3')
        };

        // Set volume for all sounds
        Object.values(this.sounds).forEach(sound => {
            sound.volume = 0.5;
        });

        // Preload sounds
        Object.values(this.sounds).forEach(sound => {
            sound.load();
        });
    }

    play(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName].currentTime = 0;
            this.sounds[soundName].play().catch(error => {
                console.log('Sound playback failed:', error);
            });
        }
    }
}

class MusicPlayer {
    constructor() {
        this.playlist = [];
        this.currentTrack = 0;
        this.isPlaying = false;
        this.player = null;
        this.API_KEY = 'AIzaSyDDC8lv551RKMSJFgUTwzS3zuset2dyOwg';
        this.setupEventListeners();
        this.initializeYouTubePlayer();
    }

    setupEventListeners() {
        // Toggle music panel
        document.getElementById('toggle-music').addEventListener('click', () => {
            document.getElementById('music-panel').classList.toggle('show');
        });

        // Close music panel
        document.querySelector('.close-music').addEventListener('click', () => {
            document.getElementById('music-panel').classList.remove('show');
        });

        // Play/Pause button
        document.getElementById('play-pause').addEventListener('click', () => this.togglePlay());

        // Next/Previous buttons
        document.getElementById('next-song').addEventListener('click', () => this.nextTrack());
        document.getElementById('prev-song').addEventListener('click', () => this.previousTrack());

        // Volume control
        document.getElementById('volume-slider').addEventListener('input', (e) => {
            if (this.player) {
                this.player.setVolume(e.target.value);
            }
        });

        // Search functionality
        document.getElementById('music-search').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchTracks(e.target.value);
            }
        });

        document.querySelector('.search-btn').addEventListener('click', () => {
            const searchInput = document.getElementById('music-search');
            this.searchTracks(searchInput.value);
        });
    }

    initializeYouTubePlayer() {
        console.log('Initializing YouTube Player...');
        if (window.YT && window.YT.Player) {
            console.log('YouTube API already loaded');
            this.createPlayer();
        } else {
            console.log('Loading YouTube API...');
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

            window.onYouTubeIframeAPIReady = () => {
                console.log('YouTube API Ready');
                this.createPlayer();
            };
        }
    }

    createPlayer() {
        console.log('Creating YouTube Player...');
        this.player = new YT.Player('youtube-player', {
            height: '0',
            width: '0',
            playerVars: {
                'autoplay': 0,
                'controls': 0,
                'disablekb': 1,
                'enablejsapi': 1,
                'fs': 0,
                'iv_load_policy': 3,
                'modestbranding': 1,
                'playsinline': 1,
                'rel': 0,
                'showinfo': 0,
                'origin': window.location.origin
            },
            events: {
                'onReady': this.onPlayerReady.bind(this),
                'onStateChange': this.onPlayerStateChange.bind(this),
                'onError': this.onPlayerError.bind(this)
            }
        });
    }

    onPlayerReady(event) {
        console.log('YouTube Player is ready');
        if (this.player) {
            this.player.setVolume(50);
        }
    }

    onPlayerStateChange(event) {
        console.log('Player state changed:', event.data);
        if (event.data === YT.PlayerState.ENDED) {
            this.nextTrack();
        } else if (event.data === YT.PlayerState.PLAYING) {
            document.querySelector('.music-disc').classList.add('playing');
        } else if (event.data === YT.PlayerState.PAUSED) {
            document.querySelector('.music-disc').classList.remove('playing');
        }
    }

    onPlayerError(event) {
        console.error('YouTube Player Error:', event.data);
        alert('Error playing video. Please try another song.');
    }

    async searchTracks(query) {
        if (!query.trim()) {
            alert('Please enter a search term');
            return;
        }

        try {
            console.log('Searching for:', query);
            const searchInput = document.getElementById('music-search');
            searchInput.disabled = true;
            searchInput.value = 'Searching...';

            const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&maxResults=10&key=${this.API_KEY}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Search results:', data);

            if (data.error) {
                throw new Error(data.error.message || 'API Error');
            }

            this.playlist = data.items.map(item => ({
                id: item.id.videoId,
                title: item.snippet.title,
                thumbnail: item.snippet.thumbnails.default.url
            }));

            if (this.playlist.length === 0) {
                throw new Error('No results found');
            }

            this.renderPlaylist();
        } catch (error) {
            console.error('Error searching for music:', error);
            alert(`Error searching for music: ${error.message}`);
        } finally {
            const searchInput = document.getElementById('music-search');
            searchInput.disabled = false;
            searchInput.value = query;
        }
    }

    renderPlaylist() {
        console.log('Rendering playlist:', this.playlist);
        const musicList = document.getElementById('music-list');
        musicList.innerHTML = this.playlist.map((track, index) => `
            <div class="music-item ${index === this.currentTrack ? 'playing' : ''}" data-index="${index}">
                <img src="${track.thumbnail}" alt="${track.title}" class="track-thumbnail">
                <span>${track.title}</span>
            </div>
        `).join('');

        // Add click events to playlist items
        musicList.querySelectorAll('.music-item').forEach(item => {
            item.addEventListener('click', () => {
                const newIndex = parseInt(item.dataset.index);
                if (newIndex !== this.currentTrack) {
                    this.currentTrack = newIndex;
                    this.playTrack();
                }
            });
        });
    }

    playTrack() {
        console.log('Playing track:', this.playlist[this.currentTrack]);
        if (this.player && this.playlist.length > 0) {
            const track = this.playlist[this.currentTrack];
            // Hide the video player
            document.getElementById('youtube-player').style.display = 'none';
            // Load and play the video
            this.player.loadVideoById({
                videoId: track.id,
                startSeconds: 0,
                suggestedQuality: 'small'
            });
            this.player.playVideo();
            this.isPlaying = true;
            this.updatePlayButton();
            this.updateNowPlaying();
            this.renderPlaylist();
            // Start disc animation
            document.querySelector('.music-disc').classList.add('playing');
        }
    }

    pauseTrack() {
        if (this.player) {
            this.player.pauseVideo();
            this.isPlaying = false;
            this.updatePlayButton();
            // Stop disc animation
            document.querySelector('.music-disc').classList.remove('playing');
        }
    }

    togglePlay() {
        if (this.player) {
            if (this.isPlaying) {
                this.pauseTrack();
            } else {
                this.playTrack();
            }
        }
    }

    nextTrack() {
        if (this.playlist.length > 0) {
            this.currentTrack = (this.currentTrack + 1) % this.playlist.length;
            this.playTrack();
        }
    }

    previousTrack() {
        if (this.playlist.length > 0) {
            this.currentTrack = (this.currentTrack - 1 + this.playlist.length) % this.playlist.length;
            this.playTrack();
        }
    }

    updatePlayButton() {
        const playButton = document.getElementById('play-pause');
        playButton.innerHTML = this.isPlaying ? 
            '<i class="fas fa-pause"></i>' : 
            '<i class="fas fa-play"></i>';
    }

    updateNowPlaying() {
        if (this.playlist.length > 0) {
            document.getElementById('current-song').textContent = 
                `Now Playing: ${this.playlist[this.currentTrack].title}`;
        }
    }
}

class SnakeAndLadders {
    constructor() {
        this.boardSize = 100;
        this.currentPlayer = 1; // 1 for player, 2 for bot
        this.playerPositions = {
            1: 1,
            2: 1
        };
        this.snakes = {
            16: 6,
            47: 26,
            49: 11,
            56: 53,
            62: 19,
            64: 60,
            87: 24,
            93: 73,
            95: 75,
            98: 78
        };
        this.ladders = {
            1: 38,
            4: 14,
            9: 31,
            21: 42,
            28: 84,
            36: 44,
            51: 67,
            71: 91,
            80: 100
        };
        this.isRolling = false;
        this.isBotThinking = false;
        this.soundManager = new SoundManager();
        this.musicPlayer = new MusicPlayer();
        this.initializeGame();
    }

    initializeGame() {
        this.createBoard();
        this.setupEventListeners();
        this.updatePlayerPositions();
    }

    createBoard() {
        const gameBoard = document.getElementById('game-board');
        gameBoard.innerHTML = '';

        for (let i = this.boardSize; i >= 1; i--) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.textContent = i;

            if (this.snakes[i]) {
                cell.classList.add('snake');
            } else if (this.ladders[i]) {
                cell.classList.add('ladder');
            }

            gameBoard.appendChild(cell);
        }
    }

    setupEventListeners() {
        document.getElementById('roll-dice').addEventListener('click', () => this.rollDice());
        document.getElementById('reset-game').addEventListener('click', () => this.resetGame());
        document.getElementById('toggle-rules').addEventListener('click', () => this.toggleRules());
    }

    async rollDice() {
        if (this.isRolling || this.isBotThinking) return;
        this.isRolling = true;

        const dice = document.getElementById('dice');
        const rollButton = document.getElementById('roll-dice');
        rollButton.disabled = true;

        // Play dice roll sound
        this.soundManager.play('diceRoll');

        // Generate random rotations for a realistic dice roll
        const rotations = {
            x: Math.floor(Math.random() * 4) * 90,
            y: Math.floor(Math.random() * 4) * 90,
            z: Math.floor(Math.random() * 4) * 90
        };

        // Animate the dice
        dice.style.transform = `rotateX(${rotations.x}deg) rotateY(${rotations.y}deg) rotateZ(${rotations.z}deg)`;

        // Wait for animation to complete
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Generate the actual dice value
        const diceValue = Math.floor(Math.random() * 6) + 1;
        
        // Update dice display
        dice.style.transform = `rotateX(${rotations.x + 360}deg) rotateY(${rotations.y + 360}deg) rotateZ(${rotations.z + 360}deg)`;
        
        // Wait for final animation
        await new Promise(resolve => setTimeout(resolve, 500));

        await this.movePlayer(diceValue);
        this.isRolling = false;
        rollButton.disabled = false;

        // Bot's turn
        if (this.currentPlayer === 2) {
            await this.botTurn();
        }
    }

    async botTurn() {
        this.isBotThinking = true;
        const rollButton = document.getElementById('roll-dice');
        rollButton.disabled = true;

        // Show bot thinking animation
        rollButton.textContent = "Bot is thinking...";
        
        // Random delay to make it feel more natural
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

        // Play bot move sound
        this.soundManager.play('botMove');

        // Generate bot's dice roll
        const diceValue = Math.floor(Math.random() * 6) + 1;
        
        // Animate the dice for bot's turn
        const dice = document.getElementById('dice');
        const rotations = {
            x: Math.floor(Math.random() * 4) * 90,
            y: Math.floor(Math.random() * 4) * 90,
            z: Math.floor(Math.random() * 4) * 90
        };

        dice.style.transform = `rotateX(${rotations.x}deg) rotateY(${rotations.y}deg) rotateZ(${rotations.z}deg)`;
        await new Promise(resolve => setTimeout(resolve, 1000));
        dice.style.transform = `rotateX(${rotations.x + 360}deg) rotateY(${rotations.y + 360}deg) rotateZ(${rotations.z + 360}deg)`;
        await new Promise(resolve => setTimeout(resolve, 500));

        await this.movePlayer(diceValue);
        this.isBotThinking = false;
        rollButton.disabled = false;
        rollButton.textContent = "Roll";
    }

    async movePlayer(diceValue) {
        const currentPosition = this.playerPositions[this.currentPlayer];
        let newPosition = currentPosition + diceValue;

        // Play player move sound
        this.soundManager.play('playerMove');

        // Check if player won
        if (newPosition >= this.boardSize) {
            this.showWinAnimation(this.currentPlayer);
            return;
        }

        // Check for snakes
        if (this.snakes[newPosition]) {
            newPosition = this.snakes[newPosition];
            this.showSnakeAnimation();
            this.soundManager.play('snake');
        }

        // Check for ladders
        if (this.ladders[newPosition]) {
            newPosition = this.ladders[newPosition];
            this.showLadderAnimation();
            this.soundManager.play('ladder');
        }

        this.playerPositions[this.currentPlayer] = newPosition;
        this.updatePlayerPositions();

        // Switch player
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
    }

    showWinAnimation(player) {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.style.animation = 'none';
            cell.offsetHeight; // Trigger reflow
            cell.style.animation = 'winPulse 1s infinite';
        });

        // Play win sound
        this.soundManager.play('win');

        setTimeout(() => {
            const winner = player === 1 ? "You" : "Bot";
            alert(`${winner} wins!`);
            this.resetGame();
        }, 1000);
    }

    showSnakeAnimation() {
        const cells = document.querySelectorAll('.cell.snake');
        cells.forEach(cell => {
            cell.style.animation = 'none';
            cell.offsetHeight; // Trigger reflow
            cell.style.animation = 'snakePulse 0.5s infinite';
        });

        setTimeout(() => {
            cells.forEach(cell => cell.style.animation = '');
        }, 1000);
    }

    showLadderAnimation() {
        const cells = document.querySelectorAll('.cell.ladder');
        cells.forEach(cell => {
            cell.style.animation = 'none';
            cell.offsetHeight; // Trigger reflow
            cell.style.animation = 'ladderPulse 0.5s infinite';
        });

        setTimeout(() => {
            cells.forEach(cell => cell.style.animation = '');
        }, 1000);
    }

    updatePlayerPositions() {
        // Update position displays
        document.getElementById('player1-position').textContent = this.playerPositions[1];
        document.getElementById('player2-position').textContent = this.playerPositions[2];

        // Update board display
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.classList.remove('player1-token', 'player2-token');
        });

        // Add player tokens
        cells[this.boardSize - this.playerPositions[1]].classList.add('player1-token');
        cells[this.boardSize - this.playerPositions[2]].classList.add('player2-token');
    }

    resetGame() {
        this.playerPositions = {
            1: 1,
            2: 1
        };
        this.currentPlayer = 1;
        this.updatePlayerPositions();
        document.getElementById('dice').style.transform = 'none';
        document.getElementById('roll-dice').textContent = 'Roll';
        document.getElementById('roll-dice').disabled = false;
    }

    toggleRules() {
        const rulesPanel = document.getElementById('rules-panel');
        const toggleButton = document.getElementById('toggle-rules');
        rulesPanel.classList.toggle('show');
        toggleButton.textContent = rulesPanel.classList.contains('show') ? 'Hide Rules' : 'Game Rules';
    }
}

// Initialize the game when the page loads
window.addEventListener('load', () => {
    new SnakeAndLadders();
}); 