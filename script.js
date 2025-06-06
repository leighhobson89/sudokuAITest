// Sudoku Game Logic
const boardSizeSelect = document.getElementById('board-size');
const sudokuBoard = document.getElementById('sudoku-board');
const numberBar = document.getElementById('number-bar');
const timerSpan = document.getElementById('timer');
const pointsSpan = document.getElementById('points');
const bestTimeSpan = document.getElementById('best-time');
const newGameBtn = document.getElementById('new-game');
const regenerateBtn = document.getElementById('regenerate');
const livesSpan = document.getElementById('lives');
const themeSelect = document.getElementById('theme-select');


let N = 3; // block size (3x3x3 = 9x9)
let board = [];
let solution = [];
let selectedNumber = 1;
let selectedCell = null;
let timer = null;
let startTime = null;
let elapsed = 0;
let points = 0;
let bestTimes = {};
let lives = 3;
let gameOver = false;

// Load points and best times from localStorage
function loadStats() {
    const pts = localStorage.getItem('sudoku_points');
    points = pts ? parseInt(pts) : 0;
    pointsSpan.textContent = `Points: ${points}`;
    const bt = localStorage.getItem('sudoku_best_times');
    bestTimes = bt ? JSON.parse(bt) : {};
    updateBestTime();
}

function saveStats() {
    localStorage.setItem('sudoku_points', points);
    localStorage.setItem('sudoku_best_times', JSON.stringify(bestTimes));
}

function updateBestTime() {
    const key = `${N}`;
    if (bestTimes[key]) {
        bestTimeSpan.textContent = `Best: ${formatTime(bestTimes[key])}`;
    } else {
        bestTimeSpan.textContent = 'Best: --:--';
    }
}

// Timer
function startTimer() {
    if (timer) clearInterval(timer);
    startTime = Date.now() - elapsed;
    timer = setInterval(() => {
        elapsed = Date.now() - startTime;
        timerSpan.textContent = `Time: ${formatTime(elapsed)}`;
    }, 1000);
}

function stopTimer() {
    if (timer) clearInterval(timer);
}

function resetTimer() {
    stopTimer();
    elapsed = 0;
    timerSpan.textContent = 'Time: 00:00';
}

function formatTime(ms) {
    const total = Math.floor(ms / 1000);
    const min = Math.floor(total / 60);
    const sec = total % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

// Board Generation (simple backtracking for now)
function generateSudoku(n) {
    // Generate a solved board
    let size = n * n;
    let board = Array.from({length: size}, () => Array(size).fill(0));
    fillBoard(board, n);
    // Remove some cells for puzzle
    let puzzle = board.map(row => row.slice());
    let emptyCells = Math.floor(size * size * 0.55); // ~55% empty
    while (emptyCells > 0) {
        let r = Math.floor(Math.random() * size);
        let c = Math.floor(Math.random() * size);
        if (puzzle[r][c] !== 0) {
            puzzle[r][c] = 0;
            emptyCells--;
        }
    }
    return {puzzle, solution: board};
}

function fillBoard(board, n) {
    let size = n * n;
    function isSafe(board, row, col, num) {
        for (let x = 0; x < size; x++) {
            if (board[row][x] === num || board[x][col] === num) return false;
        }
        let startRow = row - row % n;
        let startCol = col - col % n;
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (board[startRow + i][startCol + j] === num) return false;
            }
        }
        return true;
    }
    function solve(cell = 0) {
        if (cell === size * size) return true;
        let row = Math.floor(cell / size);
        let col = cell % size;
        let nums = Array.from({length: size}, (_, i) => i + 1).sort(() => Math.random() - 0.5);
        for (let num of nums) {
            if (isSafe(board, row, col, num)) {
                board[row][col] = num;
                if (solve(cell + 1)) return true;
                board[row][col] = 0;
            }
        }
        return false;
    }
    solve();
}

// Rendering
function renderBoard() {
    sudokuBoard.innerHTML = '';
    let size = N * N;
    sudokuBoard.style.gridTemplateColumns = `repeat(${size}, 40px)`;
    sudokuBoard.style.gridTemplateRows = `repeat(${size}, 40px)`;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const cell = document.createElement('div');
            cell.className = 'sudoku-cell';
            if (board[r][c] !== 0) {
                cell.textContent = board[r][c];
                cell.classList.add('prefilled');
            } else {
                cell.textContent = '';
            }
            cell.dataset.row = r;
            cell.dataset.col = c;
            // Block borders
            if ((c + 1) % N === 0 && c !== size - 1) cell.classList.add('block-border-right');
            if ((r + 1) % N === 0 && r !== size - 1) cell.classList.add('block-border-bottom');
            if (c === 0) cell.classList.add('block-border-left');
            if (r === 0) cell.classList.add('block-border-top');
            if (c === size - 1) cell.classList.add('block-border-right');
            if (r === size - 1) cell.classList.add('block-border-bottom');
            cell.addEventListener('click', () => {
                selectCell(cell);
                // Place number immediately if not prefilled
                if (!cell.classList.contains('prefilled')) {
                    placeNumber(cell, selectedNumber);
                }
            });
            sudokuBoard.appendChild(cell);
        }
    }
    // After rendering, adjust number bar height
    setTimeout(adjustNumberBarHeight, 0);
}

function adjustNumberBarHeight() {
    // Make number bar match board height
    const boardRect = sudokuBoard.getBoundingClientRect();
    numberBar.style.height = boardRect.height + 'px';
    const btns = numberBar.querySelectorAll('.number-btn');
    if (btns.length > 0) {
        const btnHeight = boardRect.height / btns.length;
        btns.forEach(btn => {
            btn.style.height = btnHeight + 'px';
            btn.style.fontSize = Math.max(18, btnHeight * 0.5) + 'px';
        });
    }
}

function renderNumberBar() {
    numberBar.innerHTML = '';
    let size = N * N;
    for (let i = 1; i <= size; i++) {
        const btn = document.createElement('button');
        btn.className = 'number-btn';
        btn.textContent = i;
        if (i === selectedNumber) btn.classList.add('selected');
        btn.addEventListener('click', () => {
            selectedNumber = i;
            renderNumberBar();
        });
        numberBar.appendChild(btn);
    }
}

function selectCell(cell) {
    if (selectedCell) selectedCell.classList.remove('selected');
    cell.classList.add('selected');
    selectedCell = cell;
}

function placeNumber(cell, num) {
    if (gameOver) return;
    let r = parseInt(cell.dataset.row);
    let c = parseInt(cell.dataset.col);
    if (solution[r][c] === num) {
        board[r][c] = num;
        cell.textContent = num;
        cell.classList.remove('error');
        checkWin();
    } else {
        cell.classList.add('error');
        setTimeout(() => cell.classList.remove('error'), 600);
        loseLife();
    }
}

function loseLife() {
    if (lives > 1) {
        lives--;
        updateLives();
    } else {
        lives = 0;
        updateLives();
        gameOver = true;
        stopTimer();
        setTimeout(() => {
            alert('Game Over! You are out of lives.');
        }, 200);
    }
}

function checkWin() {
    let size = N * N;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (board[r][c] === 0) return;
        }
    }
    stopTimer();
    let timeTaken = elapsed;
    let score = Math.max(5, 20 - Math.floor(timeTaken / 15000)); // lose 1pt per 15s, min 5
    points += score;
    pointsSpan.textContent = `Points: ${points}`;
    const key = `${N}`;
    if (!bestTimes[key] || timeTaken < bestTimes[key]) {
        bestTimes[key] = timeTaken;
        updateBestTime();
    }
    saveStats();
    setTimeout(() => {
        alert(`Congratulations! You solved it in ${formatTime(timeTaken)}.\nYou earned ${score} points.`);
    }, 200);
}

// Event listeners
// Removed: number placement is now handled in renderBoard cell click event.
// sudokuBoard.addEventListener('click', ... )

document.addEventListener('keydown', e => {
    let size = N * N;
    if (!selectedCell) return;
    if (e.key >= '1' && e.key <= String(size)) {
        let num = parseInt(e.key);
        if (num >= 1 && num <= size && !selectedCell.classList.contains('prefilled')) {
            placeNumber(selectedCell, num);
        }
    }
});

newGameBtn.addEventListener('click', () => {
    startNewGame();
});

regenerateBtn.addEventListener('click', () => {
    if (points >= 10) {
        points -= 10;
        pointsSpan.textContent = `Points: ${points}`;
        saveStats();
        startNewGame();
    } else {
        alert('Not enough points to regenerate!');
    }
});

boardSizeSelect.addEventListener('change', () => {
    N = parseInt(boardSizeSelect.value);
    if (N === 5) {
        alert('25x25 Sudoku is not supported due to performance. Please choose 9x9 or 16x16.');
        boardSizeSelect.value = '3';
        N = 3;
    }
    updateBestTime();
    startNewGame();
});

function startNewGame() {
    let {puzzle, solution: sol} = generateSudoku(N);
    board = puzzle;
    solution = sol;
    selectedNumber = 1;
    selectedCell = null;
    gameOver = false;
    lives = (N === 3 ? 3 : N === 4 ? 4 : 5);
    updateLives();
    renderBoard();
    renderNumberBar();
    resetTimer();
    startTimer();
}

function updateLives() {
    livesSpan.textContent = `Lives: ${lives}`;
}

// Theme logic
function applyTheme(theme) {
    document.body.className = '';
    document.body.classList.add('theme-' + theme);
    themeSelect.value = theme;
}
function saveTheme(theme) {
    localStorage.setItem('sudoku_theme', theme);
}
function loadTheme() {
    const defaultTheme = 'frosty';
    let theme = localStorage.getItem('sudoku_theme') || defaultTheme;
    applyTheme(theme);
}
themeSelect.addEventListener('change', () => {
    applyTheme(themeSelect.value);
    saveTheme(themeSelect.value);
});

// Initial load
loadTheme();
loadStats();
startNewGame();
