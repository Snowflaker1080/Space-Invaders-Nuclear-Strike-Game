import { players, aliens, weapons } from "./data.js";

/*-------------------------------- Constants --------------------------------*/
const alienBullets = [];
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
};
let player;
let score = 0;
let highScore = 0;
let waitingForFirstWave = true;

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

const bulletLaunchSound = new Audio("./audio/Laser_Gun_SoundFX.mp3");
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
      const scale = 0.15;
      this.image = image;
      this.width = image.width * scale;
      this.height = image.height * scale;
      this.position.x = canvas.width / 2 - this.width / 2;
      this.position.y = canvas.height - this.height - 70;
      updateLivesDisplay();
      cancelAnimationFrame(animationId);
      animate();
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
    this.width = 60;
    this.height = 60;
    this.image = new Image();
    this.image.src = image;

    // Debug loaders
    this.image.onload = () => {
      console.log(`Alien image loaded: ${image}`);
    };
    this.image.onerror = () => {
      console.error(`Failed to load alien image: ${image}`);
    };
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
  }
}

/*--------------------------- Grid Class ---------------------------*/
class Grid {
  constructor(alienType) {
    this.position = { x: 0, y: 0 };
    this.velocity = { x: 3, y: 0 };
    this.aliens = [];

    const columns = Math.floor(Math.random() * 10 + 5);
    const rows = Math.floor(Math.random() * 5 + 2);

    for (let x = 0; x < columns; x++) {
      for (let y = 0; y < rows; y++) {
        this.aliens.push(
          new Alien({
            position: { x: x * 80, y: y * 80 },
            image: alienType.image,
          })
        );
      }
    }
    // Dynamically calculate width
    this.width = columns * 80;
  }

  update() {
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.velocity.y = 0;

    if (this.position.x + this.width >= canvas.width || this.position.x <= 0) {
      this.velocity.x = -this.velocity.x;
      this.velocity.y = 30;
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
    this.radius = 6;
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
    this.width = 6;
    this.height = 12;
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
    this.width = 10;
    this.height = 30;
    this.trail = [];
    this.patternStartTime = Date.now();
    this.pattern = pattern;
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

    this.radius = 2.2; // nuke start size
    this.minRadius = 0.5; // target shrink size
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

    const flashDuration = 100;
    const maxFlashes = 6;
    let flashes = 0;

    const flashInterval = setInterval(() => {
      ctx.fillStyle = flashes % 2 === 0 ? "white" : "black";
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
    const rippleDelay = 500; // milliseconds between ripples

    const startNextRipple = () => {
      if (rippleCount >= maxRipples) return;

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
      console.log("Pressed B key - fire nuke!");
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
  bulletLaunchSound.volume = 0.2 * masterVolume;
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
    bulletLaunchSound,
    missileLaunchSound,
    nukeLaunchSound,
    playerExplosionSound,
    playerKilledSound,
    alienExplosionSound,
    missileExplosionSound,
    backgroundMusic,
  ];
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
  if (player && player.image) {
    player.position.x = canvas.width / 2 - player.width / 2;
    player.position.y = canvas.height - player.height - 30;
  }
}

/*--------------------------- Stars ---------------------------*/

function initStars() {
  stars.length = 0;
  for (let i = 0; i < starCount; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 0.5,
      velocity: { x: 0, y: 0.5 },
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
/*--------------------------- Spawn Alien Wave ---------------------------------*/
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

// Set waiting flag and spawn grid after delay
waitingForFirstWave = true;
setTimeout(() => {
  grids.push(new Grid(aliens[Math.floor(Math.random() * aliens.length)]));
  waitingForFirstWave = false;
}, 2000); // 2 seconds delay

//  if (!isGameAnimating) {
//   cancelAnimationFrame(animate)
// }

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
  if (gameOverTimeout) {
    clearTimeout(gameOverTimeout);
    gameOverTimeout = null;
  }
  // Stopping previous animation loop
  cancelAnimationFrame(animationId);

  // Start or resume background music
  backgroundMusic.currentTime = 0;
  backgroundMusic.play();

  game.active = true;
  game.over = false;
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

  // Alien spawn after delay
  waitingForFirstWave = true;
  setTimeout(() => {
    spawnAlienWave();
  }, 2000); // Delay first wave by 2 seconds

  animate();
}

/*--------------------------- Explosions function  ---------------------------*/
// Explosion
function createExplosions({ object, color, fades }) {
  const colors = Array.isArray(color) ? color : [color || "red"];

  for (let i = 0; i < 15; i++) {
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
        radius: Math.random() * 10,
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

  bullets.length = 0;
  missiles.length = 0;
  alienBullets.length = 0;
  explosions.length = 0;
  muzzleFlashes.length = 0;
  muzzleSmokePuffs.length = 0;
}

/*-------------------------------- Functions | Update Lives Display --------------------------------*/
function updateLivesDisplay() {
  lifeIcons.forEach((icon, index) => {
    //icon.src = players[currentPlayerIndex].image; // always update to current player image
    if (index < playerLives) {
      //icon.classList.remove('lost');
      icon.style.opacity = 1; // visible
      icon.src = players[currentPlayerIndex].image; // current player image
    } else {
      //icon.classList.add('lost');
      icon.style.opacity = 0.2; // dimmed or hidden when lost
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
  animationId = requestAnimationFrame(animate);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

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

    /*------------------------------ Functions Animate | Player Collision -------------------------------------*/

    // PLAYER Collision Handler | Lose Condition
    if (
      alienBullet.position.y + alienBullet.height >= player.position.y &&
      alienBullet.position.x + alienBullet.width >= player.position.x &&
      alienBullet.position.x <= player.position.x + player.width
    ) {
      setTimeout(() => {
        alienBullets.splice(index, 1);
        player.opacity = 0.5; // semi-transparent flash on hit

        playerLives--; // reduce on life count
        updateLivesDisplay(); // update life icons

        createExplosions({
          object: player,
          color: "white",
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
          }, 1000);
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
        color: "white",
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
    randomInterval = Math.floor(Math.random() * 500 + 500);
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
  player = new Player();
  initBackgroundMusicOnce();
  resizeCanvas();
  initStars();
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
  // --- Fire Button: Spacebar ---
  fireBtn.addEventListener("touchstart", () => handleKey(" "));
  fireBtn.addEventListener("mousedown", () => handleKey(" "));
  fireBtn.addEventListener("touchend", () => handleKeyRelease(" "));
  fireBtn.addEventListener("mouseup", () => handleKeyRelease(" "));
  fireBtn.addEventListener("mouseleave", () => handleKeyRelease(" "));
  fireBtn.addEventListener("click", () => {
    handleKey(" ");
    setTimeout(() => handleKeyRelease(" "), 100);
  });

  // --- Missile Button: 'M' Key ---
  missileBtn.addEventListener("touchstart", () => handleKey("m"));
  missileBtn.addEventListener("mousedown", () => handleKey("m"));
  missileBtn.addEventListener("touchend", () => handleKeyRelease("m"));
  missileBtn.addEventListener("mouseup", () => handleKeyRelease("m"));
  missileBtn.addEventListener("mouseleave", () => handleKeyRelease("m"));
  missileBtn.addEventListener("click", () => {
    handleKey("m");
   setTimeout(() => handleKeyRelease("m"), 100);
  });

  // --- Nuke Button: 'B' Key ---
  nukeBtn.addEventListener("touchstart", () => handleKey("b"));
  nukeBtn.addEventListener("mousedown", () => handleKey("b"));
  nukeBtn.addEventListener("touchend", () => handleKeyRelease("b"));
  nukeBtn.addEventListener("mouseup", () => handleKeyRelease("b"));
  nukeBtn.addEventListener("mouseleave", () => handleKeyRelease("b"));
  nukeBtn.addEventListener("click", () => {
    handleKey("b");
    setTimeout(() => handleKeyRelease("b"), 100);
  });
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

/*------------------------------- Initial Call --------------------------------*/
// Start the animation loop
