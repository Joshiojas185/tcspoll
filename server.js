
// const express = require('express');
// const http = require('http');
// const socketIo = require('socket.io');
// const cors = require('cors'); // latest change

// const app = express();
// const server = http.createServer(app);
// // const io = socketIo(server);
// const io = socketIo(server, { // latest change
//     cors: {
//         origin: '*', // Replace with your frontend URL
//         methods: ['GET', 'POST'],
//         allowedHeaders: ['my-custom-header'],
//         credentials: true // Allow credentials (cookies, authorization headers, etc.)
//     }
// });

// let rooms = {}; // Store room data

// app.use(cors()); // latest change
// app.use(express.static('poll'));

// io.on('connection', (socket) => {
//     console.log('A user connected:', socket.id);

//     socket.on('joinRoom', (roomName, playerName) => {

//         if (rooms[roomName] && !rooms[roomName].isAvailable) {
           
//             io.to(socket.id).emit('roomNotAvailable', { message:
//                  "Thank you for joining the quiz! You will be redirected shortly.", image: 'thank-you.png' });
//             return; 
//         }

//         socket.join(roomName);
//         if (!rooms[roomName]) {
//             rooms[roomName] = {
//                 players: [],
//                 host: socket.id,
//                 quizQuestions: [],
//                 currentQuestionIndex: 0,
//                 quizStarted: false,
//                 votes: [],
//                 currentQuestionTime: 15,
//                 timerInterval: null,
//                 timerPerQuestion: 15,
//                 votingAllowed: false,
//                 isAvailable: true
//             };
//         }
//         rooms[roomName].players.push({ id: socket.id, name: playerName });
//         io.to(roomName).emit('updatePlayers', rooms[roomName].players);
        
//         // Check if the quiz has started and send the current question
//         if (rooms[roomName].quizStarted) {
//             const currentQuestion = rooms[roomName].quizQuestions[rooms[roomName].currentQuestionIndex];
//             io.to(socket.id).emit('quizStarted', currentQuestion);
//         }
        
//         if (socket.id === rooms[roomName].host) {
//             io.to(socket.id).emit('hostAssigned');
//         }
//     });

//     // Handles quiz locking
//     socket.on('lockQuiz', (roomName) => {
//         rooms[roomName].isAvailable = false; // Set the room as not available
//         io.to(roomName).emit('quizLocked', { message: "Thank you for joining the quiz! You will be redirected shortly.", image: 'thank-you.png' }); // Notify all users in the room
//     });

//     // Handle quiz file upload
//     socket.on('uploadQuiz', (roomName, quizJson, timerPerQuestion) => {
//         if (socket.id === rooms[roomName].host) {
//             try {
//                 rooms[roomName].quizQuestions = JSON.parse(quizJson).questions;
//                 rooms[roomName].votes = Array(rooms[roomName].quizQuestions.length).fill().map(() => ({ A: 0, B: 0, C: 0, D: 0 }));
//                 rooms[roomName].timerPerQuestion = timerPerQuestion;
//                 io.to(roomName).emit('quizUploaded', rooms[roomName].quizQuestions.length);
//             } catch (err) {
//                 console.error('Invalid JSON format:', err);
//             }
//         }
//     });

//     // Start the quiz
//     socket.on('startQuiz', (roomName) => {
//         if (socket.id === rooms[roomName].host && rooms[roomName].quizQuestions.length > 0) {
//             rooms[roomName].quizStarted = true;
//             rooms[roomName].currentQuestionIndex = 0; // Reset to the first question
//             io.to(roomName).emit('quizStarted', rooms[roomName].quizQuestions[rooms[roomName].currentQuestionIndex]);
//             startTimer(roomName, rooms[roomName].timerPerQuestion); // Start the timer for the first question
//         }
//     });


//     function startTimer(roomName, duration) {
//         timeLeft = duration; // Set the global timeLeft
//         rooms[roomName].votingAllowed = true; // Allow voting initially
//         rooms[roomName].timerInterval = setInterval(() => {
//             if (timeLeft <= 0) {
//                 clearInterval(rooms[roomName].timerInterval);
//                 rooms[roomName].votingAllowed = false; // Disallow voting after timer ends
//                 io.to(roomName).emit('showPoll', rooms[roomName].votes[rooms[roomName].currentQuestionIndex]);
//                 io.to(roomName).emit('timerEnded'); // Emit event to notify timer ended
//             } else {
//                 io.to(roomName).emit('updateTimer', timeLeft); // Send the remaining time to clients
//                 timeLeft--; // Decrement timeLeft
//             }
//         }, 1000);
//     }

//     // Receive votes
//     socket.on('vote', (roomName, option) => {
//         if (rooms[roomName].quizStarted && rooms[roomName].votingAllowed && rooms[roomName].votes[rooms[roomName].currentQuestionIndex][option] !== undefined) {
//             rooms[roomName].votes[rooms[roomName].currentQuestionIndex][option]++;
//             io.to(roomName).emit('updateVotes', rooms[roomName].votes[rooms[roomName].currentQuestionIndex]);
//         }
//     });
     
//     // Handles floating reactions
//     socket.on('sendEmoji', (roomName, emoji, position) => {
//         // Emit the emoji to all clients in the room
//         io.to(roomName).emit('receiveEmoji', emoji, position);
//     });

//     socket.on('nextQuestion', (roomName) => {
//         if (socket.id === rooms[roomName].host && rooms[roomName].currentQuestionIndex < rooms[roomName].quizQuestions.length - 1) {
//             rooms[roomName].currentQuestionIndex++;
//             clearInterval(rooms[roomName].timerInterval); // Clear the previous timer
//             io.to(roomName).emit('nextQuestion', rooms[roomName].quizQuestions[rooms[roomName].currentQuestionIndex]);
            
//             // Start the timer for the next question
//             startTimer(roomName, rooms[roomName].timerPerQuestion);
//         } else if (rooms[roomName].currentQuestionIndex === rooms[roomName].quizQuestions.length - 1) {
//             io.to(roomName).emit('quizEnded');
//         }
//     });

//     socket.on('timerEnded', (roomName) => {
//         // Emit to all clients in the room that the timer has ended
//         io.to(roomName).emit('timerEnded'); 
//     });

//     // Handle disconnect
//     socket.on('disconnect', () => {
//         for (const roomName in rooms) {
//             rooms[roomName].players = rooms[roomName].players.filter(p => p.id !== socket.id);
//             if (socket.id === rooms[roomName].host) {
//                 rooms[roomName].host = rooms[roomName].players.length > 0 ? rooms[roomName].players[0].id : null;
//                 if (rooms[roomName].host) io.to(rooms[roomName].host).emit('hostAssigned');
//             }
//             io.to(roomName).emit('updatePlayers', rooms[roomName].players);
//         }
//     });
// });

// // server.listen(5000, () => console.log('Server running on http://localhost:5000'));


// // server.listen(5000, '192.168.29.153', () => console.log('Server running on http://192.168.29.153:5000'));


// const PORT = process.env.PORT || 5000;
// const HOST = '0.0.0.0'; // Change from '192.168.29.153' to '0.0.0.0'

// server.listen(PORT, HOST, () => {
//   console.log(`Server running on ${HOST}:${PORT}`);
// });





const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        allowedHeaders: ['my-custom-header'],
        credentials: true
    }
});

let rooms = {}; // Store room data

app.use(cors());
app.use(express.static('poll'));

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // ALLOW THE FIRST USER AS WELL AS TCSHOST TO HOST THE ROOM
    // socket.on('joinRoom', (roomName, playerName) => {
    //     if (rooms[roomName] && !rooms[roomName].isAvailable) {
    //         io.to(socket.id).emit('roomNotAvailable', { message: "Thank you for joining the quiz! You will be redirected shortly.", image: 'thank-you.png' });
    //         return; 
    //     }
    
    //     socket.join(roomName);
        
    //     // Initialize the room if it doesn't exist
    //     if (!rooms[roomName]) {
    //         rooms[roomName] = {
    //             players: [],
    //             hosts: [],
    //             quizQuestions: [],
    //             currentQuestionIndex: 0,
    //             quizStarted: false,
    //             votes: [],
    //             currentQuestionTime: 15,
    //             timerInterval: null,
    //             timerPerQuestion: 15,
    //             votingAllowed: false,
    //             isAvailable: true 
    //         };
    //     }
    
    //     // Add the player to the room
    //     rooms[roomName].players.push({ id: socket.id, name: playerName });
    
    //     // Check if the player is "tcshost" and add them as a host
    //     if (playerName === "tcshost") {
    //         rooms[roomName].hosts.push(socket.id); // Add to hosts array
    //         io.to(socket.id).emit('hostAssigned'); // Notify the tcshost that they are a host
    //     }
    
    //     // If this is the first player, they become a host
    //     if (rooms[roomName].players.length === 1) {
    //         rooms[roomName].hosts.push(socket.id); // First player becomes a host
    //         io.to(socket.id).emit('hostAssigned'); // Notify the first player that they are a host
    //     }
    
    //     // Notify all players in the room about the updated player list
    //     io.to(roomName).emit('updatePlayers', rooms[roomName].players);
        
    //     // Check if the quiz has started and send the current question
    //     if (rooms[roomName].quizStarted) {
    //         const currentQuestion = rooms[roomName].quizQuestions[rooms[roomName].currentQuestionIndex];
    //         io.to(socket.id).emit('quizStarted', currentQuestion);
    //     }
    // });

    // Only focused on host-> as tcshost
    socket.on('joinRoom', (roomName, playerName) => {
        if (rooms[roomName] && !rooms[roomName].isAvailable) {
            io.to(socket.id).emit('roomNotAvailable', { message: "Thank you for joining the quiz! You will be redirected shortly.", image: 'thank-you.png' });
            return; 
        }
    
        socket.join(roomName);
        if (!rooms[roomName]) {
            rooms[roomName] = {
                players: [],
                hosts: [],
                quizQuestions: [],
                currentQuestionIndex: 0,
                quizStarted: false,
                votes: [],
                currentQuestionTime: 15,
                timerInterval: null,
                timerPerQuestion: 15,
                votingAllowed: false,
                isAvailable: true 
            };
        }
    
        // Add the player to the room
        rooms[roomName].players.push({ id: socket.id, name: playerName });
    
        // Check if the player is "tcshost" and add them as a host
        if (playerName === "tcshost") {
            rooms[roomName].hosts.push(socket.id); // Add to hosts array
            io.to(socket.id).emit('hostAssigned'); // Notify the tcshost that they are a host
    
            // If the quiz has already started, send the current question and next question button
            if (rooms[roomName].quizStarted) {
                const currentQuestion = rooms[roomName].quizQuestions[rooms[roomName].currentQuestionIndex];
                io.to(socket.id).emit('quizStarted', currentQuestion);
                io.to(socket.id).emit('showNextQuestionButton'); // Emit event to show the next question button
            }
        }
    
        // If this is the first player, they become a host
        if (rooms[roomName].players.length === 1) {
            rooms[roomName].hosts.push(socket.id); // First player becomes a host
        }
    
        // Notify all players in the room about the updated player list
        io.to(roomName).emit('updatePlayers', rooms[roomName].players);
        
        // Check if the quiz has started and send the current question
        if (rooms[roomName].quizStarted) {
            const currentQuestion = rooms[roomName].quizQuestions[rooms[roomName].currentQuestionIndex];
            io.to(socket.id).emit('quizStarted', currentQuestion);
        }
    });

    // socket.on('joinRoom', (roomName, playerName) => {
    //     if (rooms[roomName] && !rooms[roomName].isAvailable) {
    //         io.to(socket.id).emit('roomNotAvailable', { message: "Thank you for joining the quiz! You will be redirected shortly.", image: 'thank-you.png' });
    //         return; 
    //     }

    //     socket.join(roomName);
    //     if (!rooms[roomName]) {
    //         rooms[roomName] = {
    //             players: [],
    //             hosts: [], // Change from host to hosts (array)
    //             quizQuestions: [],
    //             currentQuestionIndex: 0,
    //             quizStarted: false,
    //             votes: [],
    //             currentQuestionTime: 15,
    //             timerInterval: null,
    //             timerPerQuestion: 15,
    //             votingAllowed: false,
    //             isAvailable: true 
    //         };
    //     }

    //     // Add the player to the room
    //     rooms[roomName].players.push({ id: socket.id, name: playerName });

    //     // Check if the player is "tcshost" and add them as a host
    //     if (playerName === "tcshost") {
    //         rooms[roomName].hosts.push(socket.id); // Add to hosts array
    //     }

    //     // If this is the first player, they become a host
    //     if (rooms[roomName].players.length === 1) {
    //         rooms[roomName].hosts.push(socket.id); // First player becomes a host
    //     }

    //     // Notify all players in the room about the updated player list
    //     io.to(roomName).emit('updatePlayers', rooms[roomName].players);
        
    //     // Check if the quiz has started and send the current question
    //     if (rooms[roomName].quizStarted) {
    //         const currentQuestion = rooms[roomName].quizQuestions[rooms[roomName].currentQuestionIndex];
    //         io.to(socket.id).emit('quizStarted', currentQuestion);
    //     }
        
    //     // Notify the player if they are a host
    //     if (rooms[roomName].hosts.includes(socket.id)) {
    //         io.to(socket.id).emit('hostAssigned');
    //     }
    // });

    socket.on('lockQuiz', (roomName) => {
        rooms[roomName].isAvailable = false; // Set the room as not available
        io.to(roomName).emit('quizLocked', { message: "Thank you for joining the quiz! You will be redirected shortly.", image: 'thank-you.png' }); // Notify all users in the room
    });

    socket.on('uploadQuiz', (roomName, quizJson, timerPerQuestion) => {
        if (rooms[roomName].hosts.includes(socket.id)) { // Check if the user is a host
            try {
                const quizData = JSON.parse(quizJson);
                rooms[roomName].quizQuestions = quizData.questions;
    
                // Initialize votes based on the number of options for each question
                rooms[roomName].votes = rooms[roomName].quizQuestions.map(question => {
                    const optionCount = question.options.length;
                    return Array(optionCount).fill(0); // Initialize votes to 0 for each option
                });
    
                rooms[roomName].timerPerQuestion = timerPerQuestion;
                io.to(roomName).emit('quizUploaded', rooms[roomName].quizQuestions.length);
            } catch (err) {
                console.error('Invalid JSON format:', err);
                io.to(roomName).emit('uploadError', 'Invalid JSON format. Please check your file.');
            }
        } else {
            io.to(socket.id).emit('uploadError', 'You are not authorized to upload a quiz.');
        }
    });

    // socket.on('uploadQuiz', (roomName, quizJson, timerPerQuestion) => {
    //     if (socket.id === rooms[roomName].host) {
    //         try {
    //             const quizData = JSON.parse(quizJson);
    //             rooms[roomName].quizQuestions = quizData.questions;
    
    //             // Initialize votes based on the number of options for each question
    //             rooms[roomName].votes = rooms[roomName].quizQuestions.map(question => {
    //                 const optionCount = question.options.length;
    //                 return Array(optionCount).fill(0); // Initialize votes to 0 for each option
    //             });
    
    //             rooms[roomName].timerPerQuestion = timerPerQuestion;
    //             io.to(roomName).emit('quizUploaded', rooms[roomName].quizQuestions.length);
    //         } catch (err) {
    //             console.error('Invalid JSON format:', err);
    //         }
    //     }
    // });

    // socket.on('startQuiz', (roomName) => {
    //     if (socket.id === rooms[roomName].host && rooms[roomName].quizQuestions.length > 0) {
    //         rooms[roomName].quizStarted = true;
    //         rooms[roomName].currentQuestionIndex = 0; // Reset to the first question
    //         io.to(roomName).emit('quizStarted', rooms[roomName].quizQuestions[rooms[roomName].currentQuestionIndex]);
    //         startTimer(roomName, rooms[roomName].timerPerQuestion); // Start the timer for the first question
    //     }
    // });

    socket.on('startQuiz', (roomName) => {
        if (rooms[roomName].hosts.includes(socket.id) && rooms[roomName].quizQuestions.length > 0) {
            rooms[roomName].quizStarted = true;
            rooms[roomName].currentQuestionIndex = 0; // Reset to the first question
            io.to(roomName).emit('quizStarted', rooms[roomName].quizQuestions[rooms[roomName].currentQuestionIndex]);
            startTimer(roomName, rooms[roomName].timerPerQuestion); // Start the timer for the first question
        } else {
            io.to(socket.id).emit('startError', 'You are not authorized to start the quiz or there are no questions.');
        }
    });

    function startTimer(roomName, duration) {
        timeLeft = duration; // Set the global timeLeft
        rooms[roomName].votingAllowed = true; // Allow voting initially
        rooms[roomName].timerInterval = setInterval(() => {
            if (timeLeft <= 0) {
                clearInterval(rooms[roomName].timerInterval);
                rooms[roomName].votingAllowed = false; // Disallow voting after timer ends
                io.to(roomName).emit('showPoll', rooms[roomName].votes[rooms[roomName].currentQuestionIndex]);
                io.to(roomName).emit('timerEnded'); // Emit event to notify timer ended
            } else {
                io.to(roomName).emit('updateTimer', timeLeft); // Send the remaining time to clients
                timeLeft--; // Decrement timeLeft
            }
        }, 1000);
    }

    socket.on('vote', (roomName, option) => {
        const currentQuestionIndex = rooms[roomName].currentQuestionIndex;
        const optionIndex = option.charCodeAt(0) - 65; // Convert 'A', 'B', 'C', etc. to index 0, 1, 2, ...
        
        if (rooms[roomName].quizStarted && rooms[roomName].votingAllowed && rooms[roomName].votes[currentQuestionIndex][optionIndex] !== undefined) {
            rooms[roomName].votes[currentQuestionIndex][optionIndex]++;
            io.to(roomName).emit('updateVotes', rooms[roomName].votes[currentQuestionIndex]);
        }
    });
         
        // Handles floating reactions
        socket.on('sendEmoji', (roomName, emoji, position) => {
            // Emit the emoji to all clients in the room
            io.to(roomName).emit('receiveEmoji', emoji, position);
        });
    
        socket.on('nextQuestion', (roomName) => {
            if (rooms[roomName].hosts.includes(socket.id) && rooms[roomName].currentQuestionIndex < rooms[roomName].quizQuestions.length - 1) {
                rooms[roomName].currentQuestionIndex++;
                clearInterval(rooms[roomName].timerInterval); // Clear the previous timer
                io.to(roomName).emit('nextQuestion', rooms[roomName].quizQuestions[rooms[roomName].currentQuestionIndex]);
                
                // Start the timer for the next question
                startTimer(roomName, rooms[roomName].timerPerQuestion);
            } else if (rooms[roomName].currentQuestionIndex === rooms[roomName].quizQuestions.length - 1) {
                io.to(roomName).emit('quizEnded');
            }
        });
        // socket.on('nextQuestion', (roomName) => {
        //     if (socket.id === rooms[roomName].host && rooms[roomName].currentQuestionIndex < rooms[roomName].quizQuestions.length - 1) {
        //         rooms[roomName].currentQuestionIndex++;
        //         clearInterval(rooms[roomName].timerInterval); // Clear the previous timer
        //         io.to(roomName).emit('nextQuestion', rooms[roomName].quizQuestions[rooms[roomName].currentQuestionIndex]);
                
        //         // Start the timer for the next question
        //         startTimer(roomName, rooms[roomName].timerPerQuestion);
        //     } else if (rooms[roomName].currentQuestionIndex === rooms[roomName].quizQuestions.length - 1) {
        //         io.to(roomName).emit('quizEnded');
        //     }
        // });
    
        socket.on('timerEnded', (roomName) => {
            // Emit to all clients in the room that the timer has ended
            io.to(roomName).emit('timerEnded'); 
        });

    // Other event handlers remain unchanged...

    socket.on('disconnect', () => {
        for (const roomName in rooms) {
            rooms[roomName].players = rooms[roomName].players.filter(p => p.id !== socket.id);
            rooms[roomName].hosts = rooms[roomName].hosts.filter(hostId => hostId !== socket.id); // Remove the host if they disconnect

            // If the host disconnects, assign a new host if there are players left
            if (rooms[roomName].hosts.length === 0 && rooms[roomName].players.length > 0) {
                rooms[roomName].hosts.push(rooms[roomName].players[0].id); // Assign the first player as the new host
            }

            io.to(roomName).emit('updatePlayers', rooms[roomName].players);
        }
    });
});

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
    console.log(`Server running on ${HOST}:${PORT}`);
});