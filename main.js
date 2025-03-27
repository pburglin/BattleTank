// Main game variables
let scene, camera, renderer;
let miniMapScene, miniMapCamera, miniMapRenderer;
let tank, enemyTanks = [];
let bullets = [];
let score = 0;
let gameOver = false;
let mapSize = 100;
let obstacles = [];
let tankVelocity = 0;
let tankAcceleration = 0;
let tankMaxSpeed = 0.3;
let tankDeceleration = 0.02;
let rotatingLeft = false;
let rotatingRight = false;
let lives = 3;
let isHit = false;
let hitTimer = 0;

// DOM elements
let scoreDisplay;
let gameOverDisplay;
let livesDisplay;

// Initialize the game
function init() {
    // Create UI elements
    createUI();
    
    // Main view setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 0);
    
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('main-view'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Mini-map setup
    miniMapScene = new THREE.Scene();
    miniMapCamera = new THREE.OrthographicCamera(-mapSize/2, mapSize/2, mapSize/2, -mapSize/2, 1, 1000);
    miniMapCamera.position.set(0, 50, 0);
    miniMapCamera.lookAt(0, 0, 0);
    
    miniMapRenderer = new THREE.WebGLRenderer({ canvas: document.getElementById('mini-map'), alpha: true });
    miniMapRenderer.setSize(200, 200);
    
    // Create ground
    const groundGeometry = new THREE.PlaneGeometry(mapSize, mapSize);
    const groundMaterial = new THREE.MeshBasicMaterial({ color: 0x228B22, side: THREE.DoubleSide });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
    miniMapScene.add(ground.clone());
    
    // Create obstacles
    createObstacles();
    
    // Create player tank
    createTank();
    
    // Create enemy tanks
    for (let i = 0; i < 3; i++) {
        createEnemyTank();
    }
    
    // Event listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    // Start game loop
    animate();
}

function createUI() {
    // Create score display
    scoreDisplay = document.createElement('div');
    scoreDisplay.style.position = 'absolute';
    scoreDisplay.style.top = '20px';
    scoreDisplay.style.left = '20px';
    scoreDisplay.style.color = 'white';
    scoreDisplay.style.fontSize = '24px';
    scoreDisplay.textContent = `Score: ${score}`;
    document.body.appendChild(scoreDisplay);
    
    // Create lives display
    livesDisplay = document.createElement('div');
    livesDisplay.style.position = 'absolute';
    livesDisplay.style.top = '60px';
    livesDisplay.style.left = '20px';
    livesDisplay.style.color = 'white';
    livesDisplay.style.fontSize = '24px';
    livesDisplay.textContent = `Lives: ${lives}`;
    document.body.appendChild(livesDisplay);
    
    // Create game over display
    gameOverDisplay = document.createElement('div');
    gameOverDisplay.style.position = 'absolute';
    gameOverDisplay.style.top = '50%';
    gameOverDisplay.style.left = '50%';
    gameOverDisplay.style.transform = 'translate(-50%, -50%)';
    gameOverDisplay.style.color = 'red';
    gameOverDisplay.style.fontSize = '48px';
    gameOverDisplay.style.display = 'none';
    gameOverDisplay.textContent = 'GAME OVER';
    document.body.appendChild(gameOverDisplay);
}

function createObstacles() {
    // Create more obstacles (25 instead of 10)
    for (let i = 0; i < 25; i++) {
        const size = 2 + Math.random() * 3;
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
        const obstacle = new THREE.Mesh(geometry, material);
        
        const x = (Math.random() - 0.5) * mapSize * 0.8;
        const z = (Math.random() - 0.5) * mapSize * 0.8;
        obstacle.position.set(x, size/2, z);
        
        scene.add(obstacle);
        obstacle.miniMapClone = obstacle.clone();
        miniMapScene.add(obstacle.miniMapClone);
        obstacles.push(obstacle);
    }
}

function createTank() {
    const bodyGeometry = new THREE.BoxGeometry(2, 1, 3);
    const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0x556B2F });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    
    const turretGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 16);
    const turretMaterial = new THREE.MeshBasicMaterial({ color: 0x8B4513 });
    const turret = new THREE.Mesh(turretGeometry, turretMaterial);
    turret.position.y = 1;
    turret.rotation.x = Math.PI / 2;
    
    const barrelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
    const barrelMaterial = new THREE.MeshBasicMaterial({ color: 0x696969 });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.position.set(0, 1, -1.5);
    barrel.rotation.x = Math.PI / 2;
    
    tank = new THREE.Group();
    tank.add(body);
    tank.add(turret);
    tank.add(barrel);
    tank.position.set(0, 0, 0);
    tank.health = 100;
    
    scene.add(tank);
    // Create minimap clone with original colors first
    tank.miniMapClone = tank.clone();
    
    // Then modify only the minimap clone's colors
    tank.miniMapClone.children.forEach(child => {
        if (child.material) {
            // Save original material reference
            const originalMaterial = child.material;
            // Create new material for minimap with blue color
            child.material = new THREE.MeshBasicMaterial({
                color: 0x0000FF,
                transparent: originalMaterial.transparent,
                opacity: originalMaterial.opacity
            });
        }
    });
    miniMapScene.add(tank.miniMapClone);
}

function createEnemyTank() {
    const bodyGeometry = new THREE.BoxGeometry(2, 1, 3);
    const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0x8B0000 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    
    const turretGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.5, 16);
    const turretMaterial = new THREE.MeshBasicMaterial({ color: 0xA0522D });
    const turret = new THREE.Mesh(turretGeometry, turretMaterial);
    turret.position.y = 1;
    turret.rotation.x = Math.PI / 2;
    
    const barrelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2, 8);
    const barrelMaterial = new THREE.MeshBasicMaterial({ color: 0x696969 });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.position.set(0, 1, -1.5);
    barrel.rotation.x = Math.PI / 2;
    
    const enemyTank = new THREE.Group();
    enemyTank.add(body);
    enemyTank.add(turret);
    enemyTank.add(barrel);
    enemyTank.health = 100;
    
    const x = (Math.random() - 0.5) * mapSize * 0.8;
    const z = (Math.random() - 0.5) * mapSize * 0.8;
    enemyTank.position.set(x, 0, z);
    
    scene.add(enemyTank);
    enemyTank.miniMapClone = enemyTank.clone();
    miniMapScene.add(enemyTank.miniMapClone);
    enemyTanks.push(enemyTank);
}

function createBullet(position, direction, isPlayerBullet = true) {
    const geometry = new THREE.SphereGeometry(0.3, 16, 16);
    const material = new THREE.MeshBasicMaterial({ 
        color: isPlayerBullet ? 0xFF0000 : 0xFFFF00 
    });
    const bullet = new THREE.Mesh(geometry, material);
    
    bullet.position.copy(position);
    bullet.direction = direction.clone().normalize();
    bullet.speed = 0.8;
    bullet.distance = 0;
    bullet.maxDistance = 50;
    bullet.isPlayerBullet = isPlayerBullet;
    
    scene.add(bullet);
    bullets.push(bullet);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
    if (gameOver) return;
    
    const rotateSpeed = 0.05;
    
    switch(event.key) {
        case 'ArrowUp':
            tankAcceleration = 0.01;
            break;
        case 'ArrowDown':
            tankAcceleration = -0.01;
            break;
        case 'ArrowLeft':
            tank.rotation.y += rotateSpeed;
            break;
        case 'ArrowRight':
            tank.rotation.y -= rotateSpeed;
            if (Math.abs(tankVelocity) > 0.01) {
                tank.translateX(0.02 * tankVelocity/tankMaxSpeed);
            }
            break;
        case ' ':
            const bulletPosition = new THREE.Vector3();
            tank.getWorldPosition(bulletPosition);
            bulletPosition.y += 1;
            
            const direction = new THREE.Vector3(0, 0, -1);
            direction.applyQuaternion(tank.quaternion);
            
            createBullet(bulletPosition, direction, true);
            break;
    }
}

function onKeyUp(event) {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        tankAcceleration = 0;
    }
}

function checkCollisions() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        
        if (bullet.isPlayerBullet) {
            for (let j = enemyTanks.length - 1; j >= 0; j--) {
                const enemy = enemyTanks[j];
                if (bullet.position.distanceTo(enemy.position) < 2) {
                    enemy.health -= 25;
                    scene.remove(bullet);
                    bullets.splice(i, 1);
                    
                    if (enemy.health <= 0) {
                        // Kill effect
                        isHit = true;
                        hitTimer = 0;
                        scene.background = new THREE.Color(0x00FF00); // Green flash
                        
                        scene.remove(enemy);
                        miniMapScene.remove(enemyTanks[j].miniMapClone);
                        enemyTanks.splice(j, 1);
                        score += 100;
                        scoreDisplay.textContent = `Score: ${score}`;
                        
                        if (enemyTanks.length === 0) {
                            for (let k = 0; k < 3; k++) {
                                createEnemyTank();
                            }
                        }
                    }
                    break;
                }
            }
        } else {
            if (bullet.position.distanceTo(tank.position) < 2) {
                scene.remove(bullet);
                bullets.splice(i, 1);
                
                isHit = true;
                hitTimer = 0;
                lives--;
                livesDisplay.textContent = `Lives: ${lives}`;
                
                if (lives <= 0) {
                    gameOver = true;
                    gameOverDisplay.style.display = 'block';
                }
            }
        }
        
        for (const obstacle of obstacles) {
            if (bullet.position.distanceTo(obstacle.position) < obstacle.geometry.parameters.width) {
                scene.remove(bullet);
                bullets.splice(i, 1);
                break;
            }
        }
    }
}

function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        const bullet = bullets[i];
        bullet.position.add(bullet.direction.clone().multiplyScalar(bullet.speed));
        bullet.distance += bullet.speed;
        
        if (bullet.distance > bullet.maxDistance) {
            scene.remove(bullet);
            bullets.splice(i, 1);
        }
    }
}

function updateTankMovement() {
    if (tankAcceleration > 0) {
        tankVelocity = Math.min(tankVelocity + tankAcceleration, tankMaxSpeed);
    } else if (tankAcceleration < 0) {
        tankVelocity = Math.max(tankVelocity + tankAcceleration, -tankMaxSpeed/2);
    } else {
        if (tankVelocity > 0) {
            tankVelocity = Math.max(tankVelocity - tankDeceleration, 0);
        } else if (tankVelocity < 0) {
            tankVelocity = Math.min(tankVelocity + tankDeceleration, 0);
        }
    }
    
    if (Math.abs(tankVelocity) > 0.001) {
        const oldPosition = tank.position.clone();
        tank.translateZ(-tankVelocity);
        
        // Check collisions with walls, enemies and boundaries
        let collided = false;
        
        // Check obstacles
        for (const obstacle of obstacles) {
            if (tank.position.distanceTo(obstacle.position) <
                obstacle.geometry.parameters.width/2 + 1.5) {
                collided = true;
                break;
            }
        }
        
        // Check enemy tanks
        if (!collided) {
            for (const enemy of enemyTanks) {
                if (tank.position.distanceTo(enemy.position) < 2.5) {
                    collided = true;
                    break;
                }
            }
        }
        
        // Check map boundaries
        if (!collided && (Math.abs(tank.position.x) > mapSize/2 - 2 ||
                         Math.abs(tank.position.z) > mapSize/2 - 2)) {
            collided = true;
        }
        
        if (collided) {
            tank.position.copy(oldPosition);
            tankVelocity *= 0.5; // Bounce back effect
        }
        if (Math.abs(tank.position.x) > mapSize/2 - 2 ||
            Math.abs(tank.position.z) > mapSize/2 - 2) {
            tank.position.copy(oldPosition);
        }
    }
}

function updateHitEffect() {
    if (isHit) {
        hitTimer += 0.1;
        const flicker = Math.sin(hitTimer * 20) > 0;
        scene.background = new THREE.Color(flicker ? 0xFF0000 : 0x87CEEB);
        
        if (hitTimer > 1) {
            isHit = false;
            scene.background = new THREE.Color(0x87CEEB);
        }
    }
}

function animate() {
    if (gameOver) return;
    
    requestAnimationFrame(animate);
    
    updateTankMovement();
    
    // Improved camera follow - keeps tank centered
    const tankWorldPosition = new THREE.Vector3();
    tank.getWorldPosition(tankWorldPosition);
    
    // Camera follows 5 units behind tank, 2 units up
    const cameraOffset = new THREE.Vector3(0, 2, 5);
    cameraOffset.applyQuaternion(tank.quaternion);
    camera.position.copy(tankWorldPosition).add(cameraOffset);
    
    // Camera looks at tank position
    camera.lookAt(tankWorldPosition);
    
    updateBullets();
    checkCollisions();
    updateHitEffect();
    
    for (const enemy of enemyTanks) {
        if (Math.random() < 0.01) {
            enemy.rotation.y = Math.random() * Math.PI * 2;
        }
        // Enemy movement with collision detection
        const oldPosition = enemy.position.clone();
        enemy.translateZ(-0.05);
        
        // Check wall collisions
        for (const obstacle of obstacles) {
            if (enemy.position.distanceTo(obstacle.position) <
                obstacle.geometry.parameters.width/2 + 1.5) {
                enemy.position.copy(oldPosition);
                enemy.rotation.y = Math.random() * Math.PI * 2;
                break;
            }
        }
        
        // Check map boundaries
        if (Math.abs(enemy.position.x) > mapSize/2 - 2 ||
            Math.abs(enemy.position.z) > mapSize/2 - 2) {
            enemy.position.copy(oldPosition);
            enemy.rotation.y = Math.random() * Math.PI * 2;
        }
        
        if (Math.random() < 0.01) {
            const bulletPosition = new THREE.Vector3();
            enemy.getWorldPosition(bulletPosition);
            bulletPosition.y += 1;
            
            const direction = new THREE.Vector3(0, 0, -1);
            direction.applyQuaternion(enemy.quaternion);
            
            createBullet(bulletPosition, direction, false);
        }
    }
    
    // Update minimap to center on player
    if (tank.miniMapClone) {
        tank.miniMapClone.rotation.copy(tank.rotation);
        tank.miniMapClone.position.set(0, 0, 0); // Center player in minimap
        
        // Position other elements relative to player
        for (const enemy of enemyTanks) {
            if (enemy.miniMapClone) {
                enemy.miniMapClone.rotation.copy(enemy.rotation);
                enemy.miniMapClone.position.set(
                    enemy.position.x - tank.position.x,
                    0,
                    enemy.position.z - tank.position.z
                );
            }
        }
        
        // Position obstacles relative to player
        obstacles.forEach(obstacle => {
            if (obstacle.miniMapClone) {
                obstacle.miniMapClone.position.set(
                    obstacle.position.x - tank.position.x,
                    0,
                    obstacle.position.z - tank.position.z
                );
            }
        });
    }
    
    renderer.render(scene, camera);
    miniMapRenderer.render(miniMapScene, miniMapCamera);
}

init();