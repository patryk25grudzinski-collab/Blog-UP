const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const terrain = [];

let currentPlayer = 1;
let projectiles = [];
let explosions = [];
let gameOver = false;
let selectedWeapon = "small";

let wind = Math.floor(Math.random() * 11) - 5;

let player1;
let player2;

const weapons = {
    small: { name: "Small Bomb", radius: 25, damage: 1, color: "black" },
    big: { name: "Big Bomb", radius: 45, damage: 2, color: "purple" },
    triple: { name: "Triple Shot", radius: 25, damage: 1, color: "black" },
    nuke: { name: "Nuke", radius: 80, damage: 3, color: "red" }
};

generateTerrain();
setupPlayers();

function generateTerrain() {

    terrain.length = 0;

    const centerX = canvas.width / 2;

    for (let x = 0; x < canvas.width; x++) {

        let baseHeight = canvas.height - 120;

        // duża góra na środku
        const distanceFromCenter = Math.abs(x - centerX);

        let mountainHeight =
            Math.max(
                0,
                300 - distanceFromCenter * 0.7
            );

        // losowe nierówności
        mountainHeight +=
            Math.sin(x * 0.02) * 20;

        terrain.push(
            baseHeight - mountainHeight
        );
    }
}

function getTankY(x) {
    const middle = Math.floor(x + 30);

    if (middle < 0 || middle >= terrain.length) {
        return canvas.height - 120;
    }

    return terrain[middle] - 40;
}

function setupPlayers() {
    player1 = {
        x: 100,
        y: getTankY(100),
        lives: 5,
        angle: 45,
        power: 50
    };

    player2 = {
        x: canvas.width - 180,
        y: getTankY(canvas.width - 180),
        lives: 5,
        angle: 135,
        power: 50
    };
}

function updateTankPositions() {

    const targetY1 = getTankY(player1.x);
    const targetY2 = getTankY(player2.x);

    if (player1.y < targetY1) {
        player1.y += 4;
    } else {
        player1.y = targetY1;
    }

    if (player2.y < targetY2) {
        player2.y += 4;
    } else {
        player2.y = targetY2;
    }
}

function getCurrentPlayer() {
    return currentPlayer === 1 ? player1 : player2;
}

function switchPlayer() {

    currentPlayer = currentPlayer === 1 ? 2 : 1;

    wind = Math.floor(Math.random() * 11) - 5;
}

function drawTerrain() {
    ctx.fillStyle = "#2ecc71";
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);

    for (let x = 0; x < terrain.length; x++) {
        ctx.lineTo(x, terrain[x]);
    }

    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#1e8449";
    ctx.lineWidth = 3;
    ctx.beginPath();

    for (let x = 0; x < terrain.length; x++) {
        if (x === 0) ctx.moveTo(x, terrain[x]);
        else ctx.lineTo(x, terrain[x]);
    }

    ctx.stroke();
}

function drawTank(player, color) {
    const x = player.x;
    const y = player.y;

    ctx.fillStyle = "#222";
    ctx.fillRect(x - 3, y + 28, 66, 14);

    ctx.fillStyle = "#555";

    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(x + 8 + i * 13, y + 35, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 28);
    ctx.lineTo(x + 55, y + 28);
    ctx.lineTo(x + 62, y + 12);
    ctx.lineTo(x - 2, y + 12);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x + 30, y + 10, 14, 0, Math.PI * 2);
    ctx.fill();

    const turretX = x + 30;
    const turretY = y + 10;
    const barrelLength = 45;

    const barrelEndX =
        turretX + Math.cos(player.angle * Math.PI / 180) * barrelLength;

    const barrelEndY =
        turretY - Math.sin(player.angle * Math.PI / 180) * barrelLength;

    ctx.strokeStyle = "#222";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(turretX, turretY);
    ctx.lineTo(barrelEndX, barrelEndY);
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillRect(x + 8, y + 15, 35, 4);
}

function createExplosion(x, y, radius) {
    explosions.push({
        x: x,
        y: y,
        radius: 1,
        maxRadius: radius
    });
}

function destroyTerrain(cx, cy, radius) {
    for (let x = Math.floor(cx - radius); x <= Math.floor(cx + radius); x++) {
        if (x >= 0 && x < terrain.length) {
            const dx = x - cx;
            const holeDepth = Math.sqrt(radius * radius - dx * dx);

            if (terrain[x] < cy + holeDepth) {
                terrain[x] = cy + holeDepth;
            }

            if (terrain[x] > canvas.height) {
                terrain[x] = canvas.height;
            }
        }
    }

    updateTankPositions();
}

function createProjectile(angleOffset = 0) {
    const p = getCurrentPlayer();
    const angle = p.angle + angleOffset;
    const weapon = weapons[selectedWeapon];

    return {
        x: p.x + 30 + Math.cos(angle * Math.PI / 180) * 45,
        y: p.y + 10 - Math.sin(angle * Math.PI / 180) * 45,
        vx: Math.cos(angle * Math.PI / 180) * (p.power / 2),
        vy: -Math.sin(angle * Math.PI / 180) * (p.power / 2),
        radius: weapon.radius,
        damage: weapon.damage,
        color: weapon.color
    };
}

function fire() {
    if (projectiles.length > 0 || gameOver) return;

    if (selectedWeapon === "triple") {
        projectiles.push(createProjectile(-6));
        projectiles.push(createProjectile(0));
        projectiles.push(createProjectile(6));
    } else {
        projectiles.push(createProjectile(0));
    }
}

function damageTankIfClose(tank, x, y, radius, damage) {
    const tankCenterX = tank.x + 30;
    const tankCenterY = tank.y + 20;

    const dx = tankCenterX - x;
    const dy = tankCenterY - y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < radius + 30) {
        tank.lives -= damage;

        if (tank.lives < 0) {
            tank.lives = 0;
        }
    }
}

function explodeProjectile(projectile) {
    createExplosion(projectile.x, projectile.y, projectile.radius);
    destroyTerrain(projectile.x, projectile.y, projectile.radius);

    damageTankIfClose(player1, projectile.x, projectile.y, projectile.radius, projectile.damage);
    damageTankIfClose(player2, projectile.x, projectile.y, projectile.radius, projectile.damage);
}

function checkGameOver() {
    if (player1.lives <= 0) {
        gameOver = true;
        currentPlayer = 2;
    }

    if (player2.lives <= 0) {
        gameOver = true;
        currentPlayer = 1;
    }
}

function updateProjectiles() {
    if (projectiles.length === 0) return;

    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];

        projectile.x += projectile.vx;
        projectile.y += projectile.vy;
        projectile.vy += 0.2;
        projectile.vx += wind * 0.003;

        const tx = Math.floor(projectile.x);

        if (
            tx >= 0 &&
            tx < terrain.length &&
            projectile.y >= terrain[tx]
        ) {
            explodeProjectile(projectile);
            projectiles.splice(i, 1);
            continue;
        }

        if (
            projectile.x < -100 ||
            projectile.x > canvas.width + 100 ||
            projectile.y > canvas.height + 100 ||
            projectile.y < -100
        ) {
            projectiles.splice(i, 1);
        }
    }

    if (projectiles.length === 0 && !gameOver) {
        checkGameOver();

        if (!gameOver) {
            switchPlayer();
        }
    }
}

function updateExplosions() {
    for (let i = explosions.length - 1; i >= 0; i--) {
        explosions[i].radius += 3;

        if (explosions[i].radius > explosions[i].maxRadius) {
            explosions.splice(i, 1);
        }
    }
}

function restartGame() {
    generateTerrain();

    currentPlayer = 1;
    projectiles = [];
    explosions = [];
    gameOver = false;
    selectedWeapon = "small";

    setupPlayers();
}

document.addEventListener("keydown", function(event) {
    if (event.key === "r" || event.key === "R") {
        restartGame();
        return;
    }

    if (gameOver) return;

    const p = getCurrentPlayer();
    if (event.key === "a" || event.key === "A") {

    p.x -= 15;

    if (p.x < 0) {
        p.x = 0;
    }

    updateTankPositions();
    }

    if (event.key === "d" || event.key === "D") {

    p.x += 15;

    if (p.x > canvas.width - 60) {
        p.x = canvas.width - 60;
    }

    updateTankPositions();
    }
    if (event.key === "1") selectedWeapon = "small";
    if (event.key === "2") selectedWeapon = "big";
    if (event.key === "3") selectedWeapon = "triple";
    if (event.key === "4") selectedWeapon = "nuke";

    if (event.key === "ArrowUp") p.angle++;
    if (event.key === "ArrowDown") p.angle--;

    if (event.key === "ArrowRight") p.power += 5;
    if (event.key === "ArrowLeft") p.power -= 5;

    if (event.code === "Space") {
        fire();
    }

    if (p.angle < 0) p.angle = 0;
    if (p.angle > 180) p.angle = 180;

    if (p.power < 10) p.power = 10;
    if (p.power > 250) p.power = 250;
});

function drawHealthBar(x, y, lives, color) {
    ctx.fillStyle = "#333";
    ctx.fillRect(x, y, 150, 18);

    ctx.fillStyle = color;
    ctx.fillRect(x, y, lives * 30, 18);

    ctx.strokeStyle = "black";
    ctx.strokeRect(x, y, 150, 18);
}

function drawUI() {
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";

    ctx.fillText("Player 1", 20, 25);
    drawHealthBar(100, 10, player1.lives, "#2ecc71");

    ctx.fillText("Player 2", canvas.width - 280, 25);
    drawHealthBar(canvas.width - 200, 10, player2.lives, "#e74c3c");

    if (!gameOver) {
        const p = getCurrentPlayer();

        ctx.fillText("Turn: Player " + currentPlayer, 20, 60);
        ctx.fillText("Angle: " + p.angle, 20, 90);
        ctx.fillText("Power: " + p.power, 20, 120);
        ctx.fillText("Weapon: " + weapons[selectedWeapon].name, 20, 150);
        ctx.fillText("Wind: " + wind, 20, 175);
        ctx.fillText("1 Small | 2 Big | 3 Triple | 4 Nuke", 20, 185);
        ctx.fillText("SPACE = Fire | R = Restart", 20, 215);
    }

    if (gameOver) {
        ctx.fillStyle = "red";
        ctx.font = "45px Arial";
        ctx.fillText("PLAYER " + currentPlayer + " WINS!", canvas.width / 2 - 220, canvas.height / 2);

        ctx.font = "22px Arial";
        ctx.fillText("Press R to restart", canvas.width / 2 - 80, canvas.height / 2 + 40);
    }
}

function drawBackground() {
    ctx.fillStyle = "skyblue";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(canvas.width - 100, 90, 40, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(150, 80, 25, 0, Math.PI * 2);
    ctx.arc(180, 70, 35, 0, Math.PI * 2);
    ctx.arc(220, 80, 25, 0, Math.PI * 2);
    ctx.fill();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();
    drawTerrain();

    drawTank(player1, "#2ecc71");
    drawTank(player2, "#e74c3c");

    for (let projectile of projectiles) {
        ctx.fillStyle = projectile.color;

        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    for (let explosion of explosions) {
        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "yellow";
        ctx.beginPath();
        ctx.arc(explosion.x, explosion.y, explosion.radius / 2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawUI();
}

function gameLoop() {

    updateProjectiles();
    updateExplosions();
    updateTankPositions();

    draw();

    requestAnimationFrame(gameLoop);
}

gameLoop();