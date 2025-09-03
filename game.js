// Fofr Pedro 3D - HlavnÃ­ hernÃ­ logika
import * as THREE from ‘./three.module.js’;

class FofrPedroGame {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.obstacles = [];
        this.coins = [];
        this.score = 0;
        this.gameSpeed = 0.1;
        this.isGameRunning = false;
        this.isGameOver = false;
        this.playerLane = 0; // -1 left, 0 center, 1 right
        this.playerY = 0;
        this.isJumping = false;
        this.jumpVelocity = 0;
        this.gravity = -0.02;
        
        this.keys = {
            left: false,
            right: false,
            jump: false
        };
        
        this.init();
    }
    
    init() {
        this.setupScene();
        this.setupPlayer();
        this.setupLighting();
        this.setupControls();
        this.setupUI();
        
        // Start the game loop
        this.animate();
    }
    
    setupScene() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 10, 100);
        
        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 5, 8);
        this.camera.lookAt(0, 0, 0);
        
        // Create renderer
        const canvas = document.getElementById(‘gameCanvas’);
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas,
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x87CEEB);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Create ground
        this.createGround();
        
        // Create road lanes
        this.createRoadLanes();
        
        // Handle window resize
        window.addEventListener(‘resize’, () => this.onWindowResize());
    }
    
    createGround() {
        const groundGeometry = new THREE.PlaneGeometry(20, 200);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x90EE90 
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -1;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }
    
    createRoadLanes() {
        // Create road surface
        const roadGeometry = new THREE.PlaneGeometry(6, 200);
        const roadMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x444444 
        });
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.rotation.x = -Math.PI / 2;
        road.position.y = -0.99;
        road.receiveShadow = true;
        this.scene.add(road);
        
        // Create lane dividers
        for (let i = -50; i < 150; i += 4) {
            const dividerGeometry = new THREE.BoxGeometry(0.1, 0.1, 2);
            const dividerMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xFFFFFF 
            });
            
            // Left divider
            const leftDivider = new THREE.Mesh(dividerGeometry, dividerMaterial);
            leftDivider.position.set(-1, -0.9, -i);
            this.scene.add(leftDivider);
            
            // Right divider
            const rightDivider = new THREE.Mesh(dividerGeometry, dividerMaterial);
            rightDivider.position.set(1, -0.9, -i);
            this.scene.add(rightDivider);
        }
    }
    
    setupPlayer() {
        // Create simple player character (box for now)
        const playerGeometry = new THREE.BoxGeometry(0.8, 1.6, 0.8);
        const playerMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFF6B6B 
        });
        this.player = new THREE.Mesh(playerGeometry, playerMaterial);
        this.player.position.set(0, 0.8, 5);
        this.player.castShadow = true;
        this.scene.add(this.player);
        
        // Add simple face
        const faceGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.1);
        const faceMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFFDDBB 
        });
        const face = new THREE.Mesh(faceGeometry, faceMaterial);
        face.position.set(0, 0.3, 0.45);
        this.player.add(face);
        
        // Add eyes
        const eyeGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        const eyeMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x000000 
        });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.15, 0.1, 0.05);
        face.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.15, 0.1, 0.05);
        face.add(rightEye);
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        this.scene.add(directionalLight);
    }
    
    setupControls() {
        // Keyboard controls
        document.addEventListener(‘keydown’, (event) => {
            switch(event.code) {
                case ‘ArrowLeft’:
                case ‘KeyA’:
                    this.keys.left = true;
                    event.preventDefault();
                    break;
                case ‘ArrowRight’:
                case ‘KeyD’:
                    this.keys.right = true;
                    event.preventDefault();
                    break;
                case ‘ArrowUp’:
                case ‘KeyW’:
                case ‘Space’:
                    this.keys.jump = true;
                    event.preventDefault();
                    break;
            }
        });
        
        document.addEventListener(‘keyup’, (event) => {
            switch(event.code) {
                case ‘ArrowLeft’:
                case ‘KeyA’:
                    this.keys.left = false;
                    break;
                case ‘ArrowRight’:
                case ‘KeyD’:
                    this.keys.right = false;
                    break;
                case ‘ArrowUp’:
                case ‘KeyW’:
                case ‘Space’:
                    this.keys.jump = false;
                    break;
            }
        });
        
        // Touch controls
        const leftBtn = document.getElementById(‘leftBtn’);
        const rightBtn = document.getElementById(‘rightBtn’);
        const jumpBtn = document.getElementById(‘jumpBtn’);
        
        // Touch events for mobile
        leftBtn.addEventListener(‘touchstart’, (e) => {
            e.preventDefault();
            this.keys.left = true;
        });
        leftBtn.addEventListener(‘touchend’, (e) => {
            e.preventDefault();
            this.keys.left = false;
        });
        
        rightBtn.addEventListener(‘touchstart’, (e) => {
            e.preventDefault();
            this.keys.right = true;
        });
        rightBtn.addEventListener(‘touchend’, (e) => {
            e.preventDefault();
            this.keys.right = false;
        });
        
        jumpBtn.addEventListener(‘touchstart’, (e) => {
            e.preventDefault();
            this.keys.jump = true;
        });
        jumpBtn.addEventListener(‘touchend’, (e) => {
            e.preventDefault();
            this.keys.jump = false;
        });
        
        // Mouse events as backup
        leftBtn.addEventListener(‘mousedown’, () => this.keys.left = true);
        leftBtn.addEventListener(‘mouseup’, () => this.keys.left = false);
        rightBtn.addEventListener(‘mousedown’, () => this.keys.right = true);
        rightBtn.addEventListener(‘mouseup’, () => this.keys.right = false);
        jumpBtn.addEventListener(‘mousedown’, () => this.keys.jump = true);
        jumpBtn.addEventListener(‘mouseup’, () => this.keys.jump = false);
    }
    
    setupUI() {
        const startButton = document.getElementById(‘startButton’);
        const restartButton = document.getElementById(‘restartButton’);
        
        startButton.addEventListener(‘click’, () => this.startGame());
        restartButton.addEventListener(‘click’, () => this.restartGame());
    }
    
    startGame() {
        this.isGameRunning = true;
        this.isGameOver = false;
        document.getElementById(‘startScreen’).style.display = ‘none’;
        document.getElementById(‘gameOverScreen’).style.display = ‘none’;
    }
    
    restartGame() {
        this.score = 0;
        this.gameSpeed = 0.1;
        this.playerLane = 0;
        this.playerY = 0;
        this.isJumping = false;
        this.jumpVelocity = 0;
        
        // Clear obstacles and coins
        this.obstacles.forEach(obstacle => this.scene.remove(obstacle));
        this.coins.forEach(coin => this.scene.remove(coin));
        this.obstacles = [];
        this.coins = [];
        
        // Reset player position
        this.player.position.set(0, 0.8, 5);
        
        this.startGame();
    }
    
    updatePlayer() {
        if (!this.isGameRunning || this.isGameOver) return;
        
        // Lane switching
        if (this.keys.left && this.playerLane > -1) {
            this.playerLane—;
            this.keys.left = false;
        }
        if (this.keys.right && this.playerLane < 1) {
            this.playerLane++;
            this.keys.right = false;
        }
        
        // Jumping
        if (this.keys.jump && !this.isJumping) {
            this.isJumping = true;
            this.jumpVelocity = 0.3;
            this.keys.jump = false;
        }
        
        // Apply jump physics
        if (this.isJumping) {
            this.playerY += this.jumpVelocity;
            this.jumpVelocity += this.gravity;
            
            if (this.playerY <= 0) {
                this.playerY = 0;
                this.isJumping = false;
                this.jumpVelocity = 0;
            }
        }
        
        // Update player position
        const targetX = this.playerLane * 2;
        this.player.position.x = THREE.MathUtils.lerp(this.player.position.x, targetX, 0.1);
        this.player.position.y = 0.8 + this.playerY;
        
        // Simple animation
        this.player.rotation.z = Math.sin(Date.now() * 0.01) * 0.1;
    }
    
    spawnObstacle() {
        if (Math.random() < 0.02) {
            const obstacleGeometry = new THREE.BoxGeometry(1, 2, 1);
            const obstacleMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x8B4513 
            });
            const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
            
            const lane = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
            obstacle.position.set(lane * 2, 1, -20);
            obstacle.castShadow = true;
            
            this.scene.add(obstacle);
            this.obstacles.push(obstacle);
        }
    }
    
    spawnCoin() {
        if (Math.random() < 0.03) {
            const coinGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 8);
            const coinMaterial = new THREE.MeshLambertMaterial({ 
                color: 0xFFD700 
            });
            const coin = new THREE.Mesh(coinGeometry, coinMaterial);
            
            const lane = Math.floor(Math.random() * 3) - 1;
            coin.position.set(lane * 2, 1.5, -20);
            coin.rotation.x = Math.PI / 2;
            
            this.scene.add(coin);
            this.coins.push(coin);
        }
    }
    
    updateObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i—) {
            const obstacle = this.obstacles[i];
            obstacle.position.z += this.gameSpeed;
            
            // Remove obstacles that are behind the camera
            if (obstacle.position.z > 10) {
                this.scene.remove(obstacle);
                this.obstacles.splice(i, 1);
                continue;
            }
            
            // Check collision with player
            if (this.checkCollision(obstacle, this.player)) {
                this.gameOver();
                return;
            }
        }
    }
    
    updateCoins() {
        for (let i = this.coins.length - 1; i >= 0; i—) {
            const coin = this.coins[i];
            coin.position.z += this.gameSpeed;
            coin.rotation.y += 0.1; // Spin animation
            
            // Remove coins that are behind the camera
            if (coin.position.z > 10) {
                this.scene.remove(coin);
                this.coins.splice(i, 1);
                continue;
            }
            
            // Check collection by player
            if (this.checkCollision(coin, this.player)) {
                this.score += 10;
                document.getElementById(‘score’).textContent = `SkÃ³re: ${this.score}`;
                this.scene.remove(coin);
                this.coins.splice(i, 1);
            }
        }
    }
    
    checkCollision(obj1, obj2) {
        const distance = obj1.position.distanceTo(obj2.position);
        return distance < 1.2; // Simple collision detection
    }
    
    updateCamera() {
        // Follow player with smooth camera movement
        const targetX = this.player.position.x * 0.3;
        this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, targetX, 0.05);
    }
    
    updateScore() {
        if (this.isGameRunning && !this.isGameOver) {
            this.score += 1;
            document.getElementById(‘score’).textContent = `SkÃ³re: ${this.score}`;
            
            // Increase game speed gradually
            this.gameSpeed = Math.min(0.2, 0.1 + this.score * 0.00001);
        }
    }
    
    gameOver() {
        this.isGameOver = true;
        this.isGameRunning = false;
        
        document.getElementById(‘finalScore’).textContent = `FinÃ¡lnÃ­ skÃ³re: ${this.score}`;
        document.getElementById(‘gameOverScreen’).style.display = ‘flex’;
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.isGameRunning && !this.isGameOver) {
            this.updatePlayer();
            this.spawnObstacle();
            this.spawnCoin();
            this.updateObstacles();
            this.updateCoins();
            this.updateCamera();
            this.updateScore();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize game when page loads
document.addEventListener(‘DOMContentLoaded’, () => {
    new FofrPedroGame();
});