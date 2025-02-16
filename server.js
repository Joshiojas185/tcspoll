const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let rooms = {}; // Store room data

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Handle joining a room
    socket.on('joinRoom', (roomName, playerName) => {
        socket.join(roomName);
        if (!rooms[roomName]) {
            rooms[roomName] = {
                players: [],
                host: socket.id,
                quizQuestions: [],
                currentQuestionIndex: 0,
                quizStarted: false,
                votes: [],
                currentQuestionTime: 15,
                timerInterval: null,
                timerPerQuestion: 15,
                votingAllowed: false, // Track if voting is allowed
            };
        }
        rooms[roomName].players.push({ id: socket.id, name: playerName });
        io.to(roomName).emit('updatePlayers', rooms[roomName].players);
        if (socket.id === rooms[roomName].host) {
            io.to(socket.id).emit('hostAssigned');
        }
    });

    // Handle quiz file upload
    socket.on('uploadQuiz', (roomName, quizJson, timerPerQuestion) => {
        if (socket.id === rooms[roomName].host) {
            try {
                rooms[roomName].quizQuestions = JSON.parse(quizJson).questions;
                rooms[roomName].votes = Array(rooms[roomName].quizQuestions.length).fill().map(() => ({ A: 0, B: 0, C: 0, D: 0 }));
                rooms[roomName].timerPerQuestion = timerPerQuestion;
                io.to(roomName).emit('quizUploaded', rooms[roomName].quizQuestions.length);
            } catch (err) {
                console.error('Invalid JSON format:', err);
            }
        }
    });

    // Start the quiz
    socket.on('startQuiz', (roomName) => {
        if (socket.id === rooms[roomName].host && rooms[roomName].quizQuestions.length > 0) {
            rooms[roomName].quizStarted = true;
            rooms[roomName].currentQuestionIndex = 0; // Reset to the first question
            io.to(roomName).emit('quizStarted', rooms[roomName].quizQuestions[rooms[roomName].currentQuestionIndex]);
            startTimer(roomName, rooms[roomName].timerPerQuestion); // Start the timer for the first question
        }
    });

    function startTimer(roomName, duration) {
        let timeLeft = duration;
        rooms[roomName].votingAllowed = true; // Allow voting initially
        rooms[roomName].timerInterval = setInterval(() => {
            if (timeLeft <= 0) {
                clearInterval(rooms[roomName].timerInterval);
                rooms[roomName].votingAllowed = false; // Disallow voting after timer ends
                io.to(roomName).emit('showPoll', rooms[roomName].votes[rooms[roomName].currentQuestionIndex]);
            } else {
                io.to(roomName).emit('updateTimer', timeLeft); // Send the remaining time to clients
                timeLeft--;
            }
        }, 1000);
    }

    // Receive votes
    socket.on('vote', (roomName, option) => {
        if (rooms[roomName].quizStarted && rooms[roomName].votingAllowed && rooms[roomName].votes[rooms[roomName].currentQuestionIndex][option] !== undefined) {
            rooms[roomName].votes[rooms[roomName].currentQuestionIndex][option]++;
            io.to(roomName).emit('updateVotes', rooms[roomName].votes[rooms[roomName].currentQuestionIndex]);
        }
    });

    // Move to next question
    socket.on('nextQuestion', (roomName) => {
        if (socket.id === rooms[roomName].host && rooms[roomName].currentQuestionIndex < rooms[roomName].quizQuestions.length - 1) {
            rooms[roomName].currentQuestionIndex++;
            clearInterval(rooms[roomName].timerInterval); // Clear the previous timer
            io.to(roomName).emit('nextQuestion', rooms[roomName].quizQuestions[rooms[roomName].currentQuestionIndex]);
            startTimer(roomName, rooms[roomName].timerPerQuestion); // Start the timer for the next question
        } else if (rooms[roomName].currentQuestionIndex === rooms[roomName].quizQuestions.length - 1) {
            io.to(roomName).emit('quizEnded');
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        for (const roomName in rooms) {
            rooms[roomName].players = rooms[roomName].players.filter(p => p.id !== socket.id);
            if (socket.id === rooms[roomName].host) {
                rooms[roomName].host = rooms[roomName].players.length > 0 ? rooms[roomName].players[0].id : null;
                if (rooms[roomName].host) io.to(rooms[roomName].host).emit('hostAssigned');
            }
            io.to(roomName).emit('updatePlayers', rooms[roomName].players);
        }
    });
});

// server.listen(5000, () => console.log('Server running on http://localhost:5000'));
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Change from '192.168.29.153' to '0.0.0.0'

server.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
});


// server.listen(5000, '192.168.29.153', () => console.log('Server running on http://192.168.29.153:5000'));