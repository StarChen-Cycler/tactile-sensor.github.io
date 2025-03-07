// Visual-Tactile Sensor Visualization
// This visualization demonstrates how a visual-tactile sensor works using a gel head and internal camera

// Initialize Three.js scene
let scene, camera, renderer, controls;
let sensor, gelHead, internalCamera, cameraView;
let animationState = 0; // 0: no pressure, 1: applying pressure
let pressureAmount = 0;
let gelDeformation = [];
let contactPosition = new THREE.Vector3(0, 0, 0); // Track contact position for camera view
let cameraRays = []; // Visual rays from camera to contact point

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
    instructions.innerHTML = 'Press SPACE to apply/release pressure<br>Use ARROW KEYS to move the object';
    document.body.appendChild(instructions);

    // Create camera view display
    createCameraView();

    // Start animation loop
    animate();
}

// Create the sensor base and components
function createSensorBase() {
    // Create base platform - transparent
    const baseGeometry = new THREE.BoxGeometry(6, 0.5, 6);
    const baseMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x333333,
        transparent: true,
        opacity: 0.7
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -0.25;
    base.receiveShadow = true;
    scene.add(base);

    // Create sensor housing - transparent
    const housingGeometry = new THREE.BoxGeometry(5, 0.8, 5);
    const housingMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x666666,
        transparent: true,
        opacity: 0.7
    });
    const housing = new THREE.Mesh(housingGeometry, housingMaterial);
    housing.position.y = 0.4;
    housing.receiveShadow = true;
    scene.add(housing);

    // Create 3D camera visualization below the base
    createExternalCameraVisualization();

    // Create internal camera - transparent
    const cameraGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.5, 16);
    const cameraMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x222222,
        transparent: true,
        opacity: 0.7
    });

    // Create pressure object (finger/probe) - positioned to touch the surface initially
    const fingerGeometry = new THREE.SphereGeometry(1, 32, 32);
    const fingerMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffcccc,
        transparent: true,
        opacity: 0.8
    });
    sensor = new THREE.Mesh(fingerGeometry, fingerMaterial);
    sensor.position.y = 1.8;
    sensor.castShadow = true;
    scene.add(sensor);
    
    // Create initial camera rays
    createCameraRays();
}

// Create external camera visualization below the base
function createExternalCameraVisualization() {
    // Create camera body
    const cameraBodyGeometry = new THREE.BoxGeometry(1.5, 0.8, 1);
    const cameraBodyMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x333333,
        transparent: true,
        opacity: 0.8
    });
    const cameraBody = new THREE.Mesh(cameraBodyGeometry, cameraBodyMaterial);
    cameraBody.position.y = -1.5-1; // Position below the base
    scene.add(cameraBody);
    
    // Create camera lens
    const cameraLensGeometry = new THREE.CylinderGeometry(0.4, 0.3, 0.5, 16);
    const cameraLensMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x111111,
        transparent: true,
        opacity: 0.8
    });
    const cameraLens = new THREE.Mesh(cameraLensGeometry, cameraLensMaterial);
    cameraLens.position.y = -1.0-1; // Position above the camera body
    cameraLens.rotation.x = Math.PI / 2; // Point upward
    scene.add(cameraLens);
    
    // Create lens glass
    const lensGlassGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.05, 16);
    const lensGlassMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x8888ff,
        transparent: true,
        opacity: 0.7,
        emissive: 0x4444ff,
        emissiveIntensity: 0.5
    });
    const lensGlass = new THREE.Mesh(lensGlassGeometry, lensGlassMaterial);
    lensGlass.position.y = -0.7-1; // Position at the top of the lens
    lensGlass.rotation.x = Math.PI / 2;
    scene.add(lensGlass);
}

// Create camera rays from external camera to contact point
function createCameraRays() {
    // Clear existing rays
    cameraRays.forEach(ray => scene.remove(ray));
    cameraRays = [];
    
    // Create rays from camera to various points on the gel
    const rayCount = 8;
    const rayMaterial = new THREE.LineBasicMaterial({ 
        color: 0x00ffff,
        transparent: true,
        opacity: 0.4
    });
    
    // Create a cone of rays
    for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2;
        const radius = 1.5; // Spread of rays at the top
        
        // Calculate end position (on the gel surface)
        const endX = Math.cos(angle) * radius;
        const endZ = Math.sin(angle) * radius;
        
        const rayGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, -2.0, 0), // Start at camera lens (corrected position)
            new THREE.Vector3(endX, 0.8, endZ) // End at gel surface (adjusted from 1.5 to 0.8)
        ]);
        
        const ray = new THREE.Line(rayGeometry, rayMaterial);
        scene.add(ray);
        cameraRays.push(ray);
    }
    
    // Create central ray
    const centralRayGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -2.0, 0), // Start at camera lens (corrected position)
        new THREE.Vector3(0, 0.8, 0) // End at center of gel (adjusted from 1.5 to 0.8)
    ]);
    
    const centralRayMaterial = new THREE.LineBasicMaterial({ 
        color: 0xffff00,
        transparent: true,
        opacity: 0.6
    });
    
    const centralRay = new THREE.Line(centralRayGeometry, centralRayMaterial);
    scene.add(centralRay);
    cameraRays.push(centralRay);
}

// Update camera rays based on contact position
function updateCameraRays() {
    // Remove all existing rays
    cameraRays.forEach(ray => scene.remove(ray));
    cameraRays = [];
    
    // Create rays from camera to contact point and surrounding area
    const rayCount = 8;
    const rayMaterial = new THREE.LineBasicMaterial({ 
        color: 0x00ffff,
        transparent: true,
        opacity: 0.4
    });
    
    // Calculate contact point on gel
    const contactY = 0.8 - pressureAmount * 0.5; // Adjust height based on pressure (adjusted from 1.5 to 0.8)
    
    // Create a cone of rays around the contact point
    for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2;
        const radius = 0.5 + pressureAmount * 0.5; // Spread of rays at the top
        
        // Calculate end position (around contact point)
        const endX = contactPosition.x + Math.cos(angle) * radius;
        const endZ = contactPosition.z + Math.sin(angle) * radius;
        
        const rayGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, -2.0, 0), // Start at camera lens (corrected position)
            new THREE.Vector3(endX, contactY, endZ) // End at contact area
        ]);
        
        const ray = new THREE.Line(rayGeometry, rayMaterial);
        scene.add(ray);
        cameraRays.push(ray);
    }
    
    // Create central ray to contact point
    const centralRayGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -2.0, 0), // Start at camera lens (corrected position)
        new THREE.Vector3(contactPosition.x, contactY, contactPosition.z) // End at contact point
    ]);
    
    const centralRayMaterial = new THREE.LineBasicMaterial({ 
        color: 0xffff00,
        transparent: true,
        opacity: 0.6
    });
    
    const centralRay = new THREE.Line(centralRayGeometry, centralRayMaterial);
    scene.add(centralRay);
    cameraRays.push(centralRay);
}

// Create camera view display
function createCameraView() {
    // Create a div to display the "camera view"
    cameraView = document.createElement('div');
    cameraView.style.position = 'absolute';
    cameraView.style.top = '10px';
    cameraView.style.right = '10px';
    cameraView.style.width = '200px';
    cameraView.style.height = '150px';
    cameraView.style.backgroundColor = '#000';
    cameraView.style.border = '2px solid #444';
    cameraView.style.borderRadius = '5px';
    cameraView.style.overflow = 'hidden';
    cameraView.style.zIndex = '100';
    
    // Create canvas for the camera view
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 150;
    cameraView.appendChild(canvas);
    
    // Add title
    const title = document.createElement('div');
    title.style.position = 'absolute';
    title.style.top = '5px';
    title.style.left = '5px';
    title.style.color = '#fff';
    title.style.fontSize = '12px';
    title.style.fontFamily = 'Arial, sans-serif';
    title.innerHTML = 'Internal Camera View';
    cameraView.appendChild(title);
    
    document.body.appendChild(cameraView);
}

// Update camera view based on gel deformation and object position
function updateCameraView() {
    const canvas = cameraView.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Calculate contact position relative to center
    const offsetX = contactPosition.x * 20; // Scale for display
    const offsetY = contactPosition.z * 20; // Use z for y in 2D view
    
    // Draw "camera view" based on deformation
    if (pressureAmount > 0) {
        // Draw deformation pattern - offset based on contact position
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(canvas.width / 2 + offsetX, canvas.height / 2 + offsetY, 40 * pressureAmount, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw some noise/texture
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const size = Math.random() * 3 + 1;
            ctx.fillRect(x, y, size, size);
        }
        
        // Draw contact area
        ctx.strokeStyle = '#f00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(canvas.width / 2 + offsetX, canvas.height / 2 + offsetY, 45 * pressureAmount, 0, Math.PI * 2);
        ctx.stroke();
        
        // Add pressure value text
        ctx.fillStyle = '#ff0';
        ctx.font = '14px Arial';
        ctx.fillText(`Pressure: ${(pressureAmount * 100).toFixed(0)}%`, 10, canvas.height - 10);
        
        // Add position indicators
        ctx.fillStyle = '#0ff';
        ctx.fillText(`X: ${contactPosition.x.toFixed(2)}`, 10, canvas.height - 30);
        ctx.fillText(`Z: ${contactPosition.z.toFixed(2)}`, 10, canvas.height - 50);
    } else {
        // Draw standby pattern
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.fillText('No contact detected', 10, canvas.height / 2);
    }
}

// Update gel deformation based on pressure
function updateGelDeformation() {
    // Update contact position based on sensor position
    // Normalize to -1 to 1 range relative to gel center
    contactPosition.x = sensor.position.x / 2;
    contactPosition.z = sensor.position.z / 2;
    
    // Update camera rays to show imaging process
    updateCameraRays();
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
    }
    
    // Allow moving the sensor with arrow keys
    const moveSpeed = 0.2;
    if (event.code === 'ArrowLeft') {
        sensor.position.x -= moveSpeed;
    } else if (event.code === 'ArrowRight') {
        sensor.position.x += moveSpeed;
    } else if (event.code === 'ArrowUp') {
        sensor.position.z -= moveSpeed;
    } else if (event.code === 'ArrowDown') {
        sensor.position.z += moveSpeed;
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
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
    
    // Update sensor position (only Y-axis for pressure)
    sensor.position.y = 1.8 - pressureAmount * 1.0;
    
    // Update gel deformation
    updateGelDeformation();
    
    // Update camera view
    updateCameraView();
    
    // Render scene
    renderer.render(scene, camera);
}

// Initialize the visualization
init(); 