import { io } from 'socket.io-client';

const socket = io('http://localhost:3000');
const stateEl = document.getElementById('game-state');
const countEl = document.getElementById('player-count');
const startBtn = document.getElementById('start-mission-btn');
const studentsContainer = document.getElementById('students-container');
const taskBar = document.getElementById('admin-task-bar');
const taskDetail = document.getElementById('task-detail');

// Join as Admin
socket.emit('joinGame', { name: 'TEACHER', isAdmin: true });

socket.on('adminUpdate', (data) => {
    updateUI(data);
});

socket.on('updateGameState', (data) => {
    stateEl.innerText = data.state;
});

socket.on('taskProgress', (data) => {
    taskBar.style.width = `${data.progress}%`;
});

startBtn.onclick = () => {
    socket.emit('adminStartGame');
    startBtn.disabled = true;
    startBtn.innerText = "MISSION STARTED";
};

function updateUI(data) {
    const players = Object.values(data.players);
    stateEl.innerText = data.gameState;
    countEl.innerText = `${players.length} Players`;

    studentsContainer.innerHTML = '';
    let totalTasks = 0;
    let doneTasks = 0;

    players.forEach(p => {
        if (p.isAdmin) return;

        const row = document.createElement('div');
        row.className = 'player-row';

        const role = p.isImpostor ? '<span class="badge badge-impostor">Impostor</span>' : '<span class="badge badge-crew">Crewmate</span>';
        const status = p.isGhost ? '💀 Ghost' : '✨ Alive';

        row.innerHTML = `
            <div><strong>${p.name}</strong> ${role}</div>
            <div>Tasks: ${p.tasksDone || 0}/4 | ${status}</div>
        `;
        studentsContainer.appendChild(row);

        if (!p.isImpostor) {
            totalTasks += 4;
            doneTasks += (p.tasksDone || 0);
        }
    });

    taskDetail.innerText = `${doneTasks} / ${totalTasks} Tasks done`;
    if (totalTasks > 0) {
        taskBar.style.width = `${(doneTasks / totalTasks) * 100}%`;
    }
}
