const socket = io('wss://tcspoll.onrender.com');

const nameInput = document.getElementById('name-input');
const roomInput = document.getElementById('room-input');
const nextQuestionBtn = document.getElementById('next-question-btn');
const joinBtn = document.getElementById('join-btn');
const playerList = document.getElementById('player-list');
const quizFileInput = document.getElementById('quiz-file');
const timerInput = document.getElementById('timer-input');
const uploadBtn = document.getElementById('upload-btn');
const startBtn = document.getElementById('start-btn');
const waitingRoom = document.getElementById('waiting-room');
const quizRoom = document.getElementById('quiz-room');
const pollRoom = document.getElementById('poll-room');
const thankyouRoom = document.getElementById('thankyou-room');
const questionDisplay = document.getElementById('question');
const optionsContainer = document.getElementById('options');
const nextBtn = document.getElementById('next-btn');
// const submitBtn = document.getElementById('submit-btn');
const timerDisplay = document.getElementById('timer-display');
const ctx = document.getElementById('voteChart').getContext('2d');
const pollCtx = document.getElementById('pollChart').getContext('2d');

let isHost = false;
let voteChart;
let pollChart;
let voted = false;

socket.on('connect', () => {
    console.log('Connected to server'); // Log when connected
});

socket.on('showPoll', (voteData) => {
    // Instead of changing to the poll room, just display the results in the quiz room
    displayPoll(voteData);
    nextQuestionBtn.style.display = 'block'; // Show the next question button
});

joinBtn.addEventListener('click', () => {
    const name = nameInput.value.trim();
    const roomName = roomInput.value.trim();
    if (name && roomName) {
        socket.emit('joinRoom', roomName, name);
        nameInput.style.display = 'none';
        roomInput.style.display = 'none';
        joinBtn.style.display = 'none';
    }
});

socket.on('updatePlayers', (players) => {
    playerList.innerHTML = '';
    players.forEach(player => {
        const li = document.createElement('li');
        li.innerText = player.name;
        playerList.appendChild(li);
    });
});

socket.on('hostAssigned', () => {
    isHost = true;
    quizFileInput.style.display = 'block';
    timerInput.style.display = 'block';
    uploadBtn.style.display = 'block';
});

uploadBtn.addEventListener('click', () => {
    const file = quizFileInput.files[0];
    const timer = timerInput.value.trim();
    if (file && timer) {
        const reader = new FileReader();
        reader.onload = (e) => {
            socket.emit('uploadQuiz', roomInput.value.trim(), e.target.result, timer);
        };
        reader.readAsText(file);
    }
});

socket.on('quizUploaded', (count) => {
    if (isHost) startBtn.style.display = 'block';
});

startBtn.addEventListener('click', () => {
    socket.emit('startQuiz', roomInput.value.trim());
});

socket.on('quizStarted', (question) => {
    waitingRoom.style.display = 'none';
    quizRoom.style.display = 'block';
    displayQuestion(question);
    timerDisplay.style.display = 'block'; // Show the timer when the quiz starts
});

function displayQuestion(question) {
    questionDisplay.innerText = question.text;
    optionsContainer.innerHTML = '';
    question.options.forEach((option, index) => {
        const btn = document.createElement('div');
        btn.innerText = option;
        btn.classList.add('option-button');  // New class for styling
        btn.onclick = () => {
            if (!voted) {
                socket.emit('vote', roomInput.value.trim(), String.fromCharCode(65 + index));
                voted = true;
                // submitBtn.style.display = 'none';
            }
        };
        optionsContainer.appendChild(btn);
    });
    // submitBtn.style.display = 'block';
    if (isHost) nextBtn.style.display = 'block';
}

// nextBtn.addEventListener('click', () => {
//     socket.emit('nextQuestion', roomInput.value.trim());
// });

nextBtn.addEventListener('click', () => {
    socket.emit('nextQuestion', roomInput.value.trim());
    timerDisplay.style.display = 'block'; // Show the timer when moving to the next question
    timerDisplay.innerText = `Time Left: ${timeLeft}s`; // Reset the timer display
});

socket.on('nextQuestion', (question) => {
    displayQuestion(question);
    voted = false;
    // submitBtn.style.display = 'block';
});

function displayPoll(voteData) {
    if (!pollChart) {
        pollChart = new Chart(pollCtx, {
            type: 'bar',
            data: {
                labels: ['A', 'B', 'C', 'D'],
                datasets: [{
                    label: 'Votes',
                    backgroundColor: ['#B3A7FF', '#3D83FF', '#FF538D', '#FFE87A'],
                    data: Object.values(voteData)
                }]
            }
        });
    } else {
        pollChart.data.datasets[0].data = Object.values(voteData);
        pollChart.update();
    }
}

socket.on('timerEnded', () => {
    timerDisplay.innerText = ''; // Hide the timer when time runs out
    timerDisplay.style.display = 'none'; // Optionally hide the timer display element
});

socket.on('updateVotes', (voteData) => {
    if (!voteChart) {
        voteChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['A', 'B', 'C', 'D'],
                datasets: [{
                    label: 'Votes',
                    backgroundColor: ['#B3A7FF', '#3D83FF', '#FF538D', '#FFE87A'],
                    data: Object.values(voteData)
                }]
            }
        });
    } else {
        voteChart.data.datasets[0].data = Object.values(voteData);
        voteChart.update();
    }
});

socket.on('updateTimer', (timeLeft) => {
    timerDisplay.innerText = `Time Left: ${timeLeft}s`; // Update the timer display
    // if (timeLeft <= 5) {
    //     timerDisplay.style.color = 'red'; // Change color to red when time is low
    // }
    if (timeLeft <= 0) {
        timerDisplay.innerText = ''; // Hide the timer when time runs out
    }
});

socket.on('quizEnded', () => {
    quizRoom.style.display = 'none';
    pollRoom.style.display = 'none';
    thankyouRoom.style.display = 'block';
});