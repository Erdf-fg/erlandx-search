import Phaser from 'phaser';
import { io } from 'socket.io-client';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        this.socket = null;
        this.otherPlayers = null;
        this.player = null;
        this.tasks = [];
        this.isImpostor = false;
        this.isAdmin = false;
        this.selectedTask = null;
        this.selectedVent = null;
        this.selectedDoor = null;
        this.killCooldown = 0;
        this.isSabotaged = false;
        this.joystick = { x: 0, y: 0, active: false };
    }

    preload() {
        // Sounds
    }

    create() {
        this.otherPlayers = this.physics.add.group();

        // Dynamic server URL: use env var in production, localhost in dev
        const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
        this.socket = io(serverUrl);

        // Draw Map
        this.createMap();

        this.isGhost = false;
        this.isImpostor = false;
        this.gameState = 'LOBBY';

        // No keyboard controls for PC - Mobile only
        this.setupSocketListeners();
        this.createTasks();
        this.createVents();
        this.createSecuritySystem();
        this.createTouchControls();

        // Expose sound globally for task HTML
        window.playGameSound = (type) => this.playDigitalSound(type);

        // === LOBBY UI (Drawn in Phaser canvas for guaranteed visibility) ===
        this.lobbyStatusText = this.add.text(
            this.cameras.main.centerX, this.cameras.main.centerY - 80,
            'WAITING FOR CREW...', {
            fontSize: '28px', fontFamily: 'Orbitron', fill: '#a855f7',
            stroke: '#000', strokeThickness: 4, align: 'center'
        }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(9999).setVisible(false);

        this.lobbyTimerText = this.add.text(
            this.cameras.main.centerX, this.cameras.main.centerY,
            '--', {
            fontSize: '72px', fontFamily: 'Orbitron', fill: '#ffffff',
            stroke: '#6366f1', strokeThickness: 6, align: 'center'
        }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(9999).setVisible(false);

        this.lobbyPlayerCount = this.add.text(
            this.cameras.main.centerX, this.cameras.main.centerY + 60,
            'CREW: 0/15', {
            fontSize: '20px', fontFamily: 'Outfit', fill: '#94a3b8',
            stroke: '#000', strokeThickness: 3, align: 'center'
        }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(9999).setVisible(false);
    }

    createMap() {
        const bg = this.add.graphics();
        this.walls = this.physics.add.staticGroup();
        this.doors = this.physics.add.staticGroup();

        // Deep Space / Dark Floor
        bg.fillStyle(0x0a0a0a, 1);
        bg.fillRect(-2000, -2000, 4000, 4000);

        // Grid lines for "Digital" feel
        bg.lineStyle(1, 0x1e293b, 0.5);
        for (let i = -2000; i <= 2000; i += 80) {
            bg.moveTo(i, -2000); bg.lineTo(i, 2000);
            bg.moveTo(-2000, i); bg.lineTo(2000, i);
        }
        bg.strokePath();

        // Cafeteria
        this.drawRoomWithWalls(bg, -300, -300, 600, 600, 'Digital Cafe', 0x1e293b, ['top', 'bottom', 'left', 'right']);

        // Corridors
        this.drawCorridorWithWalls(bg, -60, -750, 120, 450); // North
        this.drawCorridorWithWalls(bg, -60, 300, 120, 450);  // South
        this.drawCorridorWithWalls(bg, -800, -60, 500, 120); // West
        this.drawCorridorWithWalls(bg, 300, -60, 500, 120);  // East

        // Outer Rooms
        this.drawRoomWithWalls(bg, -300, -1100, 600, 350, 'Server Mainframe', 0x312e81, ['bottom']);
        this.drawRoomWithWalls(bg, -300, 750, 600, 350, 'Security Hub', 0x1e1b4b, ['top']);
        this.drawRoomWithWalls(bg, -1100, -300, 300, 600, 'Coding Lab', 0x1e3a8a, ['right']);
        this.drawRoomWithWalls(bg, 800, -300, 300, 600, 'E-Library', 0x1e40af, ['left']);

        // Physical Lobby Room (Isolated)
        this.drawRoomWithWalls(bg, 2500, 2500, 400, 400, 'WAITING ROOM', 0x1e293b, []);

        // Add some lobby decorations
        bg.lineStyle(2, 0x6366f1, 0.3);
        for (let i = 0; i <= 400; i += 40) {
            bg.moveTo(2500 + i, 2500); bg.lineTo(2500 + i, 2900);
            bg.moveTo(2500, 2500 + i); bg.lineTo(2900, 2500 + i);
        }
        bg.strokePath();

        this.add.text(2700, 2600, 'GATHER HERE TO START MISSION', {
            fontSize: '24px', fontStyle: 'bold', fill: '#6366f1', fontFamily: 'Orbitron'
        }).setOrigin(0.5);

        // Doors at the gaps
        this.addDoor(0, -310, 120, 20, 'Cafe North');
        this.addDoor(0, 310, 120, 20, 'Cafe South');
        this.addDoor(-310, 0, 20, 120, 'Cafe West');
        this.addDoor(310, 0, 20, 120, 'Cafe East');

        bg.fillStyle(0x334155, 1);
        bg.fillRect(-100, -100, 200, 200);
        this.add.text(0, 0, 'MEETING TABLE', { fontSize: '12px', fill: '#60a5fa' }).setOrigin(0.5);

        this.physics.world.setBounds(-2000, -2000, 6000, 6000);
        this.cameras.main.setBounds(-2000, -2000, 6000, 6000);
    }

    drawRoomWithWalls(graphics, x, y, w, h, name, color, doorSides = []) {
        graphics.fillStyle(color, 0.6);
        graphics.fillRoundedRect(x, y, w, h, 20);
        const wallT = 20;
        const gap = 120;

        // Top Wall
        if (doorSides.includes('top')) {
            this.addWall(x, y, (w - gap) / 2, wallT);
            this.addWall(x + (w + gap) / 2, y, (w - gap) / 2, wallT);
        } else {
            this.addWall(x, y, w, wallT);
        }

        // Bottom Wall
        if (doorSides.includes('bottom')) {
            this.addWall(x, y + h - wallT, (w - gap) / 2, wallT);
            this.addWall(x + (w + gap) / 2, y + h - wallT, (w - gap) / 2, wallT);
        } else {
            this.addWall(x, y + h - wallT, w, wallT);
        }

        // Left Wall
        if (doorSides.includes('left')) {
            this.addWall(x, y, wallT, (h - gap) / 2);
            this.addWall(x, y + (h + gap) / 2, wallT, (h - gap) / 2);
        } else {
            this.addWall(x, y, wallT, h);
        }

        // Right Wall
        if (doorSides.includes('right')) {
            this.addWall(x + w - wallT, y, wallT, (h - gap) / 2);
            this.addWall(x + w - wallT, y + (h + gap) / 2, wallT, (h - gap) / 2);
        } else {
            this.addWall(x + w - wallT, y, wallT, h);
        }

        this.add.text(x + w / 2, y + 40, name, {
            fontSize: '28px', fontFamily: 'Orbitron', fill: '#ffffff', stroke: '#000', strokeThickness: 4
        }).setOrigin(0.5);
    }

    addDoor(x, y, w, h, name) {
        const door = this.add.rectangle(x, y, w, h, 0x6366f1, 0.8);
        this.physics.add.existing(door, true);
        this.doors.add(door);
        door.setData('name', name);
    }

    drawCorridorWithWalls(graphics, x, y, w, h) {
        graphics.fillStyle(0x475569, 0.4);
        graphics.fillRect(x, y, w, h);
        const wallThickness = 10;
        if (w > h) { // Horizontal
            this.addWall(x, y, w, wallThickness);
            this.addWall(x, y + h - wallThickness, w, wallThickness);
        } else { // Vertical
            this.addWall(x, y, wallThickness, h);
            this.addWall(x + w - wallThickness, y, wallThickness, h);
        }
    }

    addWall(x, y, w, h) {
        const wall = this.add.rectangle(x + w / 2, y + h / 2, w, h, 0x475569, 0.5);
        this.walls.add(wall);
    }

    createTasks() {
        const taskPoints = [
            { x: 0, y: -900, name: 'Adoption Strategy' },    // Server Room
            { x: -950, y: 0, name: 'Challenge Survey' },     // Coding Lab
            { x: 950, y: 0, name: 'Impact Survey' },         // E-Library
            { x: 0, y: 925, name: 'Future Perspectives' }    // Security Hub
        ];

        this.taskGroup = this.physics.add.staticGroup();

        taskPoints.forEach(p => {
            // Task visual: a glowing disk
            const taskVisual = this.add.graphics();
            taskVisual.fillStyle(0xffff00, 0.8);
            taskVisual.fillCircle(0, 0, 25);
            taskVisual.lineStyle(2, 0xffffff, 1);
            taskVisual.strokeCircle(0, 0, 25);

            const container = this.add.container(p.x, p.y, [taskVisual]);
            this.taskGroup.add(container);
            container.body.setCircle(25);
            container.setData('name', p.name);
            container.setData('completed', false);

            this.add.text(p.x, p.y + 40, p.name, { fontSize: '14px', fill: '#ffff00' }).setOrigin(0.5);
        });

        this.setupMobileControls();
    }

    createVents() {
        this.vents = this.physics.add.staticGroup();
        const ventPositions = [
            { x: -200, y: -1000, id: 1 }, // Server Room
            { x: 950, y: 200, id: 2 },    // Library
            { x: -950, y: 200, id: 3 },   // Coding Lab
            { x: 200, y: 1000, id: 4 },   // Security
            { x: 200, y: 200, id: 5 }     // Cafe
        ];

        ventPositions.forEach(v => {
            const ventGfx = this.add.graphics();
            ventGfx.fillStyle(0x333333, 1);
            ventGfx.fillRect(-20, -10, 40, 20);
            ventGfx.lineStyle(2, 0x666666, 1);
            ventGfx.strokeRect(-20, -10, 40, 20);

            const vent = this.add.container(v.x, v.y, [ventGfx]);
            this.vents.add(vent);
            vent.body.setSize(40, 20);
            vent.setData('id', v.id);
        });
    }

    createSecuritySystem() {
        // Security Monitor Station positioned inside Security Hub
        const monitorGfx = this.add.graphics();
        monitorGfx.fillStyle(0x00ff00, 0.7);
        monitorGfx.fillRect(-30, -20, 60, 40);
        monitorGfx.lineStyle(2, 0xffffff, 1);
        monitorGfx.strokeRect(-30, -20, 60, 40);

        this.securityStation = this.add.container(0, 950, [monitorGfx]);
        this.physics.add.existing(this.securityStation);
        this.securityStation.body.setSize(60, 40);
        this.add.text(0, 910, 'CAMERAS', { fontSize: '14px', fill: '#00ff00' }).setOrigin(0.5);
    }

    setupMobileControls() {
        if (!this.sys.game.device.input.touch) return;

        // Joystick Base
        const joyBase = this.add.graphics();
        joyBase.fillStyle(0xffffff, 0.2);
        joyBase.fillCircle(0, 0, 60);
        joyBase.lineStyle(2, 0xffffff, 0.5);
        joyBase.strokeCircle(0, 0, 60);

        // Joystick Thumb
        const joyThumb = this.add.graphics();
        joyThumb.fillStyle(0xffffff, 0.5);
        joyThumb.fillCircle(0, 0, 30);

        this.joyContainer = this.add.container(120, window.innerHeight - 120, [joyBase, joyThumb]).setScrollFactor(0).setDepth(1000);

        this.input.on('pointerdown', (pointer) => {
            if (pointer.x < 300) {
                this.joystick.active = true;
                this.joyContainer.setPosition(pointer.x, pointer.y);
            }
        });

        this.input.on('pointermove', (pointer) => {
            if (this.joystick.active) {
                const dist = Phaser.Math.Distance.Between(this.joyContainer.x, this.joyContainer.y, pointer.x, pointer.y);
                const angle = Phaser.Math.Angle.Between(this.joyContainer.x, this.joyContainer.y, pointer.x, pointer.y);
                const limit = 60;

                const moveDist = Math.min(dist, limit);
                joyThumb.setPosition(Math.cos(angle) * moveDist, Math.sin(angle) * moveDist);

                this.joystick.x = Math.cos(angle) * (moveDist / limit);
                this.joystick.y = Math.sin(angle) * (moveDist / limit);
            }
        });

        this.input.on('pointerup', () => {
            this.joystick.active = false;
            this.joystick.x = 0;
            this.joystick.y = 0;
            joyThumb.setPosition(0, 0);
            this.joyContainer.setPosition(120, window.innerHeight - 120);
        });
    }

    joinGame(name, isAdmin = false) {
        this.isAdmin = isAdmin;
        this.socket.emit('joinGame', { name, color: isAdmin ? '#ffff00' : this.getRandomColor(), isAdmin });
    }

    setupSocketListeners() {
        this.socket.on('currentPlayers', (players) => {
            Object.keys(players).forEach((id) => {
                if (players[id].id === this.socket.id) {
                    this.addPlayer(players[id]);
                } else {
                    this.addOtherPlayers(players[id]);
                }
            });
        });

        this.socket.on('newPlayer', (playerInfo) => {
            this.addOtherPlayers(playerInfo);
        });

        this.socket.on('playerMoved', (playerInfo) => {
            this.otherPlayers.getChildren().forEach((otherPlayer) => {
                if (playerInfo.id === otherPlayer.playerId) {
                    otherPlayer.setPosition(playerInfo.x, playerInfo.y);
                    if (playerInfo.flipX !== undefined) {
                        otherPlayer.container.list[0].scaleX = playerInfo.flipX ? -1 : 1;
                    }
                }
            });
        });

        this.socket.on('playerDisconnected', (playerId) => {
            this.otherPlayers.getChildren().forEach((otherPlayer) => {
                if (playerId === otherPlayer.playerId) {
                    otherPlayer.destroy();
                }
            });
        });

        this.socket.on('playerCount', (count) => {
            const joinBtn = document.getElementById('join-btn');
            if (joinBtn) joinBtn.innerText = `START MISSION (${count}/15)`;
            // Update Phaser canvas lobby UI
            if (this.lobbyPlayerCount) this.lobbyPlayerCount.setText(`CREW: ${count}/15`);
        });

        this.socket.on('lobbyCountdown', (seconds) => {
            if (seconds !== null) {
                // Show lobby UI in Phaser canvas
                if (this.lobbyTimerText) {
                    this.lobbyTimerText.setText(`${seconds}`).setVisible(true);
                }
                if (this.lobbyStatusText) {
                    this.lobbyStatusText.setText(seconds > 0 ? 'GAME STARTING IN...' : 'GO!').setVisible(true);
                }
                if (this.lobbyPlayerCount) this.lobbyPlayerCount.setVisible(true);
                this.playDigitalSound('step');
            } else {
                if (this.lobbyTimerText) this.lobbyTimerText.setText('--').setVisible(false);
                if (this.lobbyStatusText) this.lobbyStatusText.setVisible(false);
                if (this.lobbyPlayerCount) this.lobbyPlayerCount.setVisible(false);
            }
        });

        this.socket.on('gameStarted', (data) => {
            this.isImpostor = data.isImpostor;
            this.gameState = 'PLAYING';

            // Hide lobby canvas UI
            if (this.lobbyTimerText) this.lobbyTimerText.setVisible(false);
            if (this.lobbyStatusText) this.lobbyStatusText.setVisible(false);
            if (this.lobbyPlayerCount) this.lobbyPlayerCount.setVisible(false);

            // Hide HTML overlays
            const waitUI = document.getElementById('lobby-waiting-overlay');
            if (waitUI) waitUI.style.display = 'none';

            // Teleport to Cafe
            if (this.player) {
                this.player.setPosition(0, 0);
            }

            this.showRoleAnnouncement();
            if (this.isImpostor) {
                this.setButtonVisibility('KILL', true);
                this.setButtonVisibility('SABOTAGE', true);
                this.setButtonVisibility('VENT', true);
            }
        });

        this.socket.on('taskProgress', (data) => {
            const fill = document.getElementById('task-bar-fill');
            if (fill) fill.style.width = `${data.progress}%`;
        });

        this.socket.on('playerKilled', (targetId) => {
            if (targetId === this.socket.id) {
                this.isGhost = true;
                const data = this.player.playerData;
                this.player.destroy();
                this.addPlayer({ ...data, isGhost: true });
                this.instructionText.setText('YOU WERE KILLED! You are now a ghost.');
            }
            this.otherPlayers.getChildren().forEach(p => {
                if (p.playerId === targetId) {
                    const data = p.playerData;
                    p.destroy();
                    this.addOtherPlayers({ ...data, isGhost: true });
                }
            });
        });

        this.socket.on('startMeeting', (meetingData) => {
            this.showMeetingOverlay(meetingData);
            this.playDigitalSound('meeting');
        });

        this.socket.on('meetingResult', (data) => {
            this.showMeetingResult(data);
            this.playDigitalSound('task');
        });

        this.socket.on('taskProgress', (data) => {
            document.getElementById('task-bar-fill').style.width = `${data.progress}%`;
        });

        this.socket.on('gameOver', (data) => {
            this.showGameOver(data);
        });

        this.socket.on('updateGameState', (data) => {
            if (data.state === 'PLAYING') {
                document.getElementById('meeting-overlay').classList.add('hidden');
            }
        });

        this.socket.on('sabotageTriggered', (data) => {
            this.handleSabotage(data);
            this.playDigitalSound('meeting');
        });

        this.socket.on('sabotageFixed', () => {
            this.isSabotaged = false;
            this.cameras.main.setAlpha(1);
            this.instructionText.setText('SABOTAGE FIXED! Navigation restored.');
            this.playDigitalSound('task');
        });
    }

    handleSabotage(data) {
        this.isSabotaged = true;
        if (data.type === 'LIGHTS') {
            this.cameras.main.setAlpha(0.2); // Visual effect of lights out
            this.instructionText.setText('SYSTEM ALERT: LIGHTS SABOTAGED! Repair in Security Hub.');
        }
    }

    showMeetingResult(data) {
        const overlay = document.getElementById('meeting-overlay');
        const grid = document.getElementById('player-grid');
        grid.innerHTML = `<h2 style="color:var(--primary); font-size: 2rem;">${data.ejectedName} was ejected.</h2>
                          <p style="color:var(--secondary)">${data.isImpostor ? "They were the Impostor." : "They were NOT the Impostor."}</p>`;

        this.time.delayedCall(4000, () => {
            overlay.classList.add('hidden');
        });
    }

    showGameOver(data) {
        const overlay = document.getElementById('game-over-overlay');
        const winText = document.getElementById('win-text');
        const winReason = document.getElementById('win-reason');

        let isVictory = false;
        if (data.reason.startsWith('CREWMATES') && !this.isImpostor) isVictory = true;
        if (data.reason.startsWith('IMPOSTORS') && this.isImpostor) isVictory = true;

        winText.innerText = isVictory ? 'VICTORY' : 'DEFEAT';
        winText.style.color = isVictory ? 'var(--success)' : 'var(--danger)';
        winReason.innerText = data.reason.replace(/_/g, ' ');

        overlay.classList.remove('hidden');
    }

    showMeetingOverlay(data) {
        const overlay = document.getElementById('meeting-overlay');
        const grid = document.getElementById('player-grid');
        grid.innerHTML = '';
        overlay.classList.remove('hidden');

        // Logic to list players and allow voting
        const players = { ...this.players, [this.socket.id]: { name: 'Me' } }; // Simplified
        // Actually we should track all players in the scene
        const allPlayerIds = [this.socket.id, ...this.otherPlayers.getChildren().map(p => p.playerId)];

        allPlayerIds.forEach(id => {
            const btn = document.createElement('button');
            btn.innerText = id === this.socket.id ? 'ME' : 'PLAYER ' + id.substring(0, 4);
            btn.style.margin = '5px';
            btn.onclick = () => {
                this.socket.emit('vote', id);
                overlay.classList.add('hidden');
            };
            grid.appendChild(btn);
        });
    }

    addPlayer(playerInfo) {
        // Among Us Player Design
        const charContainer = this.drawAmongUsCharacter(playerInfo.color, playerInfo.name, playerInfo.isGhost);

        this.player = charContainer;
        this.player.setPosition(playerInfo.x, playerInfo.y);
        this.player.playerData = playerInfo; // Store for redraws
        this.physics.add.existing(this.player);
        this.physics.add.collider(this.player, this.walls);
        this.physics.add.collider(this.player, this.doors);
        this.player.body.setCollideWorldBounds(true);
        this.player.body.setSize(50, 70);
        this.player.body.setOffset(-25, -35);

        if (playerInfo.isGhost) {
            this.player.body.setAllowGravity(false);
            this.player.body.setImmovable(false);
        }

        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // Collision with tasks
        this.physics.add.overlap(this.player, this.taskGroup, (player, task) => {
            this.selectedTask = task;
        }, null, this);

        // Overlap with vents (Impostor only)
        this.physics.add.overlap(this.player, this.vents, (player, vent) => {
            if (this.isImpostor) {
                this.selectedVent = vent;
            }
        }, null, this);

        // Overlap with doors
        this.physics.add.overlap(this.player, this.doors, (player, door) => {
            this.selectedDoor = door;
        }, null, this);

        // Overlap with security cameras
        this.physics.add.overlap(this.player, this.securityStation, () => {
            if (!this.isGhost) {
                this.atSecurity = true;
            }
        }, null, this);
    }

    addOtherPlayers(playerInfo) {
        const charContainer = this.drawAmongUsCharacter(playerInfo.color, playerInfo.name, playerInfo.isGhost);
        charContainer.playerId = playerInfo.id;
        charContainer.playerData = playerInfo;
        this.otherPlayers.add(charContainer);
    }

    drawAmongUsCharacter(colorStr, name, isGhost = false) {
        const color = Phaser.Display.Color.HexStringToColor(colorStr).color;
        const graphics = this.add.graphics();
        const alpha = isGhost ? 0.4 : 1;

        // Backpack
        graphics.fillStyle(color, alpha);
        graphics.fillRoundedRect(-35, -15, 20, 40, 5);
        graphics.lineStyle(3, 0x000000, alpha);
        graphics.strokeRoundedRect(-35, -15, 20, 40, 5);

        // Body
        graphics.fillStyle(color, alpha);
        graphics.fillRoundedRect(-25, -35, 50, 70, 20);
        graphics.lineStyle(3, 0x000000, alpha);
        graphics.strokeRoundedRect(-25, -35, 50, 70, 20);

        if (!isGhost) {
            // Legs
            graphics.fillRoundedRect(-25, 20, 20, 20, 5);
            graphics.strokeRoundedRect(-25, 20, 20, 20, 5);
            graphics.fillRoundedRect(5, 20, 20, 20, 5);
            graphics.strokeRoundedRect(5, 20, 20, 20, 5);
        } else {
            // Wavy ghost bottom
            graphics.fillTriangle(-25, 35, 0, 55, 25, 35);
        }

        // Visor
        graphics.fillStyle(0xadd8e6, alpha);
        graphics.fillRoundedRect(0, -20, 30, 25, 10);
        graphics.lineStyle(2, 0x000000, alpha);
        graphics.strokeRoundedRect(0, -20, 30, 25, 10);

        const nameTag = this.add.text(0, -55, name, {
            fontSize: '16px',
            fill: isGhost ? '#aaaaaa' : '#fff',
            stroke: '#000',
            strokeThickness: 3
        }).setOrigin(0.5);

        const container = this.add.container(0, 0, [graphics, nameTag]);
        return container;
    }

    createTouchControls() {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;

        // Joystick (Visible)
        const joyBase = this.add.circle(120, screenH - 120, 60, 0xffffff, 0.2).setScrollFactor(0).setDepth(2000).setStrokeStyle(2, 0xffffff, 0.5);
        const joyThumb = this.add.circle(120, screenH - 120, 30, 0xffffff, 0.5).setScrollFactor(0).setDepth(2001);

        this.input.on('pointerdown', (p) => {
            if (p.x < 300 && p.y > screenH - 300) {
                this.joystick.active = true;
                joyBase.setPosition(p.x, p.y);
                joyThumb.setPosition(p.x, p.y);
            }
        });

        this.input.on('pointermove', (p) => {
            if (this.joystick.active) {
                const dist = Phaser.Math.Distance.Between(joyBase.x, joyBase.y, p.x, p.y);
                const angle = Phaser.Math.Angle.Between(joyBase.x, joyBase.y, p.x, p.y);
                const limit = 60;
                const moveDist = Math.min(dist, limit);

                joyThumb.setPosition(joyBase.x + Math.cos(angle) * moveDist, joyBase.y + Math.sin(angle) * moveDist);
                this.joystick.x = Math.cos(angle) * (moveDist / limit);
                this.joystick.y = Math.sin(angle) * (moveDist / limit);
            }
        });

        this.input.on('pointerup', () => {
            this.joystick.active = false;
            this.joystick.x = 0;
            this.joystick.y = 0;
            joyThumb.setPosition(joyBase.x, joyBase.y);
        });

        // Action Buttons
        this.actionButtons = {};
        const btnData = [
            { id: 'USE', x: screenW - 100, y: screenH - 100, color: 0x6366f1, icon: '⚡' },
            { id: 'REPORT', x: screenW - 220, y: screenH - 80, color: 0xef4444, icon: '📢' },
            { id: 'KILL', x: screenW - 100, y: screenH - 220, color: 0x991b1b, icon: '🔪' },
            { id: 'SABOTAGE', x: screenW - 220, y: screenH - 200, color: 0x1e293b, icon: '🛠️' },
            { id: 'VENT', x: screenW - 100, y: screenH - 340, color: 0x3f3f46, icon: '🕳️' }
        ];

        btnData.forEach(b => {
            const btn = this.add.circle(b.x, b.y, 45, b.color, 0.8).setScrollFactor(0).setDepth(2000).setInteractive();
            const text = this.add.text(b.x, b.y, b.icon, { fontSize: '32px' }).setOrigin(0.5).setScrollFactor(0).setDepth(2001);
            const label = this.add.text(b.x, b.y + 35, b.id, { fontSize: '12px', fill: '#fff' }).setOrigin(0.5).setScrollFactor(0).setDepth(2001);

            btn.on('pointerdown', () => this.handleAction(b.id));
            this.actionButtons[b.id] = { btn, text, label };

            // Hide Impostor specific buttons initially
            if (['KILL', 'SABOTAGE', 'VENT'].includes(b.id)) {
                this.setButtonVisibility(b.id, false);
            }
        });
    }

    setButtonVisibility(id, visible) {
        if (!this.actionButtons[id]) return;
        this.actionButtons[id].btn.visible = visible;
        this.actionButtons[id].text.visible = visible;
        this.actionButtons[id].label.visible = visible;
    }

    updateActionButton(id, active) {
        if (!this.actionButtons[id]) return;
        this.actionButtons[id].btn.setAlpha(active ? 1 : 0.3);
    }

    handleAction(id) {
        if (id === 'USE') {
            if (this.selectedDoor) {
                this.toggleDoor(this.selectedDoor);
            } else if (this.selectedTask) {
                this.startTask(this.selectedTask);
            } else if (this.atSecurity) {
                this.openSecurityView();
            }
        } else if (id === 'REPORT') {
            this.socket.emit('reportBody');
        } else if (id === 'KILL') {
            this.attemptKill();
        } else if (id === 'SABOTAGE') {
            this.socket.emit('triggerSabotage', { type: 'LIGHTS' });
        } else if (id === 'VENT') {
            this.toggleVent(this.selectedVent);
        }
    }

    update() {
        if (this.player && !this.isGhost) {
            let vx = 0;
            let vy = 0;
            const speed = 300;

            if (this.joystick.active) {
                vx = this.joystick.x * speed;
                vy = this.joystick.y * speed;

                // Simple Walk Bobbing
                this.player.list[0].y = Math.sin(this.time.now / 100) * 5;
                if (Math.floor(this.time.now / 200) % 2 === 0 && !this.stepSoundActive) {
                    this.playDigitalSound('step');
                    this.stepSoundActive = true;
                } else if (Math.floor(this.time.now / 200) % 2 !== 0) {
                    this.stepSoundActive = false;
                }
            } else {
                this.player.list[0].y = 0;
            }

            this.player.body.setVelocity(vx, vy);

            if (vx < 0) this.player.list[0].scaleX = -1;
            else if (vx > 0) this.player.list[0].scaleX = 1;

            this.socket.emit('playerMovement', {
                x: this.player.x,
                y: this.player.y,
                flipX: this.player.list[0].scaleX === -1
            });

            // Action Button Status Updates - Reset indicators
            this.selectedDoor = null;
            this.selectedTask = null;
            this.selectedVent = null;
            this.atSecurity = false;

            // Flags will be re-set by overlap callbacks in this frame
            this.physics.overlap(this.player, this.doors, (p, d) => { this.selectedDoor = d; });
            this.physics.overlap(this.player, this.taskGroup, (p, t) => { this.selectedTask = t; });
            this.physics.overlap(this.player, this.vents, (p, v) => { if (this.isImpostor) this.selectedVent = v; });
            this.physics.overlap(this.player, this.securityStation, () => { if (!this.isGhost) this.atSecurity = true; });

            if (this.selectedDoor || this.selectedTask || this.atSecurity) {
                this.updateActionButton('USE', true);
            } else {
                this.updateActionButton('USE', false);
            }

            if (this.selectedVent && this.isImpostor) {
                this.updateActionButton('VENT', true);
            } else if (this.isImpostor) {
                this.updateActionButton('VENT', false);
            }

            if (this.isCompletingTask) {
                vx = 0;
                vy = 0;
            }
        } else if (this.isGhost) {
            let vx = 0, vy = 0;
            const speed = 400;
            if (this.joystick.active) {
                vx = this.joystick.x * speed;
                vy = this.joystick.y * speed;
            }
            this.player.body.setVelocity(vx, vy);
            this.socket.emit('playerMovement', { x: this.player.x, y: this.player.y });
        }

        // Update Cooldowns
        if (this.killCooldown > 0) {
            this.killCooldown -= this.game.loop.delta;
            if (this.killCooldown <= 0) {
                this.killCooldown = 0;
                if (this.killBtn) {
                    this.killBtn.setText('KILL (Q)');
                    this.killBtn.setStyle({ fill: '#ff0000' });
                }
            } else {
                this.updateKillButtonUI();
            }
        }
    }

    showRoleAnnouncement() {
        // === AMONG US STYLE ROLE REVEAL ANIMATION ===
        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY;
        const w = this.cameras.main.width;
        const h = this.cameras.main.height;

        // 1. Full-screen black overlay
        const overlay = this.add.rectangle(cx, cy, w, h, 0x000000, 0)
            .setScrollFactor(0).setDepth(10000);

        // 2. Colored banner strip (red for impostor, blue for crewmate)
        const bannerColor = this.isImpostor ? 0xef4444 : 0x3b82f6;
        const banner = this.add.rectangle(cx, cy, w, 0, bannerColor, 0.9)
            .setScrollFactor(0).setDepth(10001);

        // 3. Role silhouette (Among Us character shape)
        const silhouette = this.add.graphics().setScrollFactor(0).setDepth(10002);
        const silColor = this.isImpostor ? 0xff0000 : 0x3b82f6;
        silhouette.setAlpha(0);
        // Body
        silhouette.fillStyle(silColor, 1);
        silhouette.fillRoundedRect(cx - 35, cy - 50, 70, 80, 20);
        // Visor
        silhouette.fillStyle(0x93c5fd, 1);
        silhouette.fillRoundedRect(cx - 5, cy - 40, 40, 25, 10);
        // Legs
        silhouette.fillStyle(silColor, 1);
        silhouette.fillRoundedRect(cx - 30, cy + 30, 25, 25, 5);
        silhouette.fillRoundedRect(cx + 5, cy + 30, 25, 25, 5);
        // Backpack
        silhouette.fillRoundedRect(cx - 50, cy - 30, 20, 50, 8);

        // 4. Role text
        const roleText = this.isImpostor ? 'IMPOSTOR' : 'CREWMATE';
        const roleColor = this.isImpostor ? '#ff4444' : '#60a5fa';
        const title = this.add.text(cx, cy + 90, roleText, {
            fontSize: '56px', fontFamily: 'Orbitron', fill: roleColor,
            stroke: '#000', strokeThickness: 8, letterSpacing: 12
        }).setOrigin(0.5).setScrollFactor(0).setDepth(10003).setAlpha(0);

        // 5. Description text
        const descStr = this.isImpostor
            ? 'Sabotage & eliminate the crewmates.\nDon\'t get caught!'
            : 'Complete all digital tasks.\nFind the impostor among you!';
        const desc = this.add.text(cx, cy + 140, descStr, {
            fontSize: '16px', fontFamily: 'Outfit', fill: '#ffffff',
            stroke: '#000', strokeThickness: 3, align: 'center'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(10003).setAlpha(0);

        // 6. "Shhh" text for impostor
        let shhText = null;
        if (this.isImpostor) {
            shhText = this.add.text(cx, cy - 100, 'Shhhhh!', {
                fontSize: '32px', fontFamily: 'cursive', fill: '#ffffff',
                stroke: '#000', strokeThickness: 4
            }).setOrigin(0.5).setScrollFactor(0).setDepth(10003).setAlpha(0);
        }

        // === ANIMATION SEQUENCE ===
        // Step 1: Fade in black overlay (0 → 0.5s)
        this.tweens.add({
            targets: overlay, alpha: 0.95, duration: 500, ease: 'Power2'
        });

        // Step 2: Expand banner (0.3s → 1s)
        this.tweens.add({
            targets: banner, height: 280, delay: 300, duration: 700, ease: 'Back.easeOut'
        });

        // Step 3: Fade in silhouette (0.6s → 1.2s)
        this.tweens.add({
            targets: silhouette, alpha: 1, delay: 600, duration: 600, ease: 'Power2'
        });

        // Step 4: Slam in title text (1s → 1.3s)
        title.setScale(3);
        this.tweens.add({
            targets: title, alpha: 1, scaleX: 1, scaleY: 1,
            delay: 1000, duration: 300, ease: 'Back.easeOut',
            onStart: () => {
                this.playDigitalSound(this.isImpostor ? 'kill' : 'task');
            }
        });

        // Step 5: Fade in description (1.3s)
        this.tweens.add({
            targets: desc, alpha: 1, delay: 1300, duration: 500, ease: 'Power2'
        });

        // Step 6: Shhh text for impostor
        if (shhText) {
            this.tweens.add({
                targets: shhText, alpha: 1, y: cy - 110,
                delay: 1500, duration: 800, ease: 'Sine.easeInOut',
                yoyo: true, hold: 500
            });
        }

        // Step 7: Fade everything out after 4 seconds
        this.time.delayedCall(4000, () => {
            this.tweens.add({
                targets: [overlay, banner, silhouette, title, desc, shhText].filter(Boolean),
                alpha: 0, duration: 800, ease: 'Power2',
                onComplete: () => {
                    overlay.destroy();
                    banner.destroy();
                    silhouette.destroy();
                    title.destroy();
                    desc.destroy();
                    if (shhText) shhText.destroy();
                }
            });
        });
    }

    attemptKill() {
        if (this.killCooldown > 0) return;

        let closestPlayer = null;
        let minDist = 100;

        this.otherPlayers.getChildren().forEach(p => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, p.x, p.y);
            if (dist < minDist && !p.isGhost) {
                minDist = dist;
                closestPlayer = p;
            }
        });

        if (closestPlayer) {
            this.socket.emit('killPlayer', closestPlayer.playerId);
            this.playDigitalSound('kill');
            this.killCooldown = 30000; // 30 seconds
            this.updateKillButtonUI();
        }
    }

    updateKillButtonUI() {
        if (this.killBtn) {
            this.killBtn.setText(`KILL (Q) ${Math.ceil(this.killCooldown / 1000)}s`);
            this.killBtn.setStyle({ fill: '#444444' });
        }
    }

    addKillButton() {
        this.killBtn = this.add.text(window.innerWidth - 100, window.innerHeight - 100, 'KILL (Q)', {
            fontSize: '24px',
            fill: '#ff0000',
            backgroundColor: '#00000088',
            padding: 10
        }).setScrollFactor(0).setInteractive().on('pointerdown', () => this.attemptKill()).setDepth(200);
    }


    addMobileControls() {
        // Report Button (R)
        this.add.text(window.innerWidth - 150, 40, 'REPORT (R)', {
            fontSize: '20px',
            fill: '#ffffff',
            backgroundColor: '#ff0000aa',
            padding: { x: 15, y: 10 }
        }).setScrollFactor(0).setInteractive().on('pointerdown', () => this.socket.emit('reportBody')).setDepth(200);
    }

    startTask(task) {
        if (task.getData('completed')) return;

        const overlay = document.getElementById('task-overlay');
        const title = document.getElementById('task-title');
        const body = document.getElementById('task-body');

        title.innerText = task.getData('name');
        body.innerHTML = this.getTaskPuzzleContent(task.getData('name'));
        overlay.classList.remove('hidden');

        // Logic to detect completion from HTML
        const checkCompletion = setInterval(() => {
            const html = body.innerHTML;
            if (html.includes('COMPLETE') || html.includes('SUCCESS') || html.includes('SUBMITTED') || html.includes('REGISTERED')) {
                clearInterval(checkCompletion);
                task.setData('completed', true);
                this.socket.emit('taskCompleted');
                this.playDigitalSound('task');

                // Visual update for completed task
                const graphics = task.list[0];
                graphics.clear();
                graphics.fillStyle(0x22c55e, 0.8);
                graphics.fillCircle(0, 0, 25);
                graphics.lineStyle(2, 0xffffff, 1);
                graphics.strokeCircle(0, 0, 25);

                this.instructionText.setText('TASK COMPLETED!');
            }
        }, 500);

        // Stop movement
        this.player.body.setVelocity(0, 0);
        this.isCompletingTask = true;
        this.joystick.active = false;

        document.getElementById('close-task-btn').onclick = () => {
            clearInterval(checkCompletion);
            overlay.classList.add('hidden');
            this.isCompletingTask = false;
        };
    }

    getTaskPuzzleContent(taskName) {
        if (taskName === 'Adoption Strategy') {
            return `
                <div style="color: #60a5fa; margin-bottom: 10px;">★ TASK: Reflective Choice</div>
                <p style="font-size: 0.9rem; margin-bottom: 15px;">Which strategy is most vital for adopting digital education in Indonesia?</p>
                <div style="display: grid; gap: 10px;">
                    <button onclick="window.playGameSound('task'); this.parentElement.innerHTML='<h3 style=\'color:var(--success)\'>REGISTERED: Infrastructure</h3>'" style="background:#334155">Expand Digital Infrastructure</button>
                    <button onclick="window.playGameSound('task'); this.parentElement.innerHTML='<h3 style=\'color:var(--success)\'>REGISTERED: Teacher Dev</h3>'" style="background:#334155">Teacher Training & Development</button>
                    <button onclick="window.playGameSound('task'); this.parentElement.innerHTML='<h3 style=\'color:var(--success)\'>REGISTERED: Local Content</h3>'" style="background:#334155">Develop Localized Content</button>
                    <button onclick="window.playGameSound('task'); this.parentElement.innerHTML='<h3 style=\'color:var(--success)\'>REGISTERED: Partnerships</h3>'" style="background:#334155">Foster Public-Private Partnerships</button>
                </div>
            `;
        }
        if (taskName === 'Challenge Survey') {
            return `
                <div style="color: #60a5fa; margin-bottom: 10px;">★ TASK: Challenge Analysis</div>
                <p style="font-size: 0.9rem; margin-bottom: 15px;">Which implementation challenge is most significant in your experience?</p>
                <div style="display: grid; gap: 10px;">
                    <button onclick="window.playGameSound('task'); this.parentElement.innerHTML='<h3 style=\'color:var(--success)\'>SUBMITTED: Infrastructure Gaps</h3>'" style="background:#334155">Infrastructure Gaps (Internet/Devices)</button>
                    <button onclick="window.playGameSound('task'); this.parentElement.innerHTML='<h3 style=\'color:var(--success)\'>SUBMITTED: Digital Divide</h3>'" style="background:#334155">Digital Divide (Literacy/Access)</button>
                </div>
                <p style="font-size: 0.7rem; color: #94a3b8; margin-top: 10px;">Note: Disparities in literacy exacerbate today's inequalities.</p>
            `;
        }
        if (taskName === 'Future Perspectives') {
            return `
                <div style="color: #60a5fa; margin-bottom: 10px;">★ TASK: Future Essay</div>
                <p style="font-size: 0.8rem; margin-bottom: 10px;">Briefly describe how "Hyper-personalized AI Tutors" could impact your learning experience.</p>
                <textarea id="essay-input" placeholder="Type your thoughts..." style="width:100%; height:80px; background:#000; color:#fff; border:1px solid #334155; padding:10px; border-radius:5px;"></textarea>
                <button onclick="if(document.getElementById('essay-input').value.length > 3){ window.playGameSound('task'); this.parentElement.innerHTML='<h3 style=\'color:var(--success)\'>SUBMITTED: Future Vision Recorded.</h3>'}" 
                    style="margin-top:10px; background:var(--primary); width: 100%;">SUBMIT RESPONSE</button>
            `;
        }
        return `
            <div style="color: #60a5fa; margin-bottom: 10px;">★ TASK: Impact Survey</div>
            <p style="font-size: 0.8rem; margin-bottom: 15px;">Which impact of global digital education do you find most profound?</p>
            <div style="display: grid; gap: 10px;">
                <button onclick="window.playGameSound('task'); this.parentElement.innerHTML='<h3 style=\'color:var(--success)\'>REGISTERED: Engagement</h3>'" style="background:#334155">Improved Student Engagement</button>
                <button onclick="window.playGameSound('task'); this.parentElement.innerHTML='<h3 style=\'color:var(--success)\'>REGISTERED: Outcomes</h3>'" style="background:#334155">Better Learning Outcomes</button>
                <button onclick="window.playGameSound('task'); this.parentElement.innerHTML='<h3 style=\'color:var(--success)\'>REGISTERED: Ecosystem</h3>'" style="background:#334155">Effective Educational Ecosystem</button>
            </div>
        `;
    }

    toggleVent(vent) {
        if (!vent) return;

        // Find next vent in sequence
        const currentId = vent.getData('id');
        const nextId = (currentId % 5) + 1;

        const nextVent = this.vents.getChildren().find(v => v.getData('id') === nextId);
        if (nextVent) {
            this.player.setPosition(nextVent.x, nextVent.y);
            this.playDigitalSound('step');
        }
    }

    toggleDoor(door) {
        if (!door) return;
        const name = door.getData('name');

        // Visual "Opening" - disable collision and change alpha
        door.body.setEnable(false);
        door.setAlpha(0.2);
        this.playDigitalSound('task');

        // Close after 3 seconds
        this.time.delayedCall(3000, () => {
            door.body.setEnable(true);
            door.setAlpha(0.8);
            this.playDigitalSound('step');
        });
    }

    openSecurityView() {
        if (this.isSabotaged) {
            this.socket.emit('fixSabotage');
            return;
        }

        const overlay = document.getElementById('task-overlay');
        const title = document.getElementById('task-title');
        const body = document.getElementById('task-body');

        title.innerText = 'SECURITY CAMERAS';
        body.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; width: 400px; height: 300px;">
                <div style="background: #000; border: 1px solid #333; position: relative; overflow: hidden;">
                    <p style="font-size: 10px; position: absolute; top: 2px; left: 2px;">SERVER RM</p>
                    <div id="cam-1" style="width: 5px; height: 5px; background: red; position: absolute;"></div>
                </div>
                <div style="background: #000; border: 1px solid #333; position: relative;">
                    <p style="font-size: 10px; position: absolute; top: 2px; left: 2px;">LIBRARY</p>
                    <div id="cam-2" style="width: 5px; height: 5px; background: red; position: absolute;"></div>
                </div>
                <div style="background: #000; border: 1px solid #333; position: relative;">
                    <p style="font-size: 10px; position: absolute; top: 2px; left: 2px;">LAB</p>
                    <div id="cam-3" style="width: 5px; height: 5px; background: red; position: absolute;"></div>
                </div>
                <div style="background: #000; border: 1px solid #333; position: relative;">
                    <p style="font-size: 10px; position: absolute; top: 2px; left: 2px;">SABOTAGE FIXER</p>
                    <button onclick="this.innerText='SYSTEMS OK'; this.style.color='green'" style="width: 100%; height: 100%; opacity: 0.1;">FIX</button>
                </div>
            </div>
            <p style="font-size: 0.8rem; margin-top: 10px; color: #add8e6;">SABOTAGE INFO: If screen is dark, click empty quadrant to restore!</p>
        `;
        overlay.classList.remove('hidden');

        const updateCams = setInterval(() => {
            const cams = ['cam-1', 'cam-2', 'cam-3'];
            cams.forEach(camId => {
                const cam = document.getElementById(camId);
                if (cam) {
                    cam.style.left = `${Math.random() * 90}%`;
                    cam.style.top = `${Math.random() * 90}%`;
                }
            });
        }, 1000);

        document.getElementById('close-task-btn').onclick = () => {
            clearInterval(updateCams);
            overlay.classList.add('hidden');
        };
    }

    showRoleAnnouncementHTML() {
        const overlay = document.getElementById('role-overlay');
        const type = document.getElementById('role-type');
        const desc = document.getElementById('role-desc');

        if (!overlay) return;

        overlay.classList.remove('hidden');
        if (this.isImpostor) {
            type.innerText = 'IMPOSTOR';
            type.style.color = '#ef4444';
            desc.innerText = 'Sabotage and eliminate the crewmates.';
        } else {
            type.innerText = 'CREWMATE';
            type.style.color = '#3b82f6';
            desc.innerText = 'Complete all tasks or find the impostor.';
        }

        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 3000);
    }

    getRandomColor() {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffffff', '#ffa500'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    playDigitalSound(type) {
        if (!this.sound.context) return;
        const ctx = this.sound.context;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        if (type === 'step') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'kill') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(120, now);
            osc.frequency.exponentialRampToValueAtTime(20, now + 0.5);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
        } else if (type === 'task') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(440, now + 0.2);
            gain.gain.setValueAtTime(0.1, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'meeting') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.setValueAtTime(660, now + 0.1);
            osc.frequency.setValueAtTime(440, now + 0.2);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.linearRampToValueAtTime(0, now + 0.4);
            osc.start(now);
            osc.stop(now + 0.4);
        }
    }
}
