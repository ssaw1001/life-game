const ROWS = 100;
const COLS = 100;

const canvas = document.querySelector("#board");
const ctx = canvas.getContext("2d");
const generationEl = document.querySelector("#generation");
const aliveCountEl = document.querySelector("#aliveCount");
const cursorReadout = document.querySelector("#cursorReadout");
const playPauseButton = document.querySelector("#playPause");
const stepButton = document.querySelector("#step");
const clearButton = document.querySelector("#clear");
const randomButton = document.querySelector("#random");
const gliderButton = document.querySelector("#glider");
const speedInput = document.querySelector("#speed");

let grid = createGrid();
let generation = 0;
let running = false;
let lastTick = 0;
let drawMode = true;
let pointerDown = false;

function createGrid() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(false));
}

function countNeighbors(row, col, source = grid) {
  let count = 0;
  const rowStart = Math.max(0, row - 1);
  const rowEnd = Math.min(ROWS - 1, row + 1);
  const colStart = Math.max(0, col - 1);
  const colEnd = Math.min(COLS - 1, col + 1);

  for (let y = rowStart; y <= rowEnd; y += 1) {
    for (let x = colStart; x <= colEnd; x += 1) {
      if (source[y][x]) count += 1;
    }
  }

  return source[row][col] ? count - 1 : count;
}

function stepGeneration() {
  const next = createGrid();

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const neighbors = countNeighbors(row, col);
      next[row][col] = neighbors === 3 || (grid[row][col] && neighbors === 2);
    }
  }

  grid = next;
  generation += 1;
  draw();
}

function draw() {
  const cellW = canvas.width / COLS;
  const cellH = canvas.height / ROWS;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#090b0d";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255,255,255,0.025)";
  ctx.lineWidth = 1;
  for (let col = 0; col <= COLS; col += 1) {
    const x = Math.round(col * cellW) + 0.5;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let row = 0; row <= ROWS; row += 1) {
    const y = Math.round(row * cellH) + 0.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  let alive = 0;
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      if (!grid[row][col]) continue;
      alive += 1;
      drawCell(col * cellW, row * cellH, cellW, cellH);
    }
  }

  generationEl.textContent = generation;
  aliveCountEl.textContent = alive;
}

function drawCell(x, y, width, height) {
  const inset = Math.max(1, Math.min(width, height) * 0.13);
  const top = y + inset;
  const left = x + inset;
  const right = x + width - inset;
  const bottom = y + height - inset;
  const bevel = Math.max(1, Math.min(width, height) * 0.2);

  ctx.fillStyle = "rgba(0, 0, 0, 0.34)";
  ctx.fillRect(left + bevel * 0.35, top + bevel * 0.42, right - left, bottom - top);

  ctx.fillStyle = "#15924b";
  ctx.fillRect(left, top, right - left, bottom - top);

  ctx.fillStyle = "#8efb79";
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(right, top);
  ctx.lineTo(right - bevel, top + bevel);
  ctx.lineTo(left + bevel, top + bevel);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#31c768";
  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left + bevel, top + bevel);
  ctx.lineTo(left + bevel, bottom - bevel);
  ctx.lineTo(left, bottom);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#0f663b";
  ctx.beginPath();
  ctx.moveTo(right, top);
  ctx.lineTo(right, bottom);
  ctx.lineTo(right - bevel, bottom - bevel);
  ctx.lineTo(right - bevel, top + bevel);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#0b4d30";
  ctx.beginPath();
  ctx.moveTo(left, bottom);
  ctx.lineTo(right, bottom);
  ctx.lineTo(right - bevel, bottom - bevel);
  ctx.lineTo(left + bevel, bottom - bevel);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#dfff78";
  ctx.fillRect(left + bevel * 0.9, top + bevel * 0.9, Math.max(1, width * 0.16), Math.max(1, height * 0.16));
}

function canvasCellFromEvent(event) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor(((event.clientX - rect.left) / rect.width) * COLS);
  const y = Math.floor(((event.clientY - rect.top) / rect.height) * ROWS);
  return {
    col: Math.max(0, Math.min(COLS - 1, x)),
    row: Math.max(0, Math.min(ROWS - 1, y)),
  };
}

function paintCell(event) {
  const { row, col } = canvasCellFromEvent(event);
  grid[row][col] = drawMode;
  cursorReadout.textContent = `X: ${String(col).padStart(3, "0")} Y: ${String(row).padStart(3, "0")}`;
  draw();
}

function setRunning(value) {
  running = value;
  playPauseButton.textContent = running ? "Pause" : "Start";
  playPauseButton.classList.toggle("danger", running);
}

function clearBoard() {
  grid = createGrid();
  generation = 0;
  setRunning(false);
  draw();
}

function randomize() {
  grid = createGrid().map((row) => row.map(() => Math.random() < 0.24));
  generation = 0;
  draw();
}

function addGlider() {
  clearBoard();
  const pattern = [
    [0, 1],
    [1, 2],
    [2, 0],
    [2, 1],
    [2, 2],
  ];
  const startRow = 3;
  const startCol = 3;
  pattern.forEach(([row, col]) => {
    grid[startRow + row][startCol + col] = true;
  });
  draw();
}

function loop(now) {
  const framesPerSecond = Number(speedInput.value);
  const interval = 1000 / framesPerSecond;
  if (running && now - lastTick >= interval) {
    stepGeneration();
    lastTick = now;
  }
  requestAnimationFrame(loop);
}

canvas.addEventListener("pointerdown", (event) => {
  pointerDown = true;
  canvas.setPointerCapture(event.pointerId);
  const { row, col } = canvasCellFromEvent(event);
  drawMode = !grid[row][col];
  paintCell(event);
});

canvas.addEventListener("pointermove", (event) => {
  const { row, col } = canvasCellFromEvent(event);
  cursorReadout.textContent = `X: ${String(col).padStart(3, "0")} Y: ${String(row).padStart(3, "0")}`;
  if (pointerDown) paintCell(event);
});

canvas.addEventListener("pointerup", () => {
  pointerDown = false;
});

canvas.addEventListener("pointerleave", () => {
  if (!pointerDown) cursorReadout.textContent = "X: -- Y: --";
});

playPauseButton.addEventListener("click", () => setRunning(!running));
stepButton.addEventListener("click", stepGeneration);
clearButton.addEventListener("click", clearBoard);
randomButton.addEventListener("click", randomize);
gliderButton.addEventListener("click", addGlider);

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    event.preventDefault();
    setRunning(!running);
  }
  if (event.key.toLowerCase() === "c") clearBoard();
  if (event.key.toLowerCase() === "r") randomize();
  if (event.key === "Enter") stepGeneration();
});

draw();
requestAnimationFrame(loop);
