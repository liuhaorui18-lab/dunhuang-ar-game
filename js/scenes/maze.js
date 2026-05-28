/* ═══════════════════════════════════════════════════════
   敦煌复苏计划 — maze.js
   程序员：数据迷宫（倾斜手机控制小球）
   ═══════════════════════════════════════════════════════ */

const MAZE = {
  canvas: null, ctx: null,
  cols: 15, rows: 20,
  cellSize: 28,
  grid: [],
  player: { x: 0, y: 0 },
  exit: { x: 0, y: 0 },
  done: false,
  animId: null,
};

function initMaze() {
  const cfg = GameConfig.maze;
  MAZE.cols = cfg.cols;
  MAZE.rows = cfg.rows;
  MAZE.cellSize = cfg.cellSize;
  MAZE.done = false;

  MAZE.canvas = document.getElementById('maze-canvas');
  MAZE.ctx = MAZE.canvas.getContext('2d');

  // Generate maze
  MAZE.grid = generateMaze(MAZE.cols, MAZE.rows);

  // Player at top-left
  MAZE.player = { x: 1, y: 1 };
  // Exit at bottom-right
  MAZE.exit = { x: MAZE.cols - 2, y: MAZE.rows - 2 };

  MAZE.canvas.width = MAZE.cols * MAZE.cellSize;
  MAZE.canvas.height = MAZE.rows * MAZE.cellSize;

  MAZE.canvas.style.maxWidth = '90vw';
  MAZE.canvas.style.maxHeight = '65vh';
  // Scale down if needed
  const scaleX = window.innerWidth * 0.9 / (MAZE.cols * MAZE.cellSize);
  const scaleY = window.innerHeight * 0.65 / (MAZE.rows * MAZE.cellSize);
  const scale = Math.min(scaleX, scaleY, 1.5);
  MAZE.canvas.style.width = (MAZE.cols * MAZE.cellSize * scale) + 'px';
  MAZE.canvas.style.height = (MAZE.rows * MAZE.cellSize * scale) + 'px';

  renderMaze();

  // Motion controls
  Motion.on(mazeMotion);

  // Keyboard controls
  const keyHandler = e => {
    if (SM.current !== 'scene-maze') return;
    if (MAZE.done) return;
    movePlayer(e.key);
  };
  window.addEventListener('keydown', keyHandler);
  MAZE._keyHandler = keyHandler;

  // Skip button
  document.getElementById('maze-skip-btn').addEventListener('click', () => {
    MAZE.done = true;
    cancelAnimationFrame(MAZE.animId);
    Motion.off(mazeMotion);
    window.removeEventListener('keydown', MAZE._keyHandler);
    Dialogue.play(Dialogues.prog_maze_success).then(() => {
      showProgCountdown();
    });
  });
}

function generateMaze(cols, rows) {
  const grid = [];
  for (let y = 0; y < rows; y++) {
    grid[y] = [];
    for (let x = 0; x < cols; x++) {
      grid[y][x] = { wall: true, visited: false };
    }
  }

  // Randomized DFS
  function carve(x, y) {
    grid[y][x].wall = false;
    grid[y][x].visited = true;
    const dirs = shuffle([[2,0],[-2,0],[0,2],[0,-2]]);
    dirs.forEach(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      if (nx > 0 && nx < cols - 1 && ny > 0 && ny < rows - 1 && !grid[ny][nx].visited) {
        grid[y + dy/2][x + dx/2].wall = false;
        carve(nx, ny);
      }
    });
  }
  carve(1, 1);

  // Ensure exit path
  grid[rows - 2][cols - 2].wall = false;

  return grid;
}

function mazeMotion(data) {
  if (MAZE.done) return;
  if (data.type !== 'orient' && data.type !== 'motion') return;
  // Use gamma (left-right) and beta (forward-back)
  const dx = data.gamma ? clamp(data.gamma / 30, -1, 1) : 0;
  const dy = data.beta ? clamp(data.beta / 30, -1, 1) : 0;

  if (Math.abs(dx) > 0.15 || Math.abs(dy) > 0.15) {
    const dir = Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft')
      : (dy > 0 ? 'ArrowDown' : 'ArrowUp');
    movePlayer(dir);
  }
}

function movePlayer(key) {
  if (MAZE.done) return;
  let { x, y } = MAZE.player;
  let nx = x, ny = y;

  switch (key) {
    case 'ArrowUp':    ny--; break;
    case 'ArrowDown':  ny++; break;
    case 'ArrowLeft':  nx--; break;
    case 'ArrowRight': nx++; break;
    default: return;
  }

  // Bounds and wall check
  if (nx < 0 || ny < 0 || nx >= MAZE.cols || ny >= MAZE.rows) return;
  if (MAZE.grid[ny] && MAZE.grid[ny][nx] && MAZE.grid[ny][nx].wall) return;

  MAZE.player.x = nx;
  MAZE.player.y = ny;
  renderMaze();

  // Check exit
  if (nx === MAZE.exit.x && ny === MAZE.exit.y) {
    MAZE.done = true;
    Motion.off(mazeMotion);
    window.removeEventListener('keydown', MAZE._keyHandler);
    cancelAnimationFrame(MAZE.animId);
    toast('找到出口了！', 'prog', 2000);
    setTimeout(() => {
      Dialogue.play(Dialogues.prog_maze_success).then(() => {
        showProgCountdown();
      });
    }, 800);
  }
}

function renderMaze() {
  const ctx = MAZE.ctx;
  const cs = MAZE.cellSize;
  const { x: px, y: py } = MAZE.player;
  const { x: ex, y: ey } = MAZE.exit;

  ctx.clearRect(0, 0, MAZE.canvas.width, MAZE.canvas.height);

  for (let y = 0; y < MAZE.rows; y++) {
    for (let x = 0; x < MAZE.cols; x++) {
      if (MAZE.grid[y][x].wall) {
        ctx.fillStyle = 'rgba(0,212,255,0.06)';
        ctx.fillRect(x * cs, y * cs, cs, cs);
        ctx.strokeStyle = 'rgba(0,212,255,0.08)';
        ctx.strokeRect(x * cs, y * cs, cs, cs);
      }
    }
  }

  // Exit
  ctx.fillStyle = 'rgba(0,255,100,0.15)';
  ctx.fillRect(ex * cs, ey * cs, cs, cs);
  ctx.fillStyle = '#0f0';
  ctx.font = `${cs}px sans-serif`;
  ctx.fillText('🚪', ex * cs, ey * cs + cs - 2);

  // Player
  ctx.fillStyle = '#00D4FF';
  ctx.beginPath();
  ctx.arc(px * cs + cs / 2, py * cs + cs / 2, cs / 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.stroke();

  MAZE.animId = requestAnimationFrame(renderMaze);
}

// ─── Programmer Countdown ──────────────────────────────
function showProgCountdown() {
  GameState.calcCountdown();
  const display = `${GameState.countdownMinutes}:${GameState.countdownSeconds.toString().padStart(2, '0')}`;

  const modal = Modal.create({
    theme: 'prog',
    title: '⚠ 洞窟坍塌倒计时',
    content: `<p>洞窟将在 <span style="font-size:20px;color:var(--prog-cyan)">${display}</span> 后坍塌</p><p style="font-size:11px;opacity:.5;margin-top:8px">利用照片完成文物数字修复</p>`,
    btnText: '开始修复',
    onConfirm: () => {
      Dialogue.play(Dialogues.prog_countdown).then(() => {
        SM.go('scene-photo-puzzle').then(() => initPhotoPuzzle());
      });
    }
  });
}
