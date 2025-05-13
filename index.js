/*-------------------------------- Constants --------------------------------*/
const starCount = 500;

/*---------------------------- Variables (state) ----------------------------*/
const stars = [];

/*------------------------ Cached Element References ------------------------*/
const canvas = document.getElementById("spaceCanvas");
const ctx = canvas.getContext("2d");

const homeAudio = document.getElementById("homeAudio");

/*-------------------------------- Functions --------------------------------*/
function tryPlayHomeAudio() {
  if (homeAudio && homeAudio.paused) {
    homeAudio.currentTime = 0;
    homeAudio.play().catch((err) => {
      console.warn("Autoplay blocked:", err);
    });
  }
}

class Star {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.z = Math.random() * canvas.width;
    this.radius = Math.random() * 1.5;
  }

  update() {
    this.z -= 2;
    if (this.z <= 0) this.reset();
  }

  draw() {
    const x =
      (this.x - canvas.width / 2) * (canvas.width / this.z) + canvas.width / 2;
    const y =
      (this.y - canvas.height / 2) * (canvas.width / this.z) +
      canvas.height / 2;
    const radius = this.radius * (canvas.width / this.z);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  }
}

function animate() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  stars.forEach((star) => {
    star.update();
    star.draw();
  });
  requestAnimationFrame(animate);
}

/*----------------------------- Event Listeners -----------------------------*/
document.addEventListener("DOMContentLoaded", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  for (let i = 0; i < starCount; i++) {
    stars.push(new Star());
  }

  animate();

  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  const startGameBtn = document.getElementById("startGameBtn");
  const instructionsBtn = document.getElementById("instructionsBtn");
  const closeBtn = document.getElementById("closeInstructionsBtn");
  const panel = document.getElementById("instructionsPanel");

  if (startGameBtn) {
    const navigateToGame = () => {
      window.location.href = "game.html";
    };

    startGameBtn.addEventListener("click", navigateToGame);
    startGameBtn.addEventListener("touchstart", navigateToGame);
  }

  if (instructionsBtn && panel) {
    instructionsBtn.addEventListener("click", () => {
      tryPlayHomeAudio();
      panel.style.display =
        panel.style.display === "none" || panel.style.display === ""
          ? "block"
          : "none";
    });
  }

  if (closeBtn && panel) {
    closeBtn.addEventListener("click", () => {
      tryPlayHomeAudio();
      panel.style.display = "none";
    });
  }

  // Play music on first interaction
  window.addEventListener("click", tryPlayHomeAudio, { once: true });
  window.addEventListener("touchstart", tryPlayHomeAudio, { once: true });
  window.addEventListener("keydown", tryPlayHomeAudio, { once: true });
});
