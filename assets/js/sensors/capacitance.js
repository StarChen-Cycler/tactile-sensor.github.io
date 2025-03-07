// Capacitor Type Tactile Sensor Visualization
// This visualization demonstrates how a capacitor-based tactile sensor works

// Initialize Three.js scene
let scene, camera, renderer, controls;
let sensor, topPlate, bottomPlate, dielectricLayer;
let animationState = 0; // 0: no pressure, 1: applying pressure
let pressureAmount = 0;
let electricField = [];
let bounceFactor = 0; // For bouncy animation
let lastTime = 0; // For time-based animation

// Setup the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    // Create camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    // Add orbit controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Create sensor base
    createSensorBase();

    // Add event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onKeyDown);

    // Add instructions
    const instructions = document.createElement('div');
    instructions.style.position = 'absolute';
    instructions.style.bottom = '10px';
    instructions.style.left = '10px';
    instructions.style.color = 'white';
    instructions.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    instructions.style.padding = '10px';
    instructions.style.borderRadius = '5px';
    instructions.innerHTML = 'Press SPACE to apply/release pressure';
    document.body.appendChild(instructions);

    // Start animation loop
    lastTime = performance.now();
    animate();
}

// Create the sensor base and components
function createSensorBase() {
    // Create base platform
    const baseGeometry = new THREE.BoxGeometry(6, 0.5, 6);
    const baseMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -0.25;
    base.receiveShadow = true;
    scene.add(base);

    // Create sensor housing
    const housingGeometry = new THREE.BoxGeometry(5, 1, 5);
    const housingMaterial = new THREE.MeshPhongMaterial({ color: 0x666666 });
    const housing = new THREE.Mesh(housingGeometry, housingMaterial);
    housing.position.y = 0.5;
    housing.receiveShadow = true;
    scene.add(housing);

    // Create bottom capacitor plate
    const bottomPlateGeometry = new THREE.BoxGeometry(4, 0.1, 4);
    const plateMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc, metalness: 0.7, roughness: 0.2 });
    bottomPlate = new THREE.Mesh(bottomPlateGeometry, plateMaterial);
    bottomPlate.position.y = 0.8;
    bottomPlate.receiveShadow = true;
    scene.add(bottomPlate);

    // Create dielectric layer
    const dielectricGeometry = new THREE.BoxGeometry(3.8, 0.5, 3.8);
    const dielectricMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x88aaff, 
        transparent: true, 
        opacity: 0.7 
    });
    dielectricLayer = new THREE.Mesh(dielectricGeometry, dielectricMaterial);
    dielectricLayer.position.y = 1.1;
    scene.add(dielectricLayer);

    // Create top capacitor plate with bouncy texture
    const topPlateGeometry = new THREE.BoxGeometry(4, 0.15, 4);
    
    // Create bouncy material with texture
    const topPlateMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xcccccc, 
        metalness: 0.7, 
        roughness: 0.2,
        bumpScale: 0.02
    });
    
    // Add a grid pattern to simulate a bouncy texture
    const textureSize = 512;
    const gridSize = 16;
    const canvas = document.createElement('canvas');
    canvas.width = textureSize;
    canvas.height = textureSize;
    const ctx = canvas.getContext('2d');
    
    // Fill background
    ctx.fillStyle = '#cccccc';
    ctx.fillRect(0, 0, textureSize, textureSize);
    
    // Draw grid pattern
    ctx.strokeStyle = '#aaaaaa';
    ctx.lineWidth = 2;
    
    for (let i = 0; i <= gridSize; i++) {
        const pos = i * (textureSize / gridSize);
        
        // Draw horizontal line
        ctx.beginPath();
        ctx.moveTo(0, pos);
        ctx.lineTo(textureSize, pos);
        ctx.stroke();
        
        // Draw vertical line
        ctx.beginPath();
        ctx.moveTo(pos, 0);
        ctx.lineTo(pos, textureSize);
        ctx.stroke();
    }
    
    // Draw circular indents to simulate a bouncy surface
    ctx.fillStyle = '#dddddd';
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const x = (i + 0.5) * (textureSize / gridSize);
            const y = (j + 0.5) * (textureSize / gridSize);
            const radius = textureSize / gridSize / 4;
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    topPlateMaterial.map = texture;
    
    // Create bump map for 3D effect
    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = textureSize;
    bumpCanvas.height = textureSize;
    const bumpCtx = bumpCanvas.getContext('2d');
    
    // Fill with mid-gray (no displacement)
    bumpCtx.fillStyle = '#808080';
    bumpCtx.fillRect(0, 0, textureSize, textureSize);
    
    // Draw circular bumps
    bumpCtx.fillStyle = '#ffffff';
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            const x = (i + 0.5) * (textureSize / gridSize);
            const y = (j + 0.5) * (textureSize / gridSize);
            const radius = textureSize / gridSize / 4;
            
            bumpCtx.beginPath();
            bumpCtx.arc(x, y, radius, 0, Math.PI * 2);
            bumpCtx.fill();
        }
    }
    
    // Create bump map texture
    const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
    topPlateMaterial.bumpMap = bumpTexture;
    
    topPlate = new THREE.Mesh(topPlateGeometry, topPlateMaterial);
    topPlate.position.y = 1.7;
    topPlate.castShadow = true;
    topPlate.receiveShadow = true;
    scene.add(topPlate);

    // Create pressure object (finger/probe)
    const fingerGeometry = new THREE.SphereGeometry(1, 32, 32);
    const fingerMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffcccc,
        transparent: true,
        opacity: 0.8
    });
    sensor = new THREE.Mesh(fingerGeometry, fingerMaterial);
    // Position the ball to touch the top plate initially
    sensor.position.y = 2.775; // 1.7 (plate position) + 0.075 (half plate height) + 1 (ball radius)
    sensor.castShadow = true;
    scene.add(sensor);

    // Create electric field lines
    createElectricField();
}

// Create electric field lines between capacitor plates
function createElectricField() {
    const lineCount = 20;
    const lineGeometry = new THREE.BufferGeometry();
    const lineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x00ffff,
        transparent: true,
        opacity: 0.6
    });

    // Create a grid of lines
    for (let x = -1.5; x <= 1.5; x += 3 / Math.sqrt(lineCount)) {
        for (let z = -1.5; z <= 1.5; z += 3 / Math.sqrt(lineCount)) {
            const points = [];
            points.push(new THREE.Vector3(x, 0.85, z));
            points.push(new THREE.Vector3(x, 1.65, z));
            
            lineGeometry.setFromPoints(points);
            const line = new THREE.Line(lineGeometry.clone(), lineMaterial.clone());
            scene.add(line);
            electricField.push(line);
        }
    }
}

// Update electric field lines based on pressure
function updateElectricField() {
    const topY = 1.7 - pressureAmount * 0.5;
    const bottomY = 0.8;
    
    electricField.forEach((line, index) => {
        const positions = line.geometry.attributes.position.array;
        
        // Update the y-coordinate of the second point (top plate)
        positions[4] = topY;
        
        // Update the geometry
        line.geometry.attributes.position.needsUpdate = true;
        
        // Update opacity based on field strength (inversely proportional to distance)
        const fieldStrength = 1 / (topY - bottomY);
        line.material.opacity = 0.2 + fieldStrength * 0.5;
    });
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Handle key press
function onKeyDown(event) {
    if (event.code === 'Space') {
        animationState = 1 - animationState; // Toggle between 0 and 1
        
        // Add an initial bounce when pressure is released
        if (animationState === 0 && pressureAmount > 0.5) {
            bounceFactor = 0.15;
        }
    }
}

// Animation loop
function animate(time) {
    requestAnimationFrame(animate);
    
    // Calculate delta time for smooth animation
    const deltaTime = time - lastTime;
    lastTime = time;
    
    // Update controls
    controls.update();
    
    // Animate pressure application
    if (animationState === 1 && pressureAmount < 1) {
        // Applying pressure
        pressureAmount += 0.01;
    } else if (animationState === 0 && pressureAmount > 0) {
        // Releasing pressure
        pressureAmount -= 0.01;
    }
    
    // Clamp pressure amount
    pressureAmount = Math.max(0, Math.min(1, pressureAmount));
    
    // Update bounce animation
    if (bounceFactor > 0) {
        bounceFactor -= 0.005;
        if (bounceFactor < 0) bounceFactor = 0;
    }
    
    // Calculate bounce offset
    const bounceOffset = Math.sin(time * 0.01) * bounceFactor;
    
    // Update sensor position - keep it touching the top plate
    sensor.position.y = 2.775 - pressureAmount * 0.5 + bounceOffset;
    
    // Update top plate position with bounce effect
    topPlate.position.y = 1.7 - pressureAmount * 0.5 + bounceOffset * 0.5;
    
    // Add squish effect to the dielectric layer when pressed
    dielectricLayer.position.y = 1.1 - pressureAmount * 0.25 + bounceOffset * 0.25;
    
    // Scale the dielectric layer based on pressure
    const squishFactor = 1 - pressureAmount * 0.5;
    dielectricLayer.scale.y = squishFactor;
    
    // Update electric field
    updateElectricField();
    
    // Render scene
    renderer.render(scene, camera);
}

// Initialize the visualization
init(); 