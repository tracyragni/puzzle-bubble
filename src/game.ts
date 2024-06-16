import { getRandomInt } from "./utils";

const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const context = canvas.getContext("2d")!;

canvas.width = 800;
canvas.height = 600;

const bubbleRadius = 20;
const bubbles: { x: number; y: number; color: string }[] = [];
const colors = ["red", "green", "blue", "yellow"];
let currentBubble: {
  x: number;
  y: number;
  color: string;
  dx: number;
  dy: number;
} | null = null;
let gameState: "playing" | "gameOver" = "playing";
let isShooting = false;
let shootAngle = 0;
let remainingTries = 3;
let score = 0;
let nextTryScoreThreshold = 1000;

// Create initial bubbles
for (let i = 0; i < 5; i++) {
  const x = getRandomInt(bubbleRadius, canvas.width - bubbleRadius);
  const y = getRandomInt(bubbleRadius, canvas.height / 2);
  const color = colors[Math.floor(Math.random() * colors.length)];
  bubbles.push({ x, y, color });
}

function createBubble() {
  const x = canvas.width / 2;
  const y = canvas.height - bubbleRadius;
  const color = colors[Math.floor(Math.random() * colors.length)];
  currentBubble = { x, y, color, dx: 0, dy: 0 };
}

function drawBubble(bubble: { x: number; y: number; color: string }) {
  context.beginPath();
  context.arc(bubble.x, bubble.y, bubbleRadius, 0, Math.PI * 2);
  context.fillStyle = bubble.color;
  context.fill();
  context.closePath();
}

function drawArrow(angle: number) {
  const length = 50;
  const arrowX = currentBubble!.x + length * Math.cos(angle);
  const arrowY = currentBubble!.y + length * Math.sin(angle);

  context.beginPath();
  context.moveTo(currentBubble!.x, currentBubble!.y);
  context.lineTo(arrowX, arrowY);
  context.strokeStyle = "black";
  context.lineWidth = 2;
  context.stroke();
  context.closePath();
}

function detectCollision(bubble: { x: number; y: number; color: string }) {
  for (const otherBubble of bubbles) {
    const dist = Math.hypot(bubble.x - otherBubble.x, bubble.y - otherBubble.y);
    if (dist < bubbleRadius * 2) {
      return true;
    }
  }
  return false;
}

function findCluster(
  bubble: { x: number; y: number; color: string },
  visited: Set<{ x: number; y: number }>
): { x: number; y: number; color: string }[] {
  const cluster = [];
  const stack = [bubble];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (!visited.has(current)) {
      visited.add(current);
      cluster.push(current);

      for (const otherBubble of bubbles) {
        const dist = Math.hypot(
          current.x - otherBubble.x,
          current.y - otherBubble.y
        );
        if (
          dist < bubbleRadius * 2 &&
          current.color === otherBubble.color &&
          !visited.has(otherBubble)
        ) {
          stack.push(otherBubble);
        }
      }
    }
  }

  return cluster;
}

function removeClusters() {
  const visited = new Set<{ x: number; y: number }>();

  for (const bubble of bubbles) {
    if (!visited.has(bubble)) {
      const cluster = findCluster(bubble, visited);
      if (cluster.length >= 3) {
        score += cluster.length * 100;
        for (const clusteredBubble of cluster) {
          const index = bubbles.indexOf(clusteredBubble);
          if (index !== -1) {
            bubbles.splice(index, 1);
          }
        }
      }
    }
  }

  if (score >= nextTryScoreThreshold) {
    remainingTries += 1;
    nextTryScoreThreshold += 1000;
  }
}

function launchBubble(angle: number) {
  if (currentBubble) {
    currentBubble.dx = Math.cos(angle) * 5;
    currentBubble.dy = Math.sin(angle) * 5;
    isShooting = true;
  }
}

function update() {
  // Clear the canvas with white background
  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);

  if (currentBubble) {
    if (isShooting) {
      currentBubble.x += currentBubble.dx;
      currentBubble.y += currentBubble.dy;

      if (
        currentBubble.x < bubbleRadius ||
        currentBubble.x > canvas.width - bubbleRadius
      ) {
        currentBubble.dx *= -1;
      }

      if (currentBubble.y < bubbleRadius) {
        currentBubble.dy *= -1;
      }

      if (currentBubble.y > canvas.height - bubbleRadius) {
        remainingTries -= 1;
        if (remainingTries <= 0) {
          gameState = "gameOver";
        } else {
          currentBubble = null;
          isShooting = false;
          createBubble();
        }
      }

      if (detectCollision(currentBubble)) {
        bubbles.push({
          x: currentBubble.x,
          y: currentBubble.y,
          color: currentBubble.color,
        });
        currentBubble = null;
        isShooting = false;
        removeClusters();
        createBubble();
      }
    }

    drawBubble(currentBubble);

    if (!isShooting) {
      drawArrow(shootAngle);
    }
  }

  for (const bubble of bubbles) {
    drawBubble(bubble);
  }

  checkGameOver();

  if (gameState === "playing") {
    context.font = "24px Arial";
    context.fillStyle = "black";
    context.fillText(`Tries remaining: ${remainingTries}`, 10, 30);
    context.fillText(`Score: ${score}`, 10, 60);
    requestAnimationFrame(update);
  } else {
    context.font = "48px serif";
    context.fillStyle = "black";
    context.textAlign = "center";
    context.fillText("Game Over", canvas.width / 2, canvas.height / 2);
    context.fillText(
      `Final Score: ${score}`,
      canvas.width / 2,
      canvas.height / 2 + 50
    );
  }
}

function checkGameOver() {
  for (const bubble of bubbles) {
    if (bubble.y + bubbleRadius > canvas.height - bubbleRadius) {
      gameState = "gameOver";
      return;
    }
  }
}

export function startGame() {
  createBubble();
  update();
}

// Mouse controls for launching bubbles
canvas.addEventListener("mousemove", (event) => {
  if (currentBubble && !isShooting) {
    const rect = canvas.getBoundingClientRect();
    shootAngle = Math.atan2(
      event.clientY - rect.top - currentBubble.y,
      event.clientX - rect.left - currentBubble.x
    );
  }
});

canvas.addEventListener("click", (event) => {
  if (currentBubble && !isShooting) {
    launchBubble(shootAngle);
  }
});
