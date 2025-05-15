import { players, aliens, weapons } from "./data.js";

/*-------------------------------- Constants --------------------------------*/
const alienBullets = [];
const baseWidth = 1920; // base design resolution
const bullets = [];
const explosions = [];
const grids = [];
const flashDuration = 100; // milliseconds
const keyHoldIntervals = {}; // mobile controls
const missiles = [];
const muzzleFlashes = [];
const muzzleSmokePuffs = [];
const nuke_limit = 2;
const nukeProjectiles = [];

const stars = [];
const starCount = 200;
const keys = {
  a: { pressed: false },
  b: { pressed: false },
  d: { pressed: false },
  space: { pressed: false },
  m: { pressed: false },
  v: { pressed: false },
};

const high_score_key = "high_score";

/*---------------------------- Variables (state) ----------------------------*/
let animationId;
let isAnimating = false;
let currentPlayerIndex = 0;
let canvas, ctx;

let gameOverTimeout = null;
let playerLives = 3;
// let isGameAnimating = false; // ### CHECK for Deletion
let homeMusic = null;
let gameMusic = null;
let frames = 0;
let masterVolume = 1.0;
let muted = false;
let nukesRemaining = nuke_limit;
let randomInterval = Math.floor(Math.random() * 500 + 500);
let game = {
  over: false,
  active: true,
  showGameOverText: false,
  paused: false,
  flashing: false,
};
let player;
let scaleFactor = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
let score = 0;
let highScore = 0;
let waitingForFirstWave = true;
let shakeFrames = 0;
let shakeIntensity = 5; // pixels of max displacement

/*------------------------ Cached Element References ------------------------*/

const lifeIcons = document.querySelectorAll(".life-icon");
const nukeContainer = document.getElementById("nukeContainer");
const scoreEl = document.getElementById("scoreEl");
const highScoreEl = document.getElementById("highScoreEl");
const switchBtn = document.getElementById("switchPlayerBtn");
const restartBtn = document.getElementById("restartGameBtn");
const playerNameEl = document.getElementById("playerName");
const gameTitleEl = document.getElementById("gameTitle");
const gameOverContainer = document.getElementById("gameOverContainer");

// mobile controls
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const fireBtn = document.getElementById("fireBtn");
const missileBtn = document.getElementById("missileBtn");
const nukeBtn = document.getElementById("nukeBtn");

const volumeDisplay = document.getElementById("volumeDisplay");
const volumeUpBtn = document.getElementById("volumeUpBtn");
const volumeDownBtn = document.getElementById("volumeDownBtn");
const muteBtn = document.getElementById("muteBtn");

const alienBulletLaunchSound = new Audio(
  "./audio/Alien_Bullet_Laser_Shoot_SFX.mp3"
);
const bulletLaunchSound = new Audio("./audio/Laser_Gun_SoundFX.mp3");
const engineFireCracklingSound = new Audio(
  "./audio/Engine_Fire_Crackling_SFX.mp3"
);
engineFireCracklingSound.loop = true;

const missileLaunchSound = new Audio("./audio/Missile_Launch_SoundFX.mp3");
const nukeLaunchSound = new Audio("./audio/Nuclear_Blast_SoundFX.mp3");

const playerExplosionSound = new Audio(
  "./audio/Player_Space_Explosion_Reverb.mp3"
);
const playerKilledSound = new Audio("./audio/Player_Killed_Explosion.mp3");
const alienExplosionSound = new Audio("./audio/Alien_Explosion_SFX.mp3");
const missileExplosionSound = new Audio("./audio/Missile_Explosion_SFX.mp3");

const backgroundMusic = new Audio(
  "./audio/Background_Spaceship_Texture_SFX.mp3"
);
backgroundMusic.loop = true; // Loop forever
backgroundMusic.volume = 0.4 * masterVolume; // Adjust volume (0.0 - 1.0)
backgroundMusic.preload = "auto"; // Preload for smoother start

// Only present on home.html:
const startBtn = document.getElementById("startBtn");

/*--------------------------------- Classes ---------------------------------*/
/*--------------------------- Player Class ------------------------------*/
class Player {
  constructor() {
    this.velocity = { x: 0, y: 0 };
    this.rotation = 0;
    this.opacity = 1;
    this.isDamaged = false;
    this.smokeTrail = [];
    this.smokeTimer = 0;

    this.image = null;
    this.width = 0;
    this.height = 0;

    this.position = { x: canvas.width / 2, y: canvas.height - 100 };
    this.loadImage(players[currentPlayerIndex].image);
    playerNameEl.textContent = players[currentPlayerIndex].name;
  }

  loadImage(src) {
    const image = new Image();
    image.src = src;
    image.onload = () => {
      const scale = 0.15 * scaleFactor;
      this.image = image;
      this.width = image.width * scale;
      this.height = image.height * scale;
      this.position.x = canvas.width / 2 - this.width / 2;
      this.position.y = canvas.height - this.height - 60; // player height on game start
      updateLivesDisplay();
    };
  }

  switchPlayer() {
    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    this.loadImage(players[currentPlayerIndex].image);
    playerNameEl.textContent = players[currentPlayerIndex].name;
    updateLivesDisplay(); // refresh icons when switching
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.translate(
      this.position.x + this.width / 2,
      this.position.y + this.height / 2
    );
    ctx.rotate(this.rotation);
    ctx.translate(
      -(this.position.x + this.width / 2),
      -(this.position.y + this.height / 2)
    );

    // Smoke trail behind the player
    if (this.isDamaged) {
      this.smokeTrail.forEach((p) => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    // Plane engine fire
    if (this.isDamaged && playerLives === 1) {
      const flickerAlpha = 0.3 + Math.random() * 0.3;
      const flickerRadius = this.width * 0.3;

      ctx.save();
      ctx.globalAlpha = flickerAlpha;
      ctx.fillStyle = "orange";
      ctx.beginPath();
      ctx.arc(
        this.position.x + this.width / 2,
        this.position.y + this.height - 45,
        flickerRadius,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    }
    ctx.drawImage(
      this.image,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    );
    ctx.restore();
  }

  update() {
    if (this.image) {
      this.draw();

      if (this.isDamaged) {
        const isFlaming = playerLives === 1;

        const trailParticle = {
          x: this.position.x + this.width / 2,
          y: this.position.y + this.height - 10,
          alpha: 1,
          radius: Math.random() * 10 + 15,
          driftX: (Math.random() - 0.5) * 1,
          driftY: -Math.random() * 0.5 + 1,
          color: isFlaming
            ? `rgba(${200 + Math.random() * 55}, ${Math.random() * 80}, 0, 1)` // Flame (orange/red)
            : `rgba(30, 30, 30, 0.8)`, // Smoke (dark grey)
        };

        if (playerLives === 1) {
          if (engineFireCracklingSound.paused) {
            engineFireCracklingSound.currentTime = 0;
            engineFireCracklingSound
              .play()
              .catch((err) => console.warn("Fire sound blocked:", err));
          }
        } else if (!engineFireCracklingSound.paused) {
          engineFireCracklingSound.pause();
        }

        this.smokeTrail.push(trailParticle);

        this.smokeTrail.forEach((p) => {
          p.x += p.driftX;
          p.y += p.driftY;
          p.alpha -= 0.008;
        });

        this.smokeTrail = this.smokeTrail.filter((p) => p.alpha > 0);
      }

      this.position.x += this.velocity.x;

      // clamp to canvas bounds
      if (this.position.x < 0) this.position.x = 0;
      if (this.position.x + this.width > canvas.width)
        this.position.x = canvas.width - this.width;
    }
  }
}

/*--------------------------- Alien Class ---------------------------*/
class Alien {
  constructor({ position, image }) {
    this.position = position;
    this.velocity = { x: 0, y: 0 };
    this.width = 60 * scaleFactor; // Dynamically calculate width
    this.height = 60 * scaleFactor; // Dynamically calculate height
    this.image = new Image();
    this.image.src = image;
  }

  draw() {
    ctx.drawImage(
      this.image,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    );
  }

  update({ velocity }) {
    this.position.x += velocity.x;
    this.position.y += velocity.y;
    this.draw();
  }

  shoot(alienBullets) {
    alienBullets.push(
      new AlienBullet({
        position: {
          x: this.position.x + this.width / 2,
          y: this.position.y + this.height,
        },
        velocity: { x: 0, y: 5 },
      })
    );
    if (alienBulletLaunchSound) {
      alienBulletLaunchSound.currentTime = 0.0; // sound start time
      alienBulletLaunchSound.play();
    }
  }
}
/*--------------------------- Grid Class ---------------------------*/
class Grid {
  constructor(alienType) {
    this.velocity = { x: 3, y: 0 };
    this.aliens = [];

    const scale = scaleFactor;

    // Responsive column and row count
    const baseCols = Math.floor(Math.random() * 10 + 5);
    const baseRows = Math.floor(Math.random() * 5 + 2);
    const columns = Math.max(3, Math.min(12, Math.round(baseCols * scale)));
    const rows = Math.max(1, Math.min(6, Math.round(baseRows * scale)));

    // Responsive spacing
    const alienSpacingX = 80 * scale;
    const alienSpacingY = 80 * scale;

    for (let x = 0; x < columns; x++) {
      for (let y = 0; y < rows; y++) {
        this.aliens.push(
          new Alien({
            position: {
              x: x * alienSpacingX,
              y: y * alienSpacingY,
            },
            image: alienType.image,
          })
        );
      }
    }

    this.position = {
      x: canvas.width / 2 - (columns * alienSpacingX) / 2, // Centre on screen
      y: 0,
    };
  }

  update() {
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.velocity.y = 0;

    // Dynamically calculate current grid width based on aliens
    if (this.aliens.length > 0) {
      const firstAlien = this.aliens[0];
      const lastAlien = this.aliens[this.aliens.length - 1];

      this.width =
        lastAlien.position.x + lastAlien.width - firstAlien.position.x;

      // Detect right or left screen edge
      if (
        this.position.x + this.width >= canvas.width ||
        this.position.x <= 0
      ) {
        this.velocity.x = -this.velocity.x;
        this.velocity.y = 30; // move down
      }
    }
  }
}

/*--------------------------- Muzzle Flash Class ---------------------------*/
class MuzzleFlash {
  constructor({ position, rotation }) {
    this.position = position;
    this.rotation = rotation;
    this.lifetime = 5;
    this.size = 20;
  }

  draw() {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-this.size / 2, -this.size);
    ctx.lineTo(this.size / 2, -this.size);
    ctx.closePath();
    ctx.fillStyle = "yellow";
    ctx.fill();
    ctx.restore();
  }

  update() {
    this.draw();
    this.lifetime--;
  }
}

/*--------------------------- Muzzle Smoke Class ---------------------------*/
class MuzzleSmoke {
  constructor({ position }) {
    this.position = { ...position };
    this.radius = Math.random() * 6 + 4;
    this.alpha = 1;
    this.velocity = {
      x: (Math.random() - 0.5) * 8, // slight side drift
      y: -Math.random() * 1.5 - 1, // drift upward
    };
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = "rgba(200, 200, 200, 1)";
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  }

  update() {
    this.alpha -= 0.02; // fade out
    this.draw();
  }
}
/*--------------------------- Bullet Class ---------------------------*/
class Bullet {
  constructor({ position, velocity }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = 6 * scaleFactor; // Dynamically calculate radius, scale for mobile vs desktop
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = "orange";
    ctx.fill();
    ctx.closePath();
  }

  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}

/*--------------------------- Alien Bullet Class ---------------------------*/
class AlienBullet {
  constructor({ position, velocity }) {
    this.position = position;
    this.velocity = velocity;
    this.width = 6 * scaleFactor; // Dynamically calculate width
    this.height = 12 * scaleFactor; // Dynamically calculate height
  }
  draw() {
    ctx.fillStyle = "white";
    ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
  }
  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}

/*--------------------------- Missile Class ---------------------------*/
class Missile {
  constructor({ position, velocity, pattern }) {
    this.position = { ...position };
    this.velocity = { x: 0, y: -5 };
    this.width = 10 * scaleFactor; // Dynamically calculate width
    this.height = 30 * scaleFactor; // Dynamically calculate height
    this.patternStartTime = Date.now();
    this.pattern = pattern;
    this.trail = [];
  }

  static lastPattern = 2;

  static nextPattern() {
    Missile.lastPattern = Missile.lastPattern === 1 ? 2 : 1;
    return Missile.lastPattern;
  }

  draw() {
    ctx.fillStyle = "gray";
    ctx.fillRect(
      this.position.x - this.width / 2,
      this.position.y - this.height,
      this.width,
      this.height
    );

    // Rounded nose tip (semi-circle)
    ctx.beginPath();
    ctx.arc(
      this.position.x, // center x
      this.position.y - this.height, // center y at top of missile
      this.width / 2, // radius equals half width
      Math.PI, // start angle (180°)
      2 * Math.PI // end angle (360°)
    );
    ctx.fill();
    ctx.closePath();

    this.trail.forEach((t) => {
      ctx.globalAlpha = t.alpha;
      ctx.fillStyle = `rgba(255, ${100 + Math.random() * 100}, 0, ${t.alpha})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.closePath();
      ctx.globalAlpha = 1.0;
    });
  }

  update() {
    const elapsed = (Date.now() - this.patternStartTime) / 1000;

    if (elapsed < 0.05) {
      // Burst left or right + climb fast
      this.velocity.x = this.pattern === 1 ? -15 : 15;
      this.velocity.y = -0.01;
    } else if (elapsed < 0.3) {
      // Straighten path, climb steadily
      this.velocity.x = this.pattern === 1 ? 0 : -0;
      this.velocity.y = -2;
    } else if (elapsed < 1.0) {
      // Bank sharply back inward + climb slower
      this.velocity.x = this.pattern === 1 ? 1 : -1;
      this.velocity.y = -5;
    } else {
      // Final phase: go straight up slowly
      this.velocity.x = 0;
      this.velocity.y = -20;
    }

    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    this.trail.push({
      x: this.position.x,
      y: this.position.y + this.height,
      alpha: 1,
    });
    this.trail.forEach((t) => (t.alpha -= 0.05));
    this.trail = this.trail.filter((t) => t.alpha > 0);

    this.draw();
  }
}

/*--------------------------- Nuke Class ---------------------------*/
class Nuke {
  constructor({ position }) {
    this.position = { ...position };
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const durationFrames = 180; // ~3 sec
    this.velocity = {
      x: (centerX - this.position.x) / durationFrames,
      y: (centerY - this.position.y) / durationFrames,
    };

    this.radius = 2.2 * scaleFactor; // nuke start size
    this.minRadius = 0.5 * scaleFactor; // target shrink size
    this.shrinkSpeed = 0.05; // shrink smoothly

    this.collapsed = false;
    this.shrinking = false;

    this.image = new Image();
    this.image.src = "./images/Nuclear_Weapon.png";

    this.shockwaveActive = false;
    this.shockwaveRadius = 0;
    this.shockwaveMaxRadius = Math.max(canvas.width, canvas.height) * 1.5;
    this.shockwaveAlpha = 1;
    this.flashFrames = 0;
  }

  update() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    if (!this.shrinking && !this.collapsed) {
      this.position.x += this.velocity.x;
      this.position.y += this.velocity.y;

      if (
        Math.abs(this.position.x - centerX) < 5 &&
        Math.abs(this.position.y - centerY) < 5
      ) {
        this.shrinking = true;
      }
    }

    if (this.shrinking && !this.collapsed) {
      this.radius -= this.shrinkSpeed;
      if (this.radius <= this.minRadius) {
        this.radius = this.minRadius;
        this.collapsed = true;
        this.triggerDetonation();
      }
    }

    if (!this.collapsed) {
      this.draw();
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    const scale = this.radius / 30;
    ctx.scale(scale, scale);
    // Shadow glow applied around nuke
    ctx.shadowColor = "white";
    ctx.shadowBlur = 15; // increase for stronger glow

    ctx.drawImage(this.image, -this.image.width / 2, -this.image.height / 2);
    ctx.restore();
  }

  triggerDetonation() {
    game.paused = true;
    game.flashing = true;

    const flashDuration = 200;
    const maxFlashes = 6;
    let flashes = 0;

    const flashInterval = setInterval(() => {
      ctx.fillStyle = flashes % 1 === 0 ? "white" : "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      flashes++;

      if (flashes >= maxFlashes) {
        clearInterval(flashInterval);

        // Final FLASH-OUT
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (this.explosionSound) {
          this.explosionSound.play();
        }

        // Clear entities
        grids.length = 0;
        alienBullets.length = 0;
        bullets.length = 0;
        missiles.length = 0;
        nukeProjectiles.length = 0;
        explosions.length = 0;
        muzzleFlashes.length = 0;

        game.flashing = false;
        // Start the ripple after flashing
        this.startShockwave();
      }
    }, flashDuration);
  }

  startShockwave() {
    this.shockwaveActive = true;
    this.shockwaveRadius = 10;
    this.shockwaveAlpha = 1;

    let rippleCount = 0;
    const maxRipples = 2;
    const rippleDelay = 500;

    const startNextRipple = () => {
      if (rippleCount >= maxRipples) {
        // alien respawn delay logic
        waitingForFirstWave = true;
        setTimeout(() => {
          spawnAlienWave();
        }, 2000);
        return;
      }

      // shockwave ripple logic
      let localRadius = 10;
      let localAlpha = 1;
      const localMax = Math.max(canvas.width, canvas.height);

      const animateRipple = () => {
        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${localAlpha})`;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(
          canvas.width / 2,
          canvas.height / 2,
          localRadius,
          0,
          Math.PI * 2
        );
        ctx.stroke();
        ctx.restore();

        localRadius += 20;
        localAlpha -= 0.02;

        if (localRadius < localMax && localAlpha > 0) {
          requestAnimationFrame(animateRipple);
        }
      };

      animateRipple();
      rippleCount++;
      setTimeout(startNextRipple, rippleDelay);
    };

    startNextRipple();
  }
}
/*--------------------------- Explosion Class ---------------------------*/
class Explosion {
  constructor({ position, velocity, radius, color, fades }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = radius;
    this.color = color;
    this.opacity = 1;
    this.fades = fades;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  }

  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.opacity -= 0.01; // clearing explosion
  }
}

/*--------------------------- Nuke Detonation Class ---------------------------*/
class Detonation {
  constructor({ position, velocity, radius, color }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = radius;
    this.color = color;
    this.opacity = 1;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  }

  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.opacity -= 0.01;
  }
}

/*---------------------------------------------------------------------------------------*/
/*---------------------------------------- Functions ------------------------------------*/
/*---------------------------------------------------------------------------------------*/

/*--------------------------- Functions | Key Handler -------------------*/

function handleKey(key) {
  const lowerKey = key.toLowerCase();

  if (game.over) return;

  switch (lowerKey) {
    case "a":
      keys.a.pressed = true;
      break;

    case "b":
      keys.b.pressed = true;

      if (nukesRemaining > 0) {
        nukesRemaining--;
        updateNukeDisplay();

        // Play nuke launch sound
        nukeLaunchSound.currentTime = 0.0; // sound start time
        nukeLaunchSound.play();

        const nuke = new Nuke({
          position: {
            x: player.position.x + player.width / 2,
            y: player.position.y,
          },
          velocity: {
            x: (canvas.width / 2 - (player.position.x + player.width / 2)) / 60,
            y: (canvas.height / 2 - player.position.y) / 60,
          },
        });
        nukeProjectiles.push(nuke);
      }
      break;

    case "d":
      keys.d.pressed = true;
      break;

    case "m":
      // Play missile launch sound
      missileLaunchSound.currentTime = 0.0; // rewind if already playing
      missileLaunchSound.play();

      const nextPattern = Missile.nextPattern();
      const missileOffsetX = nextPattern === 1 ? -30 : 30;
      const missileX = player.position.x + player.width / 2 + missileOffsetX;
      const missileY = player.position.y + player.height * 0.5;

      for (let i = 0; i < 5; i++) {
        muzzleSmokePuffs.push(
          new MuzzleSmoke({
            position: {
              x: missileX + Math.random() * 40 - 2,
              y: missileY + Math.random() * 25,
            },
          })
        );
      }

      missiles.push(
        new Missile({
          position: { x: missileX, y: player.position.y },
          velocity: { x: 0, y: -10 },
          pattern: nextPattern,
        })
      );
      break;

    case " ":
    case "spacebar":
    case "space":
      keys.space.pressed = true;

      // Play bullet launch sound
      bulletLaunchSound.currentTime = 0.0;
      bulletLaunchSound.play();

      if (player.image) {
        const centerX = player.position.x + player.width / 2;
        const centerY = player.position.y + player.height / 2;
        const tipX = player.position.x + player.width / 2;
        const tipY = player.position.y;
        const rotatedTip = getRotatedPoint(
          tipX,
          tipY,
          centerX,
          centerY,
          player.rotation
        );
        const bulletSpeed = 15;
        const velocityX = Math.sin(player.rotation) * bulletSpeed;
        const velocityY = -Math.cos(player.rotation) * bulletSpeed;

        bullets.push(
          new Bullet({
            position: { x: rotatedTip.x, y: rotatedTip.y - 10 },
            velocity: { x: velocityX, y: velocityY },
          })
        );

        muzzleFlashes.push(
          new MuzzleFlash({
            position: { x: rotatedTip.x, y: rotatedTip.y },
            rotation: player.rotation,
          })
        );
      }
      break;
    case "v":
      keys.v.pressed = true;
      // new: switch aircraft on 'v'
      if (key === "v") {
        player.switchPlayer();
      }
  }
}

function handleKeyRelease(key) {
  const lowerKey = key.toLowerCase();

  if (lowerKey === "a") keys.a.pressed = false;
  if (lowerKey === "d") keys.d.pressed = false;
  if (lowerKey === "b") keys.b.pressed = false;
  if (lowerKey === "m") keys.m.pressed = false;
  if (lowerKey === "v") keys.v.pressed = false;
  if (lowerKey === " " || lowerKey === "spacebar" || lowerKey === "space")
    keys.space.pressed = false;
}

//mobile controls handlers ------------------------------------------------------------------------

function handleHoldStart(key, buttonEl) {
  handleKey(key);
  buttonEl.classList.add("pressed");
  keyHoldIntervals[key] = setInterval(() => handleKey(key), 50); // keep simulating key hold
}

function handleHoldEnd(key, buttonEl) {
  clearInterval(keyHoldIntervals[key]);
  handleKeyRelease(key);
  buttonEl.classList.remove("pressed");
}

function simulateKeyTap(key) {
  handleKey(key);
  setTimeout(() => handleKeyRelease(key), 100);
}

function handleMobileFire() {
  simulateKeyTap("space");
}

function handleMobileMissile() {
  simulateKeyTap("m");
}

function handleMobileNuke() {
  simulateKeyTap("b");
}

/*----------------- Audio & Volume Control Handlers-----------------------------------------------------*/

function setupAudio() {
  if (isHomeScreen) {
    homeMusic = new Audio(HOME_MUSIC_SRC);
    homeMusic.loop = true;
    homeMusic.volume = 0.5;
    // Some browsers block autoplay, so we catch any errors:
    homeMusic
      .play()
      .catch((err) => console.warn("Home-music autoplay blocked:", err));
  }
  if (isGameScreen) {
    gameMusic = new Audio(GAME_MUSIC_SRC);
    gameMusic.loop = true;
    gameMusic.volume = 0.5;
    // we don’t auto-play game music here; we’ll kick it off when the game actually starts
  }
}

function startGame() {
  // when you leave the home screen…
  if (homeMusic) homeMusic.pause();
  // …and when you enter gameplay…
  if (gameMusic) {
    gameMusic.currentTime = 0;
    gameMusic
      .play()
      .catch((err) => console.warn("Game-music autoplay blocked:", err));
  }

  // …plus whatever existing “begin game” logic is:
  initGameLoop();
}

function applyMasterVolume() {
  alienBulletLaunchSound.volume = 0.05 * masterVolume;
  bulletLaunchSound.volume = 0.2 * masterVolume;
  engineFireCracklingSound.volume = 0.7 * masterVolume;
  missileLaunchSound.volume = 0.5 * masterVolume;
  nukeLaunchSound.volume = 1.0 * masterVolume;
  playerExplosionSound.volume = 0.7 * masterVolume;
  playerKilledSound.volume = 1.0 * masterVolume;
  alienExplosionSound.volume = 0.7 * masterVolume;
  missileExplosionSound.volume = 0.7 * masterVolume;
  backgroundMusic.volume = 0.4 * masterVolume;
}

function updateVolumeDisplay() {
  if (muted) {
    volumeDisplay.textContent = "Muted";
  } else {
    volumeDisplay.textContent = Math.round(masterVolume * 100);
  }
}

function increaseVolume() {
  if (masterVolume < 1 && !muted) {
    masterVolume = Math.min(1, masterVolume + 0.1);
    applyMasterVolume();
    updateVolumeDisplay();
  }
}

function decreaseVolume() {
  if (masterVolume > 0 && !muted) {
    masterVolume = Math.max(0, masterVolume - 0.1);
    applyMasterVolume();
    updateVolumeDisplay();
  }
}

function toggleMute() {
  muted = !muted;
  const allSounds = [
    alienBulletLaunchSound,
    bulletLaunchSound,
    engineFireCracklingSound,
    missileLaunchSound,
    nukeLaunchSound,
    playerExplosionSound,
    playerKilledSound,
    alienExplosionSound,
    missileExplosionSound,
    backgroundMusic,
  ];

  if (muted) {
    volumeUpBtn.classList.add("volume-dimmed");
    volumeDownBtn.classList.add("volume-dimmed");
    muteBtn.classList.add("mute-active");
  } else {
    volumeUpBtn.classList.remove("volume-dimmed");
    volumeDownBtn.classList.remove("volume-dimmed");
    muteBtn.classList.remove("mute-active");
  }
  allSounds.forEach((sound) => (sound.muted = muted));
  muteBtn.textContent = muted ? "🔈" : "🔇";
  updateVolumeDisplay();
}

function animateButton(button) {
  button.classList.add("volume-clicked");
  setTimeout(() => {
    button.classList.remove("volume-clicked");
  }, 100);
}
/*--------------------------- Canvas Resized ---------------------------*/
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Adjust scale factor based on width or height
  scaleFactor = Math.min(canvas.width / 1280, canvas.height / 720);

  if (player && player.image) {
    player.width = player.image.width * 0.15 * scaleFactor;
    player.height = player.image.height * 0.15 * scaleFactor;
    player.position.x = canvas.width / 2 - player.width / 2;
    player.position.y = canvas.height - player.height - 60;
  }
  // Reposition all existing grids to centre on new canvas size
  grids.forEach((grid) => {
    if (grid.aliens.length > 0) {
      const firstAlien = grid.aliens[0];
      const lastAlien = grid.aliens[grid.aliens.length - 1];

      grid.width =
        lastAlien.position.x + lastAlien.width - firstAlien.position.x;

      grid.position.x = canvas.width / 2 - grid.width / 2;
    }
  });
}

/*--------------------------- Stars ---------------------------*/

function initStars() {
  stars.length = 0;
  const adjustedStarCount = Math.floor(starCount * scaleFactor);

  for (let i = 0; i < adjustedStarCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 * scaleFactor + 0.5,
      velocity: { x: 0, y: 0.5 * scaleFactor },
      alpha: Math.random(),
      alphaChange: Math.random() * 0.02 + 0.005,
    });
  }
}

/*-------------------------------- Functions | High Score Display --------------------------------*/

function fmt(n) {
  return n.toLocaleString();
}

function loadHighScore() {
  const saved = localStorage.getItem(high_score_key);
  highScore = saved !== null ? Number(saved) : 0;
  highScoreEl.textContent = fmt(highScore);
}

function saveHighScore() {
  localStorage.setItem(high_score_key, String(highScore));
}

function updateScore(newPoints) {
  score += newPoints;
  scoreEl.textContent = fmt(score);

  // check against highScore
  if (score > highScore) {
    highScore = score;
    highScoreEl.textContent = fmt(highScore);
    saveHighScore();
  }
}

/*--------------------------- Start Background Music ---------------------------*/
function enableBackgroundMusicOnce() {
  const tryPlay = () => {
    if (backgroundMusic.paused) {
      backgroundMusic.currentTime = 0;
      backgroundMusic.play().catch((err) => {
        console.warn("Autoplay blocked:", err);
      });
    }
  };
  // listeners to trigger play on first interaction
  window.addEventListener("keydown", tryPlay);
  window.addEventListener("mousedown", tryPlay);
  window.addEventListener("touchstart", tryPlay);
}
/*--------------------------- Spawn Alien Wave | Alien Grid Update---------------------------------*/
function spawnAlienWave() {
  const randomAlienType = aliens[Math.floor(Math.random() * aliens.length)];
  if (randomAlienType) {
    grids.push(new Grid(randomAlienType));
    waitingForFirstWave = false;
    console.log("Alien wave spawned");
  } else {
    console.warn("Aliens array is empty or invalid!");
  }
}

// Setting waiting flag and spawn grid after delay
waitingForFirstWave = true;
setTimeout(() => {
  grids.push(new Grid(aliens[Math.floor(Math.random() * aliens.length)]));
  waitingForFirstWave = false;
}, 2000);

/*--------------------------- Bullet Firing Angle relative to player direction ---------------------------*/
function getRotatedPoint(px, py, cx, cy, angle) {
  const s = Math.sin(angle);
  const c = Math.cos(angle);
  px -= cx;
  py -= cy;
  const xnew = px * c - py * s;
  const ynew = px * s + py * c;
  return { x: xnew + cx, y: ynew + cy };
}

/*--------------------------- Space Invaders Title  ---------------------------*/

function showGameOverTitle() {
  gameTitleEl.classList.remove("hidden");
  gameTitleEl.classList.add("show");
}

function hideGameOverTitle() {
  gameTitleEl.classList.remove("show");
  gameTitleEl.classList.add("hidden");
}

/*--------------------------- Player Life Icons  ---------------------------*/

function updateLifeIcons() {
  const currentImage = players[currentPlayerIndex].image;
  lifeIcons.forEach((icon) => {
    icon.src = currentImage;
  });
}

/*--------------------------- restartGame function  ---------------------------*/

function restartGame() {
  game.over = false;

  if (gameOverTimeout) {
    clearTimeout(gameOverTimeout);
    gameOverTimeout = null;
  }
  // Stopping previous animation loop
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
    isAnimating = false;
  }

  // Prevent restarting the game if it's already over
  if (game.over) return;

  // Restart background music
  backgroundMusic.currentTime = 0;
  backgroundMusic.play();

  game.active = true;
  game.showGameOverText = false;
  game.paused = false;

  playerLives = 3;
  updateLivesDisplay();

  gameOverContainer.classList.add("hidden");
  gameOverContainer.classList.remove("show");
  gameTitleEl.classList.add("hidden");
  gameTitleEl.classList.remove("show");

  // Reset player
  player.position.x = canvas.width / 2 - player.width / 2;
  player.position.y = canvas.height - player.height - 60;
  player.velocity.x = 0;
  player.rotation = 0;
  player.opacity = 1;
  playerNameEl.textContent = players[currentPlayerIndex].name;

  // Clear bullets and flashes
  alienBullets.length = 0;
  bullets.length = 0;
  explosions.length = 0;
  missiles.length = 0;
  muzzleFlashes.length = 0;
  muzzleSmokePuffs.length = 0;
  nukeProjectiles.length = 0;
  grids.length = 0;

  nukesRemaining = nuke_limit;
  updateNukeDisplay();

  // Reset keys
  keys.a.pressed = false;
  keys.d.pressed = false;
  keys.space.pressed = false;
  keys.b.pressed = false;
  keys.m.pressed = false;
  keys.v.pressed = false;

  // Reset frame counter if needed
  frames = 0;
  score = 0;
  scoreEl.textContent = score;

  player.rotation = 0;
  player.opacity = 1;
  player.isDamaged = false;
  player.smokeTrail = [];
  player.smokeTimer = 0;

  engineFireCracklingSound.pause();
  engineFireCracklingSound.currentTime = 0;

  // Alien spawn after delay
  waitingForFirstWave = true;
  setTimeout(() => {
    spawnAlienWave();
  }, 2000); // Delay first wave by 2 seconds

  if (!animationId) {
    animate();
  }
}

/*--------------------------- Explosions function  ---------------------------*/
// Explosion
function createExplosions({ object, color, fades }) {
  const colors = Array.isArray(color) ? color : [color || "red"];

  for (let i = 0; i < 30; i++) {
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    explosions.push(
      new Explosion({
        position: {
          x: object.position.x + object.width / 2,
          y: object.position.y + object.height / 2,
        },
        velocity: {
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2,
        },
        radius: Math.random() * 10 + 5,
        color: randomColor,
        fades: true,
      })
    );
  }
}

function triggerGameOver() {
  game.active = false;
  game.over = true;
  game.showGameOverText = true;

  gameOverContainer.classList.remove("hidden");
  gameOverContainer.classList.add("show");
  gameTitleEl.classList.remove("hidden");
  gameTitleEl.classList.add("show");
  playerNameEl.textContent = "";

  engineFireCracklingSound.pause();
  engineFireCracklingSound.currentTime = 0;
  bullets.length = 0;
  missiles.length = 0;
  alienBullets.length = 0;
  explosions.length = 0;
  muzzleFlashes.length = 0;
  muzzleSmokePuffs.length = 0;
  nukeProjectiles.length = 0;
}

/*--------------------------- Player Alien Collision Function  ---------------------------*/

function handlePlayerAlienCollision(alien, grid) {
  // Explode all aliens in the grid
  grid.aliens.forEach((alien) => {
    createExplosions({
      object: alien,
      color: ["white", "grey"],
      fades: true,
    });
  });

  // Player explosion
  player.opacity = 0.2;
  createExplosions({ object: player, color: ["white", "grey"], fades: true });

  if (playerExplosionSound) playerExplosionSound.play();

  // Remove the entire alien grid
  const gridIndex = grids.indexOf(grid);
  if (gridIndex > -1) grids.splice(gridIndex, 1);

  // Decrement life and update UI
  playerLives--;
  updateLivesDisplay();

  if (playerLives <= 0) {
    player.opacity = 0;
    createExplosions({ object: player, color: ["white", "grey"], fades: true });
    shakeFrames = 20;

    playerKilledSound.currentTime = 0;
    playerKilledSound.play();

    setTimeout(() => {
      triggerGameOver();
    }, 1500);
  } else if (!game.over && playerLives > 0) {
    // Respawn player (if lives left)
    player.position.x = canvas.width / 2 - player.width / 2;
    player.position.y = canvas.height - player.height - 60;
    player.opacity = 0.2;
    player.rotation = 0;
    player.opacity = 1;
    player.isDamaged = true;
    player.smokeTrail = [];
    player.smokeTimer = 0;

    setTimeout(() => {
      player.opacity = 1;
    }, 500);

    // Schedule next alien wave
    waitingForFirstWave = true;
    setTimeout(() => {
      spawnAlienWave();
    }, 2000);
  }
}

/*-------------------------------- Functions | Update Lives Icon Display --------------------------------*/
function updateLivesDisplay() {
  lifeIcons.forEach((icon, index) => {
    //icon.src = players[currentPlayerIndex].image; // always update to current player image
    if (index < playerLives) {
      //icon.classList.remove('lost');
      icon.style.opacity = 1; // visible
      icon.src = players[currentPlayerIndex].image; // current player image
    } else {
      //icon.classList.add('lost');
      icon.style.opacity = 0.1; // dimmed or hidden when lost
    }
  });
}

/*-------------------------------- Functions | Update Nukes Display --------------------------------*/

function updateNukeDisplay() {
  nukeContainer.innerHTML = ""; // clear out old icons/text

  if (nukesRemaining > 0) {
    for (let i = 0; i < nukesRemaining; i++) {
      const img = document.createElement("img");
      img.src = "./images/Nuclear_Weapon.png";
      img.classList.add("nuke-icon");
      nukeContainer.appendChild(img);
    }
  } else {
    const msg = document.createElement("span");
    msg.textContent = "Out of nuclear weapons";
    msg.classList.add("no-nukes");
    nukeContainer.appendChild(msg);
  }
}

/*--------------------------------------------------------------------------------------------------------*/
/*-------------------------------- Functions Animate -----------------------------------------------------*/
/*--------------------------------------------------------------------------------------------------------*/

function animate() {
  // Store ID, game update and draw black background
  if (isAnimating) return;
  isAnimating = true;
  animationId = requestAnimationFrame(() => {
    isAnimating = false;
    animate();
  });

  if (game.flashing) return; // skip during nuke flash

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (shakeFrames > 0) {
    const dx = (Math.random() - 0.5) * shakeIntensity;
    const dy = (Math.random() - 0.5) * shakeIntensity;
    ctx.save();
    ctx.translate(dx, dy);
    shakeFrames--;
  } else {
    ctx.save();
  }

  // -------------------------------- Functions Animate | Update Stars ----------------------------
  // Update and draw stars
  stars.forEach((star) => {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
    ctx.fill();
    ctx.closePath();

    // Update twinkle stars (alpha)
    star.alpha += star.alphaChange;
    if (star.alpha <= 0 || star.alpha >= 1) {
      star.alphaChange = -star.alphaChange;
    }

    // Update Y position to move star downwards
    star.y += star.velocity.y;

    // Reset star to top if it goes off screen
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width;
    }
  });

  /*-------------------------------- Functions Animate | Update Player  --------------------------------*/
  // Update player, movement and control
  if (playerLives > 0 && !game.over) {
    player.update();
    if (keys.a.pressed && player.position.x >= 0) {
      player.velocity.x = -10;
      player.rotation = -0.2;
    } else if (
      keys.d.pressed &&
      player.position.x + player.width <= canvas.width
    ) {
      player.velocity.x = 10;
      player.rotation = 0.2;
    } else {
      player.velocity.x = 0;
      player.rotation = 0;
    }
  }

  /*-------------------------------- Functions Animate | Update Bullets  --------------------------------*/
  bullets.forEach((bullet, index) => {
    if (
      bullet.position.y + bullet.radius <= 0 ||
      bullet.position.y - bullet.radius >= canvas.height ||
      bullet.position.x + bullet.radius <= 0 ||
      bullet.position.x - bullet.radius >= canvas.width
    ) {
      setTimeout(() => bullets.splice(index, 1), 0);
    } else {
      bullet.update();
    }
  });

  /*-------------------------------- Functions Animate | Update Missiles  --------------------------------*/
  missiles.forEach((missile, index) => {
    if (
      missile.position.y + missile.height < 0 ||
      missile.position.x + missile.width < 0 ||
      missile.position.x > canvas.width
    ) {
      missiles.splice(index, 1);
    } else {
      missile.update();
    }
  });

  /*-------------------------------- Functions Animate | Update Muzzle Smoke  --------------------------------*/
  // update & draw smoke puffs (BEFORE player)
  muzzleSmokePuffs.forEach((smoke, index) => {
    smoke.update();
    if (smoke.alpha <= 0) {
      muzzleSmokePuffs.splice(index, 1);
    }
  });

  /*-------------------------------- Functions Animate | Update Muzzle Flashes --------------------------------*/
  muzzleFlashes.forEach((flash, index) => {
    if (flash.lifetime <= 0) {
      setTimeout(() => muzzleFlashes.splice(index, 1), 0);
    } else {
      flash.update();
    }
  });

  /*-------------------------------- Functions Animate | Update Explosions  --------------------------------*/

  explosions.forEach((explosion, index) => {
    //index: its position in the array
    if (explosion.opacity <= 0) {
      setTimeout(() => {
        explosions.splice(index, 1);
      }, 0);
    } else {
      explosion.update();
    }
  });

  /*-------------------------------- Functions Animate | Update Alien Bullets  --------------------------------*/

  alienBullets.forEach((alienBullet, index) => {
    if (alienBullet.position.y + alienBullet.height >= canvas.height) {
      setTimeout(() => {
        alienBullets.splice(index, 1);
      }, 0);
    } else alienBullet.update();

    /*------------------------------ Functions Animate | Player Alien Bullet Collision Handler -------------------------------------*/

    // PLAYER Collision Handler | Lose Condition
    if (
      alienBullet.position.y + alienBullet.height >= player.position.y &&
      alienBullet.position.x + alienBullet.width >= player.position.x &&
      alienBullet.position.x <= player.position.x + player.width
    ) {
      setTimeout(() => {
        alienBullets.splice(index, 1);
        player.opacity = 0.2; // semi-transparent flash on hit

        playerLives--; // reduce on life count
        if (playerLives > 0) {
          player.isDamaged = true;
        }
        updateLivesDisplay(); // update life icons

        createExplosions({
          object: player,
          color: ["white", "grey"],
          fades: true,
        });

        // Play player Explosion sound
        playerExplosionSound.currentTime = 0; // sound start time
        playerExplosionSound.play();

        if (playerLives <= 0) {
          player.opacity = 0; // hide player on last life hit
          createExplosions({
            object: player,
            color: "white",
            fades: true,
          });
          // Play player Killed sound
          playerKilledSound.currentTime = 0.0; // sound start time
          playerKilledSound.play();

          game.over = true;
          if (!gameOverTimeout) {
            gameOverTimeout = setTimeout(() => triggerGameOver(), 3000);
          }
        } else {
          // briefly flash, then recover
          setTimeout(() => {
            player.opacity = 1;
          }, 500);
        }
      }, 0);
      /*-------------------------------- Functions Animate | GAME OVER Logic --------------------------------*/
      // GAME OVER Render Logic
      if (playerLives <= 0 && game.over && !game.over && !gameOverTimeout) {
        gameOverTimeout = setTimeout(() => {
          triggerGameOver();
          gameOverTimeout = null;
        }, 3000);
      }

      // Player Explosion Color
      createExplosions({
        object: player,
        color: ["white", "grey"],
        fades: true,
      });
    }
  });

  /*-------------------------------- Functions Animate | Alien Spawning --------------------------------*/
  // Spawning Alien Grids with delayed update
  if (
    !waitingForFirstWave &&
    grids.length === 0 &&
    frames % randomInterval === 0
  ) {
    spawnAlienWave();
    randomInterval = Math.floor(Math.random() * 300 + 500);
    frames = 0;
  }

  // Updating Grids, Aliens and Collisions
  grids.forEach((grid, gridIndex) => {
    if (!game.over && !game.paused) {
      grid.update();

      if (frames % 100 === 0 && grid.aliens.length > 0) {
        grid.aliens[Math.floor(Math.random() * grid.aliens.length)].shoot(
          alienBullets
        );
      }
    }
    grid.aliens.forEach((alien, i) => {
      alien.update({ velocity: grid.velocity });

      if (alien.position.y + alien.height >= canvas.height) {
        if (!game.over) {
          playerLives = 0;
          updateLivesDisplay();

          createExplosions({
            object: player,
            color: ["white", "grey"],
            fades: true,
          });
          playerKilledSound.currentTime = 0;
          playerKilledSound.play();
          player.opacity = 0;

          game.over = true;
          if (!gameOverTimeout) {
            gameOverTimeout = setTimeout(() => triggerGameOver(), 3000);
          }
        }
      }

      /*------------------------------ Functions Animate | Player Collision with Alien -------------------------------------*/
      grids.forEach((grid) => {
        grid.aliens.forEach((alien) => {
          if (
            alien.position.y + alien.height >= player.position.y && // bottom of alien touches top of player
            alien.position.y <= player.position.y + player.height && // alien overlaps vertically
            alien.position.x + alien.width >= player.position.x && // alien overlaps horizontally
            alien.position.x <= player.position.x + player.width
          ) {
            handlePlayerAlienCollision(alien, grid); // Only pass the grid now
          }
        });
      });

      /*-------------------------------- Functions Animate | Bullet Collision --------------------------------*/
      bullets.forEach((projectile, j) => {
        if (
          projectile.position.y - projectile.radius <=
            alien.position.y + alien.height &&
          projectile.position.x + projectile.radius >= alien.position.x &&
          projectile.position.x - projectile.radius <=
            alien.position.x + alien.width &&
          projectile.position.y + projectile.radius >= alien.position.y
        ) {
          setTimeout(() => {
            const alienFound = grid.aliens.find((alien2) => alien2 === alien);
            const projectileFound = bullets.find(
              (proj2) => proj2 === projectile
            );

            if (alienFound && projectileFound) {
              updateScore(100);

              createExplosions({
                object: alien,
                color: ["grey", "white", "black"],
                fades: true,
              });

              //  alien Explosion sound
              alienExplosionSound.currentTime = 0; // sound start time
              alienExplosionSound.play();

              grid.aliens.splice(i, 1);
              bullets.splice(j, 1);

              if (grid.aliens.length > 0) {
                const firstAlien = grid.aliens[0];
                const lastAlien = grid.aliens[grid.aliens.length - 1];

                grid.width =
                  lastAlien.position.x -
                  firstAlien.position.x +
                  lastAlien.width;
                grid.position.x = firstAlien.position.x;
              } else {
                grids.splice(gridIndex, 1);
                if (grids.length === 0) waitingForFirstWave = false;
              }
            }
          }, 0);
        }
      });

      /*-------------------------------- Functions Animate | Missile Collision --------------------------------*/

      missiles.forEach((missile, m) => {
        if (
          missile.position.y <= alien.position.y + alien.height &&
          missile.position.x + missile.width >= alien.position.x &&
          missile.position.x <= alien.position.x + alien.width &&
          missile.position.y + missile.height >= alien.position.y
        ) {
          setTimeout(() => {
            const alienFound = grid.aliens.find((a) => a === alien);
            const missileFound = missiles.find((mis) => mis === missile);

            if (alienFound && missileFound) {
              +updateScore(200); // missing hit points

              createExplosions({
                object: alien,
                color: ["grey", "orange", "black", "white"],
                fades: true,
              });

              missileExplosionSound.currentTime = 0; // sound start time
              missileExplosionSound.play();

              grid.aliens.splice(i, 1);
              missiles.splice(m, 1);

              if (grid.aliens.length > 0) {
                const firstAlien = grid.aliens[0];
                const lastAlien = grid.aliens[grid.aliens.length - 1];

                grid.width =
                  lastAlien.position.x -
                  firstAlien.position.x +
                  lastAlien.width;
                grid.position.x = firstAlien.position.x;
              } else {
                grids.splice(gridIndex, 1);
                if (grids.length === 0) {
                  waitingForFirstWave = false;
                }
              }
            }
          }, 0);
        }
      });
    });
  });

  /*-------------------------------- Functions Animate | Nuclear Collision --------------------------------*/

  // Draw shockwave effects LAST to overlay everything
  nukeProjectiles.forEach((nuke, index) => {
    nuke.update();

    if (nuke.isFlashing) {
      if (nuke.flashFrames > 0) {
        // Flash white
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        nuke.flashFrames--;
      } else {
        // End flashing phase, start shockwave
        nuke.isFlashing = false;
        nuke.shockwaveActive = true;
        nuke.shockwaveRadius = 10;
        nuke.shockwaveAlpha = 1;
      }
    }

    if (nuke.shockwaveActive) {
      // Draw expanding ripple ring
      ctx.save();
      ctx.strokeStyle = `rgba(255, 255, 255, ${nuke.shockwaveAlpha})`;
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(
        canvas.width / 2,
        canvas.height / 2,
        nuke.shockwaveRadius,
        0,
        Math.PI * 2
      );
      ctx.stroke();
      ctx.restore();

      // Update ripple expansion
      nuke.shockwaveRadius += 20; // expansion speed
      nuke.shockwaveAlpha -= 0.02; // fade out

      if (
        nuke.shockwaveRadius >= nuke.shockwaveMaxRadius ||
        nuke.shockwaveAlpha <= 0
      ) {
        nuke.shockwaveActive = false;
        nukeProjectiles.splice(index, 1); // Remove nuke after effect finishes
      }
    }
  });

  frames++;
}

/*----------------------------- Event Listeners -------------------------------*/

//----------------------------- Event Listeners | DOM Content Loading -----------

window.addEventListener("DOMContentLoaded", () => {
  canvas = document.getElementById("gameCanvas");
  if (!canvas) return;
  ctx = canvas.getContext("2d");

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  initBackgroundMusicOnce();
  resizeCanvas();
  initStars();
  player = new Player();
  updateNukeDisplay(); // Update nuke display on load
  loadHighScore(); // Pull high score from localStorage
  applyMasterVolume(); // Apply initial volume settings
  updateVolumeDisplay(); // Update volume display on load

  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("orientationchange", resizeCanvas);

  animate();

  // Volume Control ----exists & run only on game.html
  if (volumeUpBtn && volumeDownBtn && muteBtn) {
    volumeUpBtn.addEventListener("click", () => {
      increaseVolume();
      animateButton(volumeUpBtn);
    });

    volumeDownBtn.addEventListener("click", () => {
      decreaseVolume();
      animateButton(volumeDownBtn);
    });

    muteBtn.addEventListener("click", () => {
      toggleMute();
      animateButton(muteBtn);
    });
  }
  //----- Control Buttons ---- exsists & run only on game.html
  if (switchBtn && restartBtn) {
    switchBtn.addEventListener("click", () => player.switchPlayer());
    restartBtn.addEventListener("click", restartGame);
  }

  //-----Event Listeners | Mobile Button Presses - exists & run only on game.html

  if (leftBtn && rightBtn) {
    leftBtn.addEventListener("touchstart", () => handleHoldStart("a", leftBtn));
    leftBtn.addEventListener("mousedown", () => handleHoldStart("a", leftBtn));
    leftBtn.addEventListener("touchend", () => handleHoldEnd("a", leftBtn));
    leftBtn.addEventListener("mouseup", () => handleHoldEnd("a", leftBtn));
    leftBtn.addEventListener("mouseleave", () => handleHoldEnd("a", leftBtn));
    leftBtn.addEventListener("click", () => {
      handleKey("a");
      setTimeout(() => handleKeyRelease("a"), 100);
    });

    rightBtn.addEventListener("touchstart", () =>
      handleHoldStart("d", rightBtn)
    );
    rightBtn.addEventListener("mousedown", () =>
      handleHoldStart("d", rightBtn)
    );
    rightBtn.addEventListener("touchend", () => handleHoldEnd("d", rightBtn));
    rightBtn.addEventListener("mouseup", () => handleHoldEnd("d", rightBtn));
    rightBtn.addEventListener("mouseleave", () => handleHoldEnd("d", rightBtn));
    rightBtn.addEventListener("click", () => {
      handleKey("d");
      setTimeout(() => handleKeyRelease("d"), 100);
    });
  }

  if (fireBtn && missileBtn && nukeBtn) {
    // Unify all mobile and desktop inputs under pointer events
    fireBtn.addEventListener("pointerdown", () => handleKey(" "));
    fireBtn.addEventListener("pointerup", () => handleKeyRelease(" "));

    missileBtn.addEventListener("pointerdown", () => handleKey("m"));
    missileBtn.addEventListener("pointerup", () => handleKeyRelease("m"));

    nukeBtn.addEventListener("pointerdown", () => handleKey("b"));
    nukeBtn.addEventListener("pointerup", () => handleKeyRelease("b"));
  }
});
//----------------------------- Event Listeners | Keyboard Input ---------------------------

addEventListener("keydown", (event) => {
  if (!player) return;
  handleKey(event.key);
});

addEventListener("keyup", (event) => {
  if (!player) return;
  handleKeyRelease(event.key);
});

//----------------------------- Event Listeners | Audio ----------------------

if (startBtn) {
  startBtn.addEventListener("click", startGame);
}

function initBackgroundMusicOnce() {
  const playMusic = () => {
    if (backgroundMusic.paused) {
      backgroundMusic.currentTime = 0;
      backgroundMusic.play().catch((err) => {
        console.warn("Autoplay blocked:", err);
      });
    }
    window.removeEventListener("keydown", playMusic);
    window.removeEventListener("mousedown", playMusic);
    window.removeEventListener("touchstart", playMusic);
  };

  window.addEventListener("keydown", playMusic);
  window.addEventListener("mousedown", playMusic);
  window.addEventListener("touchstart", playMusic);
}

/*------------------------------- Mobile Browser Address Bar Min --------------------------------*/
function hideAddressBar() {
  window.scrollTo(0, 1);
}

window.addEventListener("load", () => {
  setTimeout(hideAddressBar, 100); // delay needed on some devices
});

window.addEventListener("orientationchange", () => {
  setTimeout(hideAddressBar, 100);
});
