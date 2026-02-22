const canvas = document.getElementById("view");
const ctx = canvas.getContext("2d");
const cellsEl = document.getElementById("cells");
const powerEl = document.getElementById("power");
const statusEl = document.getElementById("status");
const restartBtn = document.getElementById("restartBtn");

const MAP = [
  "111111111111",
  "100000001001",
  "101110101001",
  "101000101001",
  "101011101001",
  "100010001001",
  "111010111001",
  "100010000001",
  "101111011101",
  "1000000000E1",
  "111111111111"
];

const FOV = Math.PI / 3;
const RAYS = canvas.width;
let keys = {};
let over = false;
let won = false;
let last = performance.now();

const state = {
  player: { x: 1.5, y: 1.5, a: 0, speed: 2.1 },
  animatronic: { x: 9.5, y: 8.5, cooldown: 0.8 },
  batteries: [],
  collected: 0,
  power: 100,
  seenTimer: 0
};

function resetGame() {
  state.player = { x: 1.5, y: 1.5, a: 0, speed: 2.1 };
  state.animatronic = { x: 9.5, y: 8.5, cooldown: 0.8 };
  state.batteries = [
    { x: 2.5, y: 8.5, taken: false },
    { x: 7.5, y: 3.5, taken: false },
    { x: 10.5, y: 1.5, taken: false },
    { x: 5.5, y: 9.5, taken: false }
  ];
  state.collected = 0;
  state.power = 100;
  state.seenTimer = 0;
  over = false;
  won = false;
  cellsEl.textContent = "0";
  powerEl.textContent = "100";
  statusEl.textContent = "Stay hidden.";
  last = performance.now();
  requestAnimationFrame(loop);
}

function isWall(x, y) {
  const mx = Math.floor(x);
  const my = Math.floor(y);
  return MAP[my]?.[mx] === "1";
}

function isExit(x, y) {
  const mx = Math.floor(x);
  const my = Math.floor(y);
  return MAP[my]?.[mx] === "E";
}

function movePlayer(dt) {
  const p = state.player;
  const turn = (keys.ArrowLeft ? -1 : 0) + (keys.ArrowRight ? 1 : 0);
  p.a += turn * 1.8 * dt;

  const move = (keys.w ? 1 : 0) + (keys.s ? -1 : 0);
  const strafe = (keys.d ? 1 : 0) + (keys.a ? -1 : 0);
  const sprint = keys.Shift ? 1.65 : 1;
  const speed = p.speed * sprint;

  const nx = p.x + (Math.cos(p.a) * move - Math.sin(p.a) * strafe) * speed * dt;
  const ny = p.y + (Math.sin(p.a) * move + Math.cos(p.a) * strafe) * speed * dt;
  if (!isWall(nx, p.y)) p.x = nx;
  if (!isWall(p.x, ny)) p.y = ny;

  state.power = Math.max(0, state.power - dt * (sprint > 1 ? 3.6 : 1.4));
  powerEl.textContent = String(Math.round(state.power));
}

function updateAnimatronic(dt) {
  const a = state.animatronic;
  const p = state.player;
  a.cooldown -= dt;
  if (a.cooldown <= 0) {
    const dx = p.x - a.x;
    const dy = p.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const step = state.power > 0 ? 0.36 : 0.52;
    const nx = a.x + (dx / len) * step;
    const ny = a.y + (dy / len) * step;
    if (!isWall(nx, a.y)) a.x = nx;
    if (!isWall(a.x, ny)) a.y = ny;
    a.cooldown = 0.35;
  }

  const dist = Math.hypot(p.x - a.x, p.y - a.y);
  if (dist < 0.55) {
    over = true;
    statusEl.textContent = "Jumpscared! Restart to try again.";
  } else if (dist < 2.2) {
    state.seenTimer += dt;
    statusEl.textContent = "You hear metal footsteps...";
  } else {
    state.seenTimer = Math.max(0, state.seenTimer - dt * 2);
  }
}

function collectBatteries() {
  const p = state.player;
  state.batteries.forEach((b) => {
    if (!b.taken && Math.hypot(p.x - b.x, p.y - b.y) < 0.45) {
      b.taken = true;
      state.collected += 1;
      state.power = Math.min(100, state.power + 20);
      cellsEl.textContent = String(state.collected);
      statusEl.textContent = "Battery found.";
    }
  });

  if (state.collected === state.batteries.length && isExit(p.x, p.y)) {
    won = true;
    over = true;
    statusEl.textContent = "6AM! You escaped the pizzeria.";
  }
}

function raycast(rayAngle) {
  let d = 0;
  while (d < 20) {
    d += 0.02;
    const x = state.player.x + Math.cos(rayAngle) * d;
    const y = state.player.y + Math.sin(rayAngle) * d;
    if (isWall(x, y)) return d;
  }
  return 20;
}

function draw3D() {
  const halfH = canvas.height / 2;
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, canvas.width, halfH);
  ctx.fillStyle = "#161616";
  ctx.fillRect(0, halfH, canvas.width, halfH);

  for (let x = 0; x < RAYS; x++) {
    const rayA = state.player.a - FOV / 2 + (x / RAYS) * FOV;
    let dist = raycast(rayA);
    dist *= Math.cos(rayA - state.player.a);
    const h = Math.min(canvas.height, (canvas.height * 0.9) / (dist + 0.0001));
    const shade = Math.max(20, 240 - dist * 30);
    ctx.fillStyle = `rgb(${shade * 0.42},${shade * 0.16},${shade * 0.16})`;
    ctx.fillRect(x, halfH - h / 2, 1, h);
  }

  drawSprite(state.animatronic.x, state.animatronic.y, "#d73333", 1.1);
  state.batteries.filter((b) => !b.taken).forEach((b) => drawSprite(b.x, b.y, "#e4c75f", 0.6));

  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2 - 8, canvas.height / 2);
  ctx.lineTo(canvas.width / 2 + 8, canvas.height / 2);
  ctx.moveTo(canvas.width / 2, canvas.height / 2 - 8);
  ctx.lineTo(canvas.width / 2, canvas.height / 2 + 8);
  ctx.stroke();
}

function drawSprite(sx, sy, color, size) {
  const p = state.player;
  const dx = sx - p.x;
  const dy = sy - p.y;
  const dist = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) - p.a;
  const norm = Math.atan2(Math.sin(angle), Math.cos(angle));
  if (Math.abs(norm) > FOV / 1.8 || dist < 0.3) return;

  const screenX = ((norm + FOV / 2) / FOV) * canvas.width;
  const spriteH = (canvas.height / dist) * 0.7 * size;
  const spriteW = spriteH * 0.5;
  ctx.fillStyle = color;
  ctx.globalAlpha = Math.max(0.25, 1 - dist / 9);
  ctx.fillRect(screenX - spriteW / 2, canvas.height / 2 - spriteH / 2, spriteW, spriteH);
  ctx.globalAlpha = 1;
}

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!over) {
    movePlayer(dt);
    updateAnimatronic(dt);
    collectBatteries();
  }
  draw3D();
  if (!won && !over && state.collected === state.batteries.length) {
    statusEl.textContent = "All cells found. Reach the EXIT tile.";
  }
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (e) => { keys[e.key] = true; });
window.addEventListener("keyup", (e) => { keys[e.key] = false; });

document.querySelectorAll(".touch-grid button").forEach((btn) => {
  const key = btn.dataset.key;
  btn.addEventListener("pointerdown", () => { keys[key] = true; });
  ["pointerup", "pointerleave", "pointercancel"].forEach((evt) => {
    btn.addEventListener(evt, () => { keys[key] = false; });
  });
});

restartBtn.addEventListener("click", resetGame);
resetGame();
