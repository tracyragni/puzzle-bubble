const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;

const BUBBLE_RADIUS = 20;
const BUBBLE_DIAMETER = BUBBLE_RADIUS * 2;
const ROWS = 5;
const COLUMNS = 10;
const colors = ['red', 'green', 'blue', 'yellow', 'purple'];

interface Bubble {
    x: number;
    y: number;
    color: string;
    dx?: number;
    dy?: number;
}

let bubbles: Bubble[] = [];
let shooterBubble: Bubble = {
    x: canvas.width / 2,
    y: canvas.height - BUBBLE_RADIUS,
    color: colors[Math.floor(Math.random() * colors.length)],
    dx: 0,
    dy: -5
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
function drawBubble(x: number, y: number, color: string) {
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
    shooterBubble.x += shooterBubble.dx as number;
    shooterBubble.y += shooterBubble.dy as number;

    // Check for collision with walls
    if (shooterBubble.x - BUBBLE_RADIUS <= 0 || shooterBubble.x + BUBBLE_RADIUS >= canvas.width) {
        shooterBubble.dx = -shooterBubble.dx! as number;
    }

    // Check for collision with top
    if (shooterBubble.y - BUBBLE_RADIUS <= 0) {
        checkAndRemoveMatchingBubbles(shooterBubble.x, shooterBubble.y, shooterBubble.color);
        resetShooterBubble();
    }

    // Check for collision with other bubbles
    for (let bubble of bubbles) {
        const dist = Math.hypot(bubble.x - shooterBubble.x, bubble.y - shooterBubble.y);
        if (dist < BUBBLE_DIAMETER) {
            checkAndRemoveMatchingBubbles(shooterBubble.x, shooterBubble.y, shooterBubble.color);
            resetShooterBubble();
            break;
        }
    }
}

// Reset shooter bubble position and color
function resetShooterBubble() {
    shooterBubble = {
        x: canvas.width / 2,
        y: canvas.height - BUBBLE_RADIUS,
        color: colors[Math.floor(Math.random() * colors.length)],
        dx: 0,
        dy: -5
    };
}

// Handle mouse movement for aiming
canvas.addEventListener('mousemove', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const angle = Math.atan2(mouseY - shooterBubble.y, mouseX - shooterBubble.x);
    shooterBubble.dx = 5 * Math.cos(angle) as number;
    shooterBubble.dy = 5 * Math.sin(angle);
});

// Handle mouse click for shooting
canvas.addEventListener('click', () => {
    const angle = Math.atan2(-5, 0);
    shooterBubble.dx = 5 * Math.cos(angle) as number;
    shooterBubble.dy = 5 * Math.sin(angle);
});

// Check and remove matching bubbles
function checkAndRemoveMatchingBubbles(x: number, y: number, color: string) {
    const newBubbles = [...bubbles, { x, y, color }];
    const clusters = findClusters(newBubbles, color);
    if (clusters.length >= 3) {
        const remainingBubbles = newBubbles.filter(bubble => !clusters.includes(bubble));
        bubbles = remainingBubbles;
    } else {
        bubbles = newBubbles;
    }
}

// Find clusters of bubbles
function findClusters(bubbles: Bubble[], color: string): Bubble[] {
    const clusters: Bubble[] = [];
    const visited = new Set<Bubble>();

    const dfs = (bubble: Bubble) => {
        if (visited.has(bubble) || bubble.color !== color) return;
        visited.add(bubble);
        clusters.push(bubble);

        bubbles.forEach(neighbor => {
            const dist = Math.hypot(bubble.x - neighbor.x, bubble.y - neighbor.y);
            if (dist < BUBBLE_DIAMETER) {
                dfs(neighbor);
            }
        });
    };

    bubbles.forEach(bubble => {
        if (!visited.has(bubble) && bubble.color === color) {
            dfs(bubble);
        }
    });

    return clusters;
}

// Game loop
function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBubbles();
    drawShooterBubble();
    updateShooterBubble();
    requestAnimationFrame(gameLoop);
}

// Initialize game
initBubbles();
gameLoop();
