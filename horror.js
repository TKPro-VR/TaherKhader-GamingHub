const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const keyCountEl = document.getElementById("keyCount");
const timerEl = document.getElementById("timer");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restartBtn");

const tile = 40;
const cols = canvas.width / tile;
const rows = canvas.height / tile;

const walls = new Set([
  "3,1", "3,2", "3,3", "3,4", "3,5", "8,2", "8,3", "8,4", "8,5", "5,6", "6,6", "7,6", "10,1", "10,2", "1,7", "2,7", "3,7", "11,7", "12,7", "13,7"
]);

let keys;
let player;
let shadow;
let pressed;
let lastTime;
let startTime;
let gameOver;

function resetGame() {
  keys = [
    { x: 1, y: 1, found: false },
    { x: 13, y: 1, found: false },
    { x: 7, y: 8, found: false }
  ];

  player = { x: 1, y: 8, speed: 3 };
  shadow = { x: 13, y: 8, speed: 1.9 };
  pressed = {};
  gameOver = false;
  lastTime = performance.now();
  startTime = performance.now();
  statusEl.textContent = "Collect 3 keys and escape the night.";
  requestAnimationFrame(loop);
}

function canMove(nx, ny) {
  const cx = Math.floor(nx / tile);
  const cy = Math.floor(ny / tile);
  return cx >= 0 && cx < cols && cy >= 0 && cy < rows && !walls.has(`${cx},${cy}`);
}

function update(dt) {
  if (gameOver) {
    return;
  }

  let vx = 0;
  let vy = 0;

  if (pressed.ArrowLeft || pressed.a) vx -= 1;
  if (pressed.ArrowRight || pressed.d) vx += 1;
  if (pressed.ArrowUp || pressed.w) vy -= 1;
  if (pressed.ArrowDown || pressed.s) vy += 1;

  const speed = player.speed * dt;
  const nx = player.x + vx * speed;
  const ny = player.y + vy * speed;

  if (canMove(nx, player.y)) player.x = nx;
  if (canMove(player.x, ny)) player.y = ny;

  const dx = player.x - shadow.x;
  const dy = player.y - shadow.y;
  const len = Math.hypot(dx, dy) || 1;
  const sx = shadow.x + (dx / len) * shadow.speed * dt;
  const sy = shadow.y + (dy / len) * shadow.speed * dt;

  if (canMove(sx, shadow.y)) shadow.x = sx;
  if (canMove(shadow.x, sy)) shadow.y = sy;

  let foundCount = 0;
  keys.forEach((k) => {
    if (!k.found && Math.hypot(player.x - k.x * tile - tile / 2, player.y - k.y * tile - tile / 2) < 20) {
      k.found = true;
      statusEl.textContent = "You found a key... keep moving!";
    }
    if (k.found) foundCount += 1;
  });

  if (Math.hypot(player.x - shadow.x, player.y - shadow.y) < 16) {
    gameOver = true;
    statusEl.textContent = "The shadow found you. Press restart to try again.";
  } else if (foundCount === keys.length) {
    gameOver = true;
    statusEl.textContent = "You survived the hallway. Dawn wins.";
  }

  keyCountEl.textContent = String(foundCount);
  timerEl.textContent = Math.floor((performance.now() - startTime) / 1000);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#101010";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  walls.forEach((w) => {
    const [x, y] = w.split(",").map(Number);
    ctx.fillStyle = "#262626";
    ctx.fillRect(x * tile, y * tile, tile, tile);
  });

  keys.forEach((k) => {
    if (!k.found) {
      ctx.fillStyle = "#d8c66b";
      ctx.beginPath();
      ctx.arc(k.x * tile + tile / 2, k.y * tile + tile / 2, 8, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  ctx.fillStyle = "#72a6ff";
  ctx.beginPath();
  ctx.arc(player.x, player.y, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ae1515";
  ctx.beginPath();
  ctx.arc(shadow.x, shadow.y, 13, 0, Math.PI * 2);
  ctx.fill();

  const grad = ctx.createRadialGradient(player.x, player.y, 35, player.x, player.y, 180);
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, "rgba(0,0,0,0.86)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function loop(now) {
  const dt = Math.min((now - lastTime) / 16.67, 2);
  lastTime = now;
  update(dt);
  draw();
  if (!gameOver) {
    requestAnimationFrame(loop);
  }
}

function setKeyState(key, value) {
  pressed[key] = value;
}

window.addEventListener("keydown", (e) => {
  pressed[e.key] = true;
});

window.addEventListener("keyup", (e) => {
  pressed[e.key] = false;
});

document.querySelectorAll(".ctrl").forEach((btn) => {
  const key = btn.dataset.key;
  btn.addEventListener("pointerdown", () => setKeyState(key, true));
  btn.addEventListener("pointerup", () => setKeyState(key, false));
  btn.addEventListener("pointerleave", () => setKeyState(key, false));
  btn.addEventListener("pointercancel", () => setKeyState(key, false));
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js");
  });
}

restartBtn.addEventListener("click", resetGame);

resetGame();
