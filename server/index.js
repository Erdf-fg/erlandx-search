const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
// Enhanced CORS for production
app.use(cors({
    origin: ["https://among-kos.netlify.app", "http://localhost:5173"],
    methods: ["GET", "POST"],
    credentials: true
}));

// Health check for Zeabur/Render/HuggingFace
app.get('/', (req, res) => {
    res.send('Among Digital Server is Running!');
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["https://among-kos.netlify.app", "http://localhost:5173"],
        methods: ["GET", "POST"],
        credentials: true
    }
});

const players = {};
let gameState = 'LOBBY';
let sabotageActive = false;
let sabotageType = null;
let lobbyTimer = null;
let countdownSeconds = 10;

io.on('connection', (socket) => {
    console.log('Player connected:', socket.id);

    socket.on('joinGame', (playerData) => {
        players[socket.id] = {
            id: socket.id,
            name: playerData.name || 'Unknown',
            x: 2700 + (Math.random() * 100 - 50),
            y: 2700 + (Math.random() * 100 - 50),
            color: playerData.color || '#ff0000',
            isImpostor: false,
            isGhost: false,
            voted: false,
            isAdmin: playerData.isAdmin || false,
            tasksDone: 0
        };

        socket.join('general');
        socket.emit('currentPlayers', players);
        socket.to('general').emit('newPlayer', players[socket.id]);

        io.to('general').emit('playerCount', Object.keys(players).length);
        checkLobbyStart();

        // Sync full state to admin
        io.to('general').emit('adminUpdate', { players, gameState });
    });

    function checkLobbyStart() {
        if (gameState !== 'LOBBY') return;
        const count = Object.keys(players).length;

        if (count >= 15) {
            startGame();
        } else if (count >= 1) {
            startCountdown();
        } else {
            stopCountdown();
        }
    }

    function startCountdown() {
        if (lobbyTimer) clearInterval(lobbyTimer);
        countdownSeconds = 10;
        io.to('general').emit('lobbyCountdown', countdownSeconds);
        lobbyTimer = setInterval(() => {
            countdownSeconds--;
            io.to('general').emit('lobbyCountdown', countdownSeconds);
            if (countdownSeconds <= 0) {
                startGame();
            }
        }, 1000);
    }

    function stopCountdown() {
        if (lobbyTimer) {
            clearInterval(lobbyTimer);
            lobbyTimer = null;
            io.to('general').emit('lobbyCountdown', null);
        }
    }

    socket.on('adminStartGame', () => {
        if (players[socket.id] && players[socket.id].isAdmin) {
            startGame();
        }
    });

    function startGame() {
        stopCountdown();
        gameState = 'PLAYING';
        const ids = Object.keys(players);
        if (ids.length === 0) return;

        const impostorId = ids[Math.floor(Math.random() * ids.length)];

        ids.forEach(id => {
            players[id].isImpostor = (id === impostorId);
            io.to(id).emit('gameStarted', { isImpostor: players[id].isImpostor });
        });

        io.to('general').emit('updateGameState', { state: 'PLAYING' });
    }

    socket.on('playerMovement', (movementData) => {
        if (players[socket.id]) {
            players[socket.id].x = movementData.x;
            players[socket.id].y = movementData.y;
            players[socket.id].flipX = movementData.flipX;
            socket.to('general').emit('playerMoved', players[socket.id]);
        }
    });

    socket.on('killPlayer', (targetId) => {
        if (players[socket.id] && players[socket.id].isImpostor) {
            if (players[targetId]) {
                players[targetId].isGhost = true;
                io.to('general').emit('playerKilled', targetId);
                io.to('general').emit('adminUpdate', { players, gameState });
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);

        if (Object.keys(players).length === 0) {
            gameState = 'LOBBY';
            stopCountdown();
        } else {
            checkLobbyStart();
        }
    });

    socket.on('reportBody', () => {
        gameState = 'MEETING';
        io.to('general').emit('startMeeting', { reportedBy: socket.id });
    });

    socket.on('triggerSabotage', (data) => {
        if (players[socket.id] && players[socket.id].isImpostor) {
            sabotageActive = true;
            sabotageType = data.type;
            io.to('general').emit('sabotageTriggered', data);
        }
    });

    socket.on('fixSabotage', () => {
        sabotageActive = false;
        sabotageType = null;
        io.to('general').emit('sabotageFixed');
    });

    socket.on('vote', (votedForId) => {
        if (!players[socket.id] || players[socket.id].voted || gameState !== 'MEETING') return;

        players[socket.id].voted = true;
        if (players[votedForId]) {
            players[votedForId].votes = (players[votedForId].votes || 0) + 1;
        }

        io.to('general').emit('voteCast', { from: socket.id, for: votedForId });

        // Check if all alive players voted
        const alivePlayers = Object.values(players).filter(p => !p.isGhost);
        const votedPlayers = alivePlayers.filter(p => p.voted);

        if (votedPlayers.length === alivePlayers.length) {
            processVotes();
        }
    });

    function processVotes() {
        const alivePlayers = Object.values(players).filter(p => !p.isGhost);
        let maxVotes = -1;
        let ejectedPlayer = null;
        let tie = false;

        alivePlayers.forEach(p => {
            if (p.votes > maxVotes) {
                maxVotes = p.votes;
                ejectedPlayer = p;
                tie = false;
            } else if (p.votes === maxVotes && maxVotes > 0) {
                tie = true;
            }
        });

        const result = {
            ejectedName: (tie || !ejectedPlayer || maxVotes === 0) ? "No one" : ejectedPlayer.name,
            isImpostor: ejectedPlayer ? ejectedPlayer.isImpostor : false,
            tie: tie
        };

        if (ejectedPlayer && !tie && maxVotes > 0) {
            ejectedPlayer.isGhost = true;
        }

        io.to('general').emit('meetingResult', result);

        // Reset votes
        Object.values(players).forEach(p => {
            p.voted = false;
            p.votes = 0;
        });

        setTimeout(() => {
            gameState = 'PLAYING';
            io.to('general').emit('updateGameState', { state: 'PLAYING' });
            checkWinConditions();
        }, 5000);
    }

    socket.on('taskCompleted', () => {
        if (players[socket.id]) {
            players[socket.id].tasksDone = (players[socket.id].tasksDone || 0) + 1;
            const crewCount = Object.values(players).filter(p => !p.isImpostor).length;
            const totalTasks = Math.max(1, crewCount * 4);
            const completedSoFar = Object.values(players).reduce((acc, p) => acc + (p.tasksDone || 0), 0);

            io.to('general').emit('taskProgress', {
                progress: Math.min(100, (completedSoFar / totalTasks) * 100)
            });
            io.to('general').emit('adminUpdate', { players, gameState });

            if (completedSoFar >= totalTasks && totalTasks > 0) {
                endGame('CREWMATES_WIN_TASKS');
            }
        }
    });

    function checkWinConditions() {
        const alive = Object.values(players).filter(p => !p.isGhost);
        const impostors = alive.filter(p => p.isImpostor);
        const crew = alive.filter(p => !p.isImpostor);

        if (impostors.length === 0) {
            endGame('CREWMATES_WIN_ELIMINATION');
        } else if (impostors.length >= crew.length) {
            endGame('IMPOSTORS_WIN');
        }
    }

    function endGame(reason) {
        gameState = 'GAME_OVER';
        io.to('general').emit('gameOver', { reason });

        // Reset after 10 seconds
        setTimeout(() => {
            gameState = 'LOBBY';
            Object.values(players).forEach(p => {
                p.isImpostor = false;
                p.isGhost = false;
                p.voted = false;
                p.votes = 0;
                p.tasksDone = 0;
            });
            io.to('general').emit('updateGameState', { state: 'LOBBY' });
        }, 10000);
    }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} (host 0.0.0.0)`);
});
