const p = this;

  const W = 680, H = 280;
  const GROUND = H - 52;
  const PS = 6; // pixel size

  // ── game state ────────────────────────────────────────────────────────────
  let state = 'title'; // title | playing | dead
  let score = 0, best = 0, lives = 3, gameFrame = 0, speed = 3.5;
  let jumpCount = 0;
  let bgOffset = 0;
  let invincible = 0;
  let blinkTimer = 0;
 
  let crab, cloudList, obstacles, obstTimer;

  const hearts = ['', '❤️', '❤️❤️', '❤️❤️❤️'];

  // ── pixel helper ──────────────────────────────────────────────────────────
  function px(x, y, w, h, col) {
    p.fill(col);
    p.noStroke();
    p.rect(x * PS, y * PS, w * PS, h * PS);
  }

  // ── draw crab ─────────────────────────────────────────────────────────────
  function drawCrab(cx, cy, squish) {
    squish = squish || 1;
    const body = [
      [0,2,4,'#CC3300'],[0,4,4,'#FF4400'],
      [1,1,2,'#CC3300'],[1,3,4,'#FF5500'],[1,7,2,'#CC3300'],
      [2,1,1,'#FF4400'],[2,2,2,'#FF6633'],[2,4,4,'#FF8855'],[2,8,1,'#FF6633'],[2,9,1,'#FF4400'],
      [3,1,1,'#FF4400'],[3,2,1,'#FF6633'],[3,3,1,'#111111'],[3,4,4,'#FF8855'],[3,8,1,'#111111'],[3,9,1,'#FF6633'],[3,10,1,'#FF4400'],
      [4,1,1,'#CC3300'],[4,2,1,'#FF5500'],[4,3,1,'#FF6633'],[4,4,1,'#222222'],[4,5,1,'#FF8855'],[4,6,1,'#222222'],[4,7,1,'#FF8855'],[4,8,1,'#222222'],[4,9,1,'#FF5500'],[4,10,1,'#CC3300'],
      [5,2,1,'#CC3300'],[5,3,2,'#FF5500'],[5,5,4,'#FF6633'],[5,9,1,'#FF5500'],[5,10,1,'#CC3300'],
      [6,3,1,'#AA2200'],[6,4,4,'#CC3300'],[6,8,1,'#AA2200'],
    ];
    const clawL = [
      [1,-4,3,'#CC3300'],[2,-3,4,'#FF4400'],[3,-3,1,'#CC3300'],[3,-2,2,'#FF5500'],
      [2,-5,1,'#AA2200'],[2,-4,1,'#CC3300'],
      [3,-5,1,'#331100'],[3,-4,1,'#551100'],
      [4,-5,1,'#AA2200'],[4,-4,1,'#CC3300'],[4,-3,2,'#FF4400'],[4,-1,2,'#FF5500'],
    ];
    const clawR = [
      [1,11,3,'#CC3300'],[2,11,3,'#FF4400'],[2,14,1,'#CC3300'],
      [3,11,2,'#FF5500'],[3,13,1,'#FF4400'],[3,14,1,'#CC3300'],
      [2,15,1,'#AA2200'],[3,15,1,'#AA2200'],
      [3,15,1,'#551100'],[3,16,1,'#331100'],
      [4,11,2,'#FF5500'],[4,13,1,'#FF4400'],[4,14,1,'#CC3300'],[4,15,1,'#AA2200'],
    ];
 
    p.push();
    p.translate(cx * PS, cy * PS);
    p.scale(1, squish);
    p.noStroke();
 
    body.forEach(([r, c, w, col]) => {
      p.fill(col);
      p.rect(c * PS, r * PS, w * PS, PS);
    });
 
    // eye shines
    p.fill('#ffffff');
    p.rect(3 * PS + 2, 3 * PS + 2, 3, 3);
    p.rect(8 * PS + 2, 3 * PS + 2, 3, 3);
 
    clawL.forEach(([r, c, w, col]) => {
      p.fill(col);
      p.rect(c * PS, r * PS, w * PS, PS);
    });
    clawR.forEach(([r, c, w, col]) => {
      p.fill(col);
      p.rect(c * PS, r * PS, w * PS, PS);
    });
 
    // animated legs
    const legOff = p.sin(gameFrame * 0.3) * 0.3;
    const legsR = [[2,7,'#CC3300'],[3,6,'#CC3300'],[4,5,'#AA2200'],[2,8,'#CC3300'],[3,9,'#CC3300'],[4,10,'#AA2200']];
    legsR.forEach(([r, c, col], i) => {
      p.fill(col);
      const yo = (i < 3 ? legOff : -legOff) * PS;
      p.rect((c + 2) * PS, (6 + r) * PS + yo, PS, PS);
    });
    const legsL = [[2,0,'#CC3300'],[3,1,'#CC3300'],[4,2,'#AA2200'],[2,1,'#CC3300'],[3,2,'#CC3300'],[4,3,'#AA2200']];
    legsL.forEach(([r, c, col], i) => {
      p.fill(col);
      const yo = (i < 3 ? -legOff : legOff) * PS;
      p.rect(c * PS, (6 + r) * PS + yo, PS, PS);
    });
 
    p.pop();
  }

  // ── draw cloud ────────────────────────────────────────────────────────────
  function drawCloud(x, y, type) {
    const P = 4;
    const clouds = [
      // big fluffy
      [
        [0,1,4,'#EEEEEE'],[0,0,1,'#DDDDDD'],[0,5,1,'#EEEEEE'],
        [-1,0,7,'#FFFFFF'],[-1,7,1,'#EEEEEE'],
        [-2,2,4,'#FFFFFF'],[-2,1,1,'#EEEEEE'],[-2,6,1,'#EEEEEE'],
        [1,0,9,'#EEEEEE'],[1,9,1,'#CCCCCC'],
      ],
      // small puffy
      [
        [0,0,5,'#EEEEEE'],
        [-1,0,6,'#FFFFFF'],[-1,6,1,'#DDDDDD'],
        [-2,1,3,'#FFFFFF'],[-2,0,1,'#EEEEEE'],
        [1,0,7,'#DDDDDD'],
      ],
      // storm
      [
        [0,1,4,'#9AABB8'],[0,0,1,'#8899AA'],[0,5,1,'#9AABB8'],
        [-1,0,7,'#AABBCC'],[-1,7,1,'#8899AA'],
        [-2,2,3,'#AABBCC'],[-2,1,1,'#9AABB8'],
        [1,0,8,'#8899AA'],[1,8,1,'#778899'],
      ],
    ];
    p.push();
    p.translate(x, y);
    p.noStroke();
    clouds[type % clouds.length].forEach(([r, c, w, col]) => {
      p.fill(col);
      p.rect(c * P, r * P, w * P, P);
    });
    p.pop();
  }

  // ── draw shell ────────────────────────────────────────────────────────────
  function drawShell(x, y, type) {
    const P = 5;
    const shells = [
      // spiral
      [
        [0,1,4,'#D4956A'],[0,0,1,'#C07A50'],
        [1,0,1,'#C07A50'],[1,1,2,'#E8B080'],[1,3,2,'#F0C090'],[1,5,2,'#E8B080'],[1,7,1,'#C07A50'],
        [2,0,1,'#FF4400'],[2,1,1,'#E8B080'],[2,2,2,'#8B4A2A'],[2,4,2,'#F8D8A8'],[2,6,1,'#E8B080'],[2,7,1,'#C07A50'],
        [3,0,1,'#D4956A'],[3,1,1,'#E8B080'],[3,2,1,'#8B4A2A'],[3,3,2,'#F8D8A8'],[3,5,1,'#8B4A2A'],[3,6,1,'#E8B080'],[3,7,1,'#D4956A'],
        [4,0,1,'#C07A50'],[4,1,1,'#E8B080'],[4,2,4,'#F8D8A8'],[4,6,1,'#E8B080'],[4,7,1,'#C07A50'],
        [5,1,1,'#D4956A'],[5,2,4,'#E8B080'],[5,6,1,'#D4956A'],
        [6,2,1,'#C07A50'],[6,3,2,'#D4956A'],[6,5,1,'#C07A50'],
      ],
      // conch
      [
        [0,1,2,'#E8907A'],[0,3,1,'#DD7060'],
        [1,0,1,'#E8907A'],[1,1,3,'#F4B090'],[1,4,1,'#DD7060'],
        [2,0,1,'#DD7060'],[2,1,1,'#F4B090'],[2,2,2,'#FFCAAA'],[2,4,1,'#F4B090'],[2,5,1,'#DD7060'],
        [3,0,1,'#E8907A'],[3,1,4,'#FFCAAA'],[3,5,1,'#E8907A'],
        [4,0,1,'#DD7060'],[4,1,1,'#F4B090'],[4,2,2,'#FF9977'],[4,4,1,'#F4B090'],[4,5,1,'#DD7060'],
        [5,0,1,'#E8907A'],[5,1,3,'#F4B090'],[5,4,1,'#E8907A'],
        [5,5,1,'#DD7060'],[4,6,1,'#E8907A'],[3,6,1,'#DD7060'],
        [6,1,1,'#FF9977'],[6,2,1,'#FFCAAA'],[6,3,1,'#F4B090'],
      ],
      // scallop
      [
        [0,1,3,'#C8A8D8'],
        [1,0,1,'#D8B8E8'],[1,1,2,'#E8CCF4'],[1,3,1,'#B890C8'],[1,4,2,'#E8CCF4'],[1,6,1,'#D8B8E8'],
        [2,0,1,'#B890C8'],[2,1,1,'#D8B8E8'],[2,2,1,'#F0DCFF'],[2,3,1,'#B890C8'],[2,4,1,'#F0DCFF'],[2,5,1,'#D8B8E8'],[2,6,1,'#B890C8'],
        [3,0,1,'#C8A8D8'],[3,1,2,'#E8CCF4'],[3,3,1,'#F0DCFF'],[3,4,2,'#E8CCF4'],[3,6,1,'#C8A8D8'],
        [4,1,1,'#B890C8'],[4,2,1,'#C8A8D8'],[4,3,1,'#D8B8E8'],[4,4,1,'#C8A8D8'],[4,5,1,'#B890C8'],
        [5,2,2,'#9870B0'],[5,4,1,'#9870B0'],
        [6,3,1,'#7A5590'],
      ],
    ];
    p.push();
    p.translate(x, y);
    p.noStroke();
    shells[type % shells.length].forEach(([r, c, w, col]) => {
      p.fill(col);
      p.rect(c * P, r * P, w * P, P);
    });
    p.pop();
  }

  // ── draw background ───────────────────────────────────────────────────────
  p.drawBackground = function () {
    p.noStroke();
    // sky
    p.fill('#87CEEB'); p.rect(0, 0, W, H * 0.55);
    p.fill('#B0E2FF'); p.rect(0, H * 0.55, W, H * 0.15);
    // sea
    p.fill('#3A9AD9'); p.rect(0, H * 0.7, W, H * 0.08);
    p.fill('#2980B9'); p.rect(0, H * 0.78, W, H * 0.04);
    // sand
    p.fill('#F4D97A'); p.rect(0, H - 52, W, 52);
    p.fill('#E8C960'); p.rect(0, H - 52, W, 8);
    // scrolling sand pebbles
    for (let i = 0; i < 20; i++) {
      const tx = ((i * 70 - bgOffset * 0.5) % (W + 70) + W) % (W + 70) - 20;
      p.fill('#DDB950');
      p.rect(tx, H - 44, 14, 4);
      p.rect(tx + 30, H - 34, 8, 3);
    }
  }

  // ── overlay text (drawn on canvas) ───────────────────────────────────────
  function drawOverlay() {
    blinkTimer++;
    if (state === 'title') {
      p.fill(0, 0, 0, 120);
      p.noStroke();
      p.rect(0, 0, W, H);
      p.textFont('monospace');
      p.textSize(22);
      p.textAlign(p.CENTER, p.CENTER);
      p.fill('#000000');
      p.text('CRABBY BEACH RUN', W / 2 + 3, H / 2 - 34 + 3);
      p.fill('#ffe84a');
      p.text('CRABBY BEACH RUN', W / 2, H / 2 - 34);
      if (Math.floor(blinkTimer / 30) % 2 === 0) {
        p.textSize(16);
        p.fill('#ffffff');
        p.text('PRESS SPACE OR TAP TO START/JUMP', W / 2, H / 2 + 10);
      }
      
    } else if (state === 'dead') {
      p.fill(0, 0, 0, 140);
      p.noStroke();
      p.rect(0, 0, W, H);
      p.textFont('monospace');
      p.textSize(22);
      p.textAlign(p.CENTER, p.CENTER);
      p.fill('#000000');
      p.text('GAME OVER', W / 2 + 3, H / 2 - 34 + 3);
      p.fill('#ffe84a');
      p.text('GAME OVER', W / 2, H / 2 - 34);
      p.textSize(16);
      p.fill('#aaaaaa');
      p.text('BEST: ' + best, W / 2, H / 2 - 8);
      if (Math.floor(blinkTimer / 30) % 2 === 0) {
        p.fill('#ffffff');
        p.text('PRESS SPACE TO RETRY', W / 2, H / 2 + 14);
      }
    }
  }

  // ── reset ─────────────────────────────────────────────────────────────────
  function resetGame() {
    crab = { x: 80, y: GROUND - 42, vy: 0, w: 18 * PS, h: 7 * PS, grounded: true, squish: 1 };
    cloudList = [
      { x: 100, y: 30, type: 0, spd: 0.4 },
      { x: 350, y: 15, type: 1, spd: 0.6 },
      { x: 550, y: 50, type: 2, spd: 0.5 },
      { x: 750, y: 25, type: 0, spd: 0.3 },
    ];
    obstacles = [];
    obstTimer = 80;
    score = 0;
    lives = 3;
    speed = 3.5;
    gameFrame = 0;
    jumpCount = 0;
    invincible = 0;
    bgOffset = 0;
    blinkTimer = 0;
    //updateUI();
  }

  function doJump() {
    if (state === 'title' || state === 'dead') {
      resetGame();
      state = 'playing';
      return;
    }
    if (jumpCount < 2) {
      crab.vy = jumpCount === 0 ? -9 : -7;
      crab.grounded = false;
      jumpCount++;
      crab.squish = 0.7;
    }
  }

  function spawnObstacle() {
    const type = p.random() < 0.5 ? 0 : (p.random() < 0.5 ? 1 : 2);
    obstacles.push({ x: W + 20, type, w: 40, h: 42 });
  }

  // ── p5 setup ──────────────────────────────────────────────────────────────
  
  p.setup = function () {
    const cnv = p.createCanvas(W, H);
    //cnv.parent('game-container');
    cnv.mousePressed(doJump);
    cnv.touchStarted(doJump);
    p.pixelDensity(1);
    p.noSmooth();
    resetGame();
    state = 'title';
    //updateUI();  
  }

  // ── p5 draw ───────────────────────────────────────────────────────────────

  p.draw = function () {
    p.clear();
    p.drawBackground();
  
    // clouds
    cloudList.forEach(c => {
      if (state === 'playing') c.x -= c.spd;
      if (c.x < -200) c.x = W + 50;
      drawCloud(c.x, c.y, c.type);
    });
  
    if (state === 'playing') {
      gameFrame++;
      bgOffset += speed;
      score++;
      if (score > best) best = score;
      if (score % 500 === 0) speed = Math.min(speed + 0.3, 9);

      // physics
      crab.vy += 0.5;
      crab.y += crab.vy;
      if (crab.squish < 1) crab.squish = Math.min(1, crab.squish + 0.05);
      if (crab.y >= GROUND - 42) {
        crab.y = GROUND - 42;
        crab.vy = 0;
        crab.grounded = true;
        jumpCount = 0;
      }
      
      // spawn
      obstTimer--;
      if (obstTimer <= 0) {
        spawnObstacle();
        obstTimer = Math.max(50, 120 - score / 100);
      }
 
      // move obstacles
      obstacles.forEach(o => o.x -= speed);
      obstacles = obstacles.filter(o => o.x > -80);
      
      // collision
      if (invincible > 0) invincible--;
      obstacles.forEach(o => {
        const cx = crab.x + 10, cy = crab.y + 4;
        const cw = crab.w - 20, ch = crab.h - 8;
        const ox = o.x + 4, ow = o.w - 8;
        if (invincible === 0 && cx < ox + ow && cx + cw > ox && cy < GROUND - 2 && cy + ch > GROUND - o.h) {
          lives--;
          invincible = 90;
          //updateUI();
          if (lives <= 0) {
            state = 'dead';
            blinkTimer = 0;
          }
        }
      });
 
      //updateUI();
      
    } // (state == 'playing')
  
    // draw shells
    obstacles.forEach((o, i) => {
      drawShell(o.x, GROUND - o.h, i % 3);
    });
  
    // draw crab (flicker when invincible)
    if (invincible === 0 || Math.floor(invincible / 5) % 2 === 0) {
      const gridX = Math.round(crab.x / PS);
      const gridY = Math.round(crab.y / PS);
      drawCrab(gridX, gridY, crab.squish);
    }

    // hud score
    if (state === 'playing') {
      p.noStroke();
      p.fill('#ffe84a');
      p.textFont('monospace');
      p.textSize(16);
      p.textAlign(p.RIGHT, p.TOP);
      p.text('x'+Math.floor(score/10)+' '+hearts[Math.max(0, lives)], W - 10, 10);
    }
  
      // overlay screens
    if (state !== 'playing') {
      drawOverlay();
    }
  
}
