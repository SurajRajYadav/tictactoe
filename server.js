const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

const EMPTY = ' ';
const PLAYER_X = 'X';
const PLAYER_O = 'O';

let currentPlayer = PLAYER_X;
let board = [
    [EMPTY, EMPTY, EMPTY],
    [EMPTY, EMPTY, EMPTY],
    [EMPTY, EMPTY, EMPTY]
];

function checkWinner(player) {
    // Check rows
    for (let i = 0; i < 3; i++) {
        if (board[i][0] === player && board[i][1] === player && board[i][2] === player) {
            return true;
        }
    }

    // Check columns
    for (let i = 0; i < 3; i++) {
        if (board[0][i] === player && board[1][i] === player && board[2][i] === player) {
            return true;
        }
    }

    // Check diagonals
    if ((board[0][0] === player && board[1][1] === player && board[2][2] === player) ||
        (board[0][2] === player && board[1][1] === player && board[2][0] === player)) {
        return true;
    }

    return false;
}

function checkDraw() {
    for (let row of board) {
        if (row.includes(EMPTY)) {
            return false;
        }
    }
    return true;
}

function switchPlayer() {
    currentPlayer = currentPlayer === PLAYER_X ? PLAYER_O : PLAYER_X;
}

function resetGame() {
    currentPlayer = PLAYER_X;
    board = [
        [EMPTY, EMPTY, EMPTY],
        [EMPTY, EMPTY, EMPTY],
        [EMPTY, EMPTY, EMPTY]
    ];
}

wss.on('connection', function connection(ws) {
    ws.send(JSON.stringify({ type: 'board', data: board, currentPlayer }));

    ws.on('message', function incoming(message) {
        const { type, data } = JSON.parse(message);
        if (type === 'move') {
            const [row, col] = data;
            if (board[row][col] === EMPTY) {
                board[row][col] = currentPlayer;
                if (checkWinner(currentPlayer)) {
                    ws.send(JSON.stringify({ type: 'winner', data: currentPlayer }));
                    resetGame();
                } else if (checkDraw()) {
                    ws.send(JSON.stringify({ type: 'draw' }));
                    resetGame();
                } else {
                    switchPlayer();
                    ws.send(JSON.stringify({ type: 'board', data: board, currentPlayer }));
                }
            }
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
