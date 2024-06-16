// src/main.ts

const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const context = canvas.getContext("2d")!;
const scoreDisplay = document.getElementById("score") as HTMLElement;

const rows = 12;
const cols = 8;
const bubbleSize = 40;
const colors = ["red", "green", "blue", "yellow", "purple", "cyan"];
let bubbles: string[][] = [];
let currentBubble: {
  x: number;
  y: number;
  color: string;
  dx: number;
  dy: number;
};
let shooterAngle = 0;
let isShooting = false;
let score = 0;

function initializeGame() {
  // Initialize bubbles
  for (let row = 0; row < rows; row++) {
    bubbles[row] = [];
    for (let col = 0; col < cols; col++) {
      if (row < 5) {
        bubbles[row][col] = colors[Math.floor(Math.random() * colors.length)];
      } else {
        bubbles[row][col] = "";
      }
    }
  }

  // Initialize the current bubble
  currentBubble = {
    x: canvas.width / 2,
    y: canvas.height - bubbleSize,
    color: colors[Math.floor(Math.random() * colors.length)],
    dx: 0,
    dy: 0,
  };

  // Reset score
  score = 0;

  // Start the game loop
  requestAnimationFrame(gameLoop);
}

function gameLoop() {
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawBubbles();
  drawShooter();
  drawCurrentBubble();
  drawScore();
  if (isShooting) {
    moveCurrentBubble();
    checkCollision();
  }
  checkGameOver();
  requestAnimationFrame(gameLoop);
}

function drawBubbles() {
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (bubbles[row][col] !== "") {
        context.fillStyle = bubbles[row][col];
        context.beginPath();
        context.arc(
          col * bubbleSize + bubbleSize / 2,
          row * bubbleSize + bubbleSize / 2,
          bubbleSize / 2,
          0,
          Math.PI * 2
        );
        context.fill();
        context.stroke();
      }
    }
  }
}

function drawShooter() {
  context.strokeStyle = "white";
  context.lineWidth = 4;
  context.beginPath();
  const startX = canvas.width / 2;
  const startY = canvas.height;
  const endX = startX + 100 * Math.cos(shooterAngle);
  const endY = startY - 100 * Math.sin(shooterAngle);
  context.moveTo(startX, startY);
  context.lineTo(endX, endY);
  context.stroke();
}

function drawCurrentBubble() {
  context.fillStyle = currentBubble.color;
  context.beginPath();
  context.arc(currentBubble.x, currentBubble.y, bubbleSize / 2, 0, Math.PI * 2);
  context.fill();
  context.stroke();
}

function drawScore() {
  context.fillStyle = "white";
  context.font = "20px Arial";
  context.fillText("Score: " + score, 10, 20);
}

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  shooterAngle = Math.atan2(canvas.height - mouseY, mouseX - canvas.width / 2);
});

canvas.addEventListener("click", (event) => {
  if (!isShooting) {
    shootBubble();
  }
});

function shootBubble() {
  isShooting = true;
  currentBubble.dx = Math.cos(shooterAngle) * 5;
  currentBubble.dy = -Math.sin(shooterAngle) * 5;
}

function moveCurrentBubble() {
  currentBubble.x += currentBubble.dx;
  currentBubble.y += currentBubble.dy;

  // Check for wall collisions
  if (
    currentBubble.x - bubbleSize / 2 < 0 ||
    currentBubble.x + bubbleSize / 2 > canvas.width
  ) {
    currentBubble.dx = -currentBubble.dx;
  }
}

function checkCollision() {
  // Check if the bubble hits the top
  if (currentBubble.y - bubbleSize / 2 <= 0) {
    attachBubble();
    return;
  }

  // Check for collisions with other bubbles
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (bubbles[row][col] !== "") {
        const distX = col * bubbleSize + bubbleSize / 2 - currentBubble.x;
        const distY = row * bubbleSize + bubbleSize / 2 - currentBubble.y;
        const distance = Math.sqrt(distX * distX + distY * distY);
        if (distance < bubbleSize) {
          attachBubble();
          return;
        }
      }
    }
  }
}

function attachBubble() {
  isShooting = false;
  // Find the closest grid position
  const row = Math.floor(currentBubble.y / bubbleSize);
  const col = Math.floor(currentBubble.x / bubbleSize);
  if (row >= 0 && row < rows && col >= 0 && col < cols) {
    bubbles[row][col] = currentBubble.color;
    const matches = matchAndRemoveBubbles(row, col);
    if (matches >= 3) {
      score += matches * 10;
      dropFloatingBubbles();
    }
  }

  // Reset current bubble
  currentBubble = {
    x: canvas.width / 2,
    y: canvas.height - bubbleSize,
    color: colors[Math.floor(Math.random() * colors.length)],
    dx: 0,
    dy: 0,
  };
}

function matchAndRemoveBubbles(startRow: number, startCol: number): number {
  const color = bubbles[startRow][startCol];
  const visited: boolean[][] = [];
  for (let row = 0; row < rows; row++) {
    visited[row] = [];
    for (let col = 0; col < cols; col++) {
      visited[row][col] = false;
    }
  }
  const matches: { row: number; col: number }[] = [];
  const queue: { row: number; col: number }[] = [
    { row: startRow, col: startCol },
  ];
  while (queue.length > 0) {
    const { row, col } = queue.shift()!;
    if (
      row < 0 ||
      row >= rows ||
      col < 0 ||
      col >= cols ||
      visited[row][col] ||
      bubbles[row][col] !== color
    ) {
      continue;
    }
    visited[row][col] = true;
    matches.push({ row, col });
    queue.push({ row: row - 1, col });
    queue.push({ row: row + 1, col });
    queue.push({ row, col: col - 1 });
    queue.push({ row, col: col + 1 });
  }

  if (matches.length >= 3) {
    for (const match of matches) {
      bubbles[match.row][match.col] = "";
    }
  }
  const points = matches.length * 10 + (matches.length - 3) * 5; // Base points plus bonus for larger groups
  score += points;
  scoreDisplay.textContent = `Score: ${score}`;
  return matches.length;
}

function dropFloatingBubbles() {
  const visited: boolean[][] = [];
  for (let row = 0; row < rows; row++) {
    visited[row] = [];
    for (let col = 0; col < cols; col++) {
      visited[row][col] = false;
    }
  }

  function isFloating(row: number, col: number): boolean {
    if (
      row < 0 ||
      row >= rows ||
      col < 0 ||
      col >= cols ||
      bubbles[row][col] === "" ||
      visited[row][col]
    ) {
      return false;
    }
    if (row === 0) {
      return false;
    }
    visited[row][col] = true;
    return (
      isFloating(row - 1, col) &&
      isFloating(row + 1, col) &&
      isFloating(row, col - 1) &&
      isFloating(row, col + 1)
    );
  }

  let floatingBubbles = 0;
  for (let row = 1; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (
        bubbles[row][col] !== "" &&
        !visited[row][col] &&
        isFloating(row, col)
      ) {
        bubbles[row][col] = "";
        floatingBubbles++;
      }
    }
  }
  score += floatingBubbles * 5;
}

function checkGameOver() {
  for (let col = 0; col < cols; col++) {
    if (bubbles[rows - 1][col] !== "") {
      alert("Game Over! Final Score: " + score);
      initializeGame();
      return;
    }
  }
}

initializeGame();
