const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

const BUBBLE_RADIUS = 20;
const BUBBLE_DIAMETER = BUBBLE_RADIUS * 2;
const ROWS = 5;
const COLUMNS = 12; // Limit the width to 12 bubbles
const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'black'];

let bubbles: { x: number, y: number, color: string }[] = [];
let shooterBubble = {
    x: canvas.width / 2,
    y: canvas.height - BUBBLE_RADIUS,
    dx: 0,
    dy: -5,
    color: colors[Math.floor(Math.random() * colors.length)]
};

// Initialize bubbles
function initBubbles() {
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLUMNS; col++) {
            const x = col * BUBBLE_DIAMETER + BUBBLE_RADIUS;
            const y = row * BUBBLE_DIAMETER + BUBBLE_RADIUS;
            const color = colors[Math.floor(Math.random() * colors.length)];
            bubbles.push({ x, y, color });
        }
    }
}

// Draw a single bubble
function drawBubble(x : number, y: number, color: string) {

    ctx.beginPath();
    ctx.arc(x, y, BUBBLE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
}

// Draw all bubbles
function drawBubbles() {
    bubbles.forEach(bubble => {
        drawBubble(bubble.x, bubble.y, bubble.color);
    });
}

// Draw the shooter bubble
function drawShooterBubble() {
    drawBubble(shooterBubble.x, shooterBubble.y, shooterBubble.color);
}

// Update shooter bubble position
function updateShooterBubble() {
    shooterBubble.x += shooterBubble.dx;
    shooterBubble.y += shooterBubble.dy;

    // Prevent bubble from moving backwards
    if (shooterBubble.dy > 0) {
        shooterBubble.dy = -5;
    }

    // Check for collision with walls
    if (shooterBubble.x - BUBBLE_RADIUS <= 0 || shooterBubble.x + BUBBLE_RADIUS >= canvas.width) {
        shooterBubble.dx = -shooterBubble.dx;
    }

    // Check for collision with top
    if (shooterBubble.y - BUBBLE_RADIUS <= 0) {
        bubbles.push({ ...shooterBubble });
        resetShooterBubble();
    }

    // Check for collision with other bubbles
    for (let i = 0; i < bubbles.length; i++) {
        const bubble = bubbles[i];
        const dist = Math.hypot(bubble.x - shooterBubble.x, bubble.y - shooterBubble.y);
        if (dist < BUBBLE_DIAMETER) {
            // Calculate the closest grid position for the new bubble
            let gridX = Math.round(shooterBubble.x / BUBBLE_DIAMETER) * BUBBLE_DIAMETER;
            let gridY = Math.round(shooterBubble.y / BUBBLE_DIAMETER) * BUBBLE_DIAMETER;

            // Adjust the new bubble's position based on the direction of the shooter bubble
            if (shooterBubble.dx > 0) {
                gridX = Math.floor(shooterBubble.x / BUBBLE_DIAMETER) * BUBBLE_DIAMETER;
            } else if (shooterBubble.dx < 0) {
                gridX = Math.ceil(shooterBubble.x / BUBBLE_DIAMETER) * BUBBLE_DIAMETER;
            }

            // Check if the new position is already occupied by another bubble
            const isOccupied = bubbles.some(b => b.x === gridX && b.y === gridY);
            if (!isOccupied) {
                // Add the shooter bubble to the bubbles array at the new position
                bubbles.push({ x: gridX, y: gridY, color: shooterBubble.color });
                resetShooterBubble();
                break;
            }
        }
    }

    checkForStacks(shooterBubble.color === 'black');
}

function checkForStacks(isBlack: boolean) {
    const visited = new Set();
    for (const bubble of bubbles) {
        if (!visited.has(bubble)) {
            const stack = [];
            const queue = [bubble];
            visited.add(bubble);
            while (queue.length > 0) {
                const current = queue.shift()!;
                stack.push(current);
                for (const neighbor of bubbles) {
                    if (!visited.has(neighbor) && (isBlack || neighbor.color === current.color) && Math.abs(neighbor.x - current.x) <= BUBBLE_DIAMETER && Math.abs(neighbor.y - current.y) <= BUBBLE_DIAMETER) {
                        queue.push(neighbor);
                        visited.add(neighbor);
                    }
                }
            }
            if ((stack.length === 3 && isBlack) || (stack.length >= 3 && !isBlack)) {
                for (const bubble of stack) {
                    const index = bubbles.indexOf(bubble);
                    if (index !== -1) {
                        bubbles.splice(index, 1);
                    }
                }
            }
        }
    }
}

// Reset shooter bubble position and color
function resetShooterBubble() {
    shooterBubble.x = canvas.width / 2;
    shooterBubble.y = canvas.height - BUBBLE_RADIUS;
    shooterBubble.dx = 0;
    shooterBubble.dy = -5;
    shooterBubble.color = colors[Math.floor(Math.random() * colors.length)];
}

// AI player
function aiPlayer() {
    const maxColor = shooterBubble.color;

    // Find the first bubble of the maxColor
    const targetBubble = bubbles.find(bubble => bubble.color === maxColor);

    if (targetBubble) {
        // Calculate the angle to the target bubble
        const angle = Math.atan2(targetBubble.y - shooterBubble.y, targetBubble.x - shooterBubble.x);
        shooterBubble.dx = 5 * Math.cos(angle);
        shooterBubble.dy = 5 * Math.sin(angle);
    }
}

// Handle mouse movement for aiming
canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const angle = Math.atan2(mouseY - shooterBubble.y, mouseX - shooterBubble.x);
    shooterBubble.dx = 5 * Math.cos(angle);
    shooterBubble.dy = 5 * Math.sin(angle);
});

// Handle mouse click for shooting
canvas.addEventListener('click', () => {
    const angle = Math.atan2(-5, 0);
    shooterBubble.dx = 5 * Math.cos(angle);
    shooterBubble.dy = 5 * Math.sin(angle);
});

const bubbleCounter = document.getElementById('bubbleCounter');

// Update game loop to include AI player
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBubbles();
    drawShooterBubble();
    updateShooterBubble();
    aiPlayer();
    if (bubbleCounter) {
        bubbleCounter.textContent = `Remaining Bubbles: ${bubbles.length}`;
    }
    requestAnimationFrame(gameLoop);
}

// Handle keyboard arrow keys for moving
document.addEventListener('keydown', (event) => {
    const speed = 5;
    switch (event.key) {
        case 'ArrowLeft':
            shooterBubble.dx = -speed;
            break;
        case 'ArrowRight':
            shooterBubble.dx = speed;
            break;
    }
});

// Handle keyboard arrow keys for stopping
document.addEventListener('keyup', (event) => {
    switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowRight':
            shooterBubble.dx = 0;
            break;
    }
});

// Initialize game
initBubbles();
gameLoop();