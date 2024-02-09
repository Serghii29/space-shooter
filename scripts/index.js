import * as PIXI from '../pixi/pixi.js';

const app = new PIXI.Application({
  width: 1280,
  height: 720
});

document.body.appendChild(app.view);

const starTexture = PIXI.Texture.from('https://pixijs.com/assets/star.png');
const shipTexture = PIXI.Texture.from('../data/spaceship.png');
const asteroidTexture = PIXI.Texture.from('../data/asteroid.png');

const ship = new PIXI.Sprite(shipTexture);
ship.anchor.x = 0.5;
ship.anchor.y = 1;
ship.y = app.renderer.screen.height;
ship.height = 150;
ship.width = 150;
app.stage.addChild(ship);

let shipX = app.renderer.screen.width / 2;
let shipSpeed = 0;

window.addEventListener('keydown', (e) => {
  if (e.keyCode === 37) {
    shipSpeed = -0.01;
  } else if (e.keyCode === 39) {
    shipSpeed = 0.01;
  }
});

window.addEventListener('keyup', (e) => {
  if (e.keyCode === 37 || e.keyCode === 39) {
    shipSpeed = 0;
  }
});

const starAmount = 1000;
let cameraZ = 0;
const fov = 20;
const baseSpeed = 0.025;
let speed = 0;
let warpSpeed = 0;
const starStretch = 5;
const starBaseSize = 0.05;

const stars = [];

for (let i = 0; i < starAmount; i++) {
  const star = {
      sprite: new PIXI.Sprite(starTexture),
      z: 0,
      x: 0,
      y: 0,
  };

  star.sprite.anchor.x = 0.5;
  star.sprite.anchor.y = 0.7;
  randomizeStar(star, true);

  app.stage.addChild(star.sprite);
  stars.push(star);
}

function randomizeStar(star, initial) {
  star.z = initial ? Math.random() * 2000 : cameraZ + Math.random() * 1000 + 2000;

  const deg = Math.random() * Math.PI * 2;
  const distance = Math.random() * 50 + 1;

  star.x = Math.cos(deg) * distance;
  star.y = Math.sin(deg) * distance;
}

class Bullet {
  constructor(x, y) {
    this.graphics = new PIXI.Graphics();
    this.graphics.beginFill(0xFF0000);
    this.graphics.drawCircle(0, 0, 5);
    this.graphics.endFill();
    this.graphics.x = x;
    this.graphics.y = y;
    this.speed = 0.01;
    this.rotationSpeed = 0.1;

    app.stage.addChild(this.graphics);
  }

  update() {
    this.graphics.y -= this.speed;
    this.graphics.rotation += this.rotationSpeed;

    if (this.graphics.y <= 0) {
      this.destroy();
    }
  }

  destroy() {
    app.stage.removeChild(this.graphics);
  }
}

class Asteroid {
  constructor(x, y) {
    this.sprite = new PIXI.Sprite(asteroidTexture);
    this.sprite.anchor.set = 0.5;

    this.sprite.x = x;
    this.sprite.y = y;
    this.sprite.height = Math.random() * 75 + 30;
    this.sprite.width = Math.random() * 75 + 30;

    this.velocityX = 0.0003;
    this.velocityY = 0.0003;
  }

  update(delta) {
    this.sprite.x += this.velocityX;
    this.sprite.y += this.velocityY;
  }

  destroy() {
    app.stage.removeChild(this.sprite);
  }
}

const asteroids = [];
let destroyedAsteroids = 0;
let gameOver = false;

// Variables for shooting
let canShoot = true;
let shootCooldown = 0;
const bullets = [];
let bulletsCount = 10

// Processing input for shooting
window.addEventListener('keydown', (e) => {
  if (e.keyCode === 32 && canShoot && !gameOver) {
    canShoot = false;
    shootCooldown = 0.5;

    const bullet = new Bullet(ship.x, ship.y - ship.height / 2);
    bullets.push(bullet);

    bulletsCount -= 1;

    bulletText.text = `Bullets: ${bulletsCount}/10`;
  }
});

for (let i = 0; i < 8; i++) {
  setTimeout(() => {
    const y = -50;
    const x = Math.random() * app.renderer.screen.width - 200;

    if (!gameOver) {
      const asteroid = new Asteroid(x, y);
      asteroids.push(asteroid);
      app.stage.addChild(asteroid.sprite);
    }
  }, i * 13000);
}

// Function for checking the collision of objects
function isColliding(obj1, obj2) {
  return (
    obj1.x < obj2.x + obj2.width &&
    obj1.x + obj1.width > obj2.x &&
    obj1.y < obj2.y + obj2.height &&
    obj1.y + obj1.height > obj2.y
  );
}

function checkCollisions() {
  asteroids.forEach((asteroid, index) => {
    bullets.forEach((bullet) => {
      if (isColliding(asteroid.sprite, bullet.graphics)) {
        asteroids.splice(index, 1);

        destroyedAsteroids++;

        asteroid.destroy();
        bullet.destroy();
      }
    });
  });
}

class Timer {
  constructor(initialTime, x, y) {
    this.counter = initialTime;

    this.text = new PIXI.Text(this.counter.toString(), {
      fontSize: 30,
      fontFamily: 'Cosmic',
      fill: 0xFF0000,
    });

    this.text.x = x;
    this.text.y = y;
  }

  update() {
    this.counter -= 0.01;
    this.text.text = Math.floor(this.counter).toString();
  }

  getContainer() {
    return this.text;
  }
}

function renderGameOver(message) {
  const text = new PIXI.Text(message, {
    fontSize: 50,
    fill: 0xFF0000,
  });
  text.anchor.set(0.5);
  text.position.set(app.renderer.screen.width / 2, app.renderer.screen.height / 2);
  app.stage.addChild(text);
}

const bulletText = new PIXI.Text("Bullets: 10/10", {
  fontSize: 30,
  fontFamily: "Cosmic",
  fill: 0xFF0000,
});

bulletText.x = 20;
bulletText.y = 20;

app.stage.addChild(bulletText);

const timer = new Timer(60, app.renderer.screen.width - 50, 20);
app.stage.addChild(timer.getContainer())

app.ticker.add((delta) => {
  speed += (warpSpeed - speed) / 20;
  cameraZ += delta * 10 * (speed + baseSpeed);

  if (timer.counter > 1 && !gameOver) {
    timer.update();
  }
  
  if (bulletsCount >= 0 && destroyedAsteroids === 8) {
    renderGameOver('You Win!');
    gameOver = true;
  } else if ((bulletsCount === 0 && destroyedAsteroids !== 8) || timer.counter < 1) {
    renderGameOver('You Lose!');
    gameOver = true;
  };

  for (let i = 0; i < starAmount; i++) {
    const star = stars[i];

    if (star.z < cameraZ) {
      randomizeStar(star)
    };

    const z = star.z - cameraZ;

    star.sprite.x = star.x * (fov / z) * app.renderer.screen.width + app.renderer.screen.width / 2;
    star.sprite.y = star.y * (fov / z) * app.renderer.screen.width + app.renderer.screen.height / 2;

    const dxCenter = star.sprite.x - app.renderer.screen.width / 2;
    const dyCenter = star.sprite.y - app.renderer.screen.height / 2;
    const distanceCenter = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter);
    const distanceScale = Math.max(0, (2000 - z) / 2000);

    star.sprite.scale.x = distanceScale * starBaseSize;
    star.sprite.scale.y = distanceScale * starBaseSize
      + distanceScale * speed * starStretch * distanceCenter / app.renderer.screen.width;

    star.sprite.rotation = Math.atan2(dyCenter, dxCenter) + Math.PI / 2;

    shipX += shipSpeed * delta;
    shipX = Math.max(0, Math.min(shipX, app.renderer.screen.width));
    ship.x = shipX;

    checkCollisions();

    asteroids.forEach((asteroid) => {
      asteroid.update(delta);
    });

    if (shootCooldown > 0) {
      shootCooldown -= delta;
      if (shootCooldown <= 0) {
        canShoot = true;
      }
    }

    bullets.forEach((bullet) => {
      bullet.update();
    });
  }
});
