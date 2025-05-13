                             🛸 Space Invaders: Nuclear Assault

Deployment Link - https://snowflaker1080.github.io/Game-Project-Space-Invaders/
	
HOME SCREEN
![Screenshot 2025-05-14 at 00 01 40](https://github.com/user-attachments/assets/ee8d2a09-1159-473d-82bb-948d833b9b74)


HOW TO PLAY | INSTRUCTIONS SCREEN
![Screenshot 2025-05-14 at 00 05 41](https://github.com/user-attachments/assets/dc92fdbd-3c3f-46f7-ab01-6ed140240890)


GAME PLAY SCREEN | Desktop & Mobile
![Screenshot 2025-05-14 at 00 08 29](https://github.com/user-attachments/assets/29fba11a-5e13-417a-887e-5ac2cf030e40)
	

🛸 Space Invaders: Nuclear Assault

Space Invaders: Nuclear Assault is a fast-paced, retro-inspired browser game built with HTML5, CSS, and JavaScript. 
Pilot a fighter jet to defend Earth from waves of alien invaders using bullets, missiles, and nukes. 
Featuring pixel-style sprites, explosive sound effects, and dynamic gameplay, this game brings arcade nostalgia to the modern browser.

No libraries, no frameworks—just pure JavaScript and DOM manipulation. Playable directly in the browser.



🚀 FEATURES
	•	👾 Classic alien swarm attack patterns
	•	🎯 Three-tier weapon system: bullets, missiles, and nukes
	•	🔊 Dynamic sound effects and looping background music
	•	🕹 Keyboard and mobile touch controls
	•	🧠 Game over and win logic with restart functionality
	•	🏆 Score system with persistent high score tracking
	•	🎨 Starscape background and particle effects
	•	🔁 Switch between multiple player characters mid-game



 🎮 HOW TO PLAY

Controls (Keyboard)
	•	A – Move Left
	•	D – Move Right
	•	SPACE – Fire bullets
	•	M – Fire missile
	•	V – Deploy nuke

Controls (Mobile)
	•	Tap ⬅️ / ➡️ buttons to move
	•	Tap 🔥 to fire bullets
	•	Tap 💣 to launch missiles
	•	Tap ☢️ to unleash a nuke

Your goal is to eliminate all alien fleets while avoiding incoming fire. Strategic use of nukes clears the entire screen, but they’re limited—use wisely!


📦 INSTALLATION

	1.	Clone the repository:

 git clone https://github.com/snowflaker1080/space-invaders-game-project.git
cd space-invaders-game-project

	2.	Open index.html in your preferred browser:

 open index.html

 
✅ No dependencies or installations required. Works offline after first load.


🌐 PLAY ONLINE

You can play the game instantly via GitHub Pages:
➡️ https://snowflaker1080.github.io/space-invaders-game-project


🛠 TECH STACK	
	•	HTML5 Canvas – Game rendering
	•	CSS3 – UI styling and responsiveness
	•	JavaScript (ES6) – Game logic and DOM interactions
	•	Vanilla DOM APIs – No frameworks or libraries used


 🤝 CONTRIBUTING

Have ideas for new weapons, alien types, or game modes? Contributions are welcome!
	1.	Fork the repo
	2.	Create a feature branch
	3.	Commit your changes
	4.	Open a pull request

Please ensure your code is clean and well-commented.


🧠 ENGINEERING SUMMARY & DEVELOPMENT INSIGHTS

This project was built as part of an applied learning initiative focused on front-end software engineering and 2D browser-based game development. 
The goal was to design and implement a full-featured arcade-style shooter using vanilla JavaScript, HTML5 <canvas>, and CSS — without external frameworks — to gain fluency in low-level browser APIs, real-time rendering, and interactive UI systems.


🧩 Systems Design & Technical Concepts

•	Custom Game Loop Architecture
Engineered a frame-synchronized game loop using requestAnimationFrame, enabling smooth animations, time-based updates, and decoupled draw logic.
	
 •	Canvas Rendering Pipeline
Implemented low-level graphics rendering with HTML5 <canvas>, drawing and transforming sprites, particles, shockwaves, and UI overlays at runtime.
	
 •	Entity-Component Object Management
Modeled game objects (player, enemies, projectiles) as reusable class-based components, managing lifecycle, behaviour, and interaction via composition.
	
 •	Stateful Game Logic & Control Flow
Developed a deterministic game state system (e.g., start, play, win/loss, restart), ensuring consistent behaviour, loop resets, and UI synchronisation.
	
 •	Collision Detection & Physics Handling
Designed 2D collision systems using bounding boxes and radial proximity checks for precise hit detection between entities in motion.
	
 •	Audio System Integration
Integrated SFX and music playback with gesture-triggered policies to comply with browser autoplay restrictions and enhance player immersion.
	
 •	Cross-Platform Input Handling
Created both keyboard and mobile touch control schemes, including support for hold/long-press behaviour on virtual buttons, using event delegation.
	
 •	Persistent Game State via Local Storage
Implemented high score persistence with localStorage, reinforcing UX continuity across sessions without server dependencies.
	
 •	Responsive UI & Visual Design
Applied responsive CSS and dynamic scaling to adapt layout and controls for multiple screen sizes while maintaining playability and clarity.


📈 Engineering Learnings & Outcomes
	
 •	Applied object-oriented programming principles in a real-time system
	
 •	Learned to manage runtime memory (e.g., cleaning up intervals, animation frames) to prevent game loop duplication and performance leaks
	
 •	Gained working knowledge of browser graphics programming and rendering context optimisation
	
 •	Practiced modularisation, code separation, and functional grouping to support scalability
	
 •	Strengthened debugging techniques and runtime behaviour tracing using dev tools
	
 •	Embraced software lifecycle practices such as version control, attribution compliance, and iterative development

⸻

This project demonstrates the practical integration of software engineering principles with interactive game systems, and serves as a milestone in the developer’s transition from foundational programming into system-level design, UI responsiveness, and real-time client-side architecture.


🔮 POTENTIAL FUTURE IMPROVEMENTS

🎮 Gameplay Features
	•	Power-Ups & Upgrades
Introduce collectible power-ups (e.g., faster fire rate, shield, double damage) or a weapon upgrade system tied to score or kill streaks.
	•	Multiple Enemy Types & Behaviours
Add varied alien classes (e.g., fast scouts, heavy tanks, teleporters) with unique movement patterns and attack styles.
	•	Level Progression & Boss Fights
Implement structured levels or waves with increasing difficulty, culminating in boss battles with multi-phase mechanics.
	•	Lives, Health System & Checkpoints
Expand the health/lives mechanic with partial damage, shield bars, or lives-based continues.
	•	Multiplayer (Local or Online)
Add local two-player co-op (split-screen or shared) or experiment with real-time multiplayer using WebSockets.

⸻

🧠 AI & Procedural Systems
	•	Alien Movement AI
Use basic pathfinding or steering behaviours instead of rigid grid formations.
	•	Procedural Wave Generation
Generate alien waves dynamically based on player performance or difficulty curve.
	•	Difficulty Scaling
Adapt game speed, spawn rates, and enemy aggression over time or by score.

⸻

🎨 UI/UX & Audio Enhancements
	•	Pause Menu & Settings Panel
Include a pause button with volume sliders, control remapping, and game instructions.
	•	In-Game Soundtrack Manager
Cycle through multiple tracks or let players toggle music types.
	•	Animated Title Screen & Credits
Add polish to the home screen with animated logos, transitions, and a proper credits page.

⸻

💻 Technical Improvements
	•	Modular Code Refactoring
Break the codebase into more reusable modules (e.g., GameEngine.js, UIManager.js, SoundManager.js) for scalability.
	•	Use a Game Framework (Optional)
Port to a lightweight game framework like Phaser.js for more advanced physics, scene management, and easier mobile publishing.
	•	Save Game State
Store player progress, settings, or last played level in localStorage or IndexedDB.

⸻

🚀 Stretch Goals
	•	Touch Gestures & Accelerometer Support
Add swipe-based movement or device tilt control for a native mobile feel.
	•	High Score Leaderboard (Online)
Use Firebase or Supabase to store and retrieve high scores globally.
	•	PWA (Progressive Web App)
Convert your game into a PWA to support offline play and mobile home screen launching.


🙏 ATTRIBUTION

This project uses free and open-source assets. Full credit with thanks is given below to the original creators:

🎵 Audio

•	Intro Background Music
“Intro_Background_SFX.mp3” by Pixabay Music – Free for commercial use

•	Explosion Sound Effects
“Explosion.wav” by Fesliyan Studios – Licensed for free use with attribution

•	Missile Launch
“Rocket Whoosh.wav” by Zapsplat – Free with attribution

•	Laser Fire
“Laser_Shoot.wav” by OpenGameArt.org – Public domain / CC0

•	Nuke Detonation Sound
“Deep Boom.wav” by Mixkit – Free for commercial use

🖼 Visuals

•	Player Jet Sprite
Custom sprite edited from “Spaceship” asset by Kenney.nl – CC0

•	Alien Sprites
“Pixel Aliens Pack” by CraftPix.net – Free version with attribution

•	Nuclear Weapon Image
Derived from public domain icon, modified under CC0

•	Starfield Background
Procedurally generated via JavaScript (no external asset)

•	Buttons and Icons
Emoji characters used under Unicode standard

📜 Fonts
•	UI Font
System default sans-serif (Arial, fallback) – Free to use on all major browsers

If you are an original creator of any asset and wish to request removal or correction, please open an issue or contact via GitHub.



©️ Copyright & Legal Disclaimer

This project, Space Invaders: Nuclear Assault, is a student-led educational project developed as part of a learning journey in web development. It is not affiliated with, endorsed by, or associated with any existing game franchise, including “Space Invaders”™ by Taito Corporation. All characters, concepts, and assets used are either original, free-to-use with attribution, or adapted under permissive licenses (e.g. CC0, public domain, or free for commercial use).

👨‍💻 About the Developer

This game was created by a rookie software developer as part of a General Assembly coding bootcamp. It is the result of independent study and experimentation using vanilla JavaScript, HTML5, and CSS3. The project demonstrates core programming concepts such as:

•	DOM manipulation
•	Object-oriented programming
•	Canvas rendering
•	Game loops and state management
•	Mobile responsiveness

This project was built from scratch with no prior professional experience, and is intended solely for educational use, portfolio demonstration, and non-commercial sharing.

⚖️ Legal Use & Restrictions

•	🚫 No copyright infringement intended.
•	📚 Educational use only.
•	✅ All third-party assets are used under their respective licenses and fully attributed above.
•	📎 This game is not for resale, monetisation, or distribution beyond personal and educational use.

If any issues arise regarding asset usage or credit, please submit a GitHub issue and appropriate action will be taken.












 
