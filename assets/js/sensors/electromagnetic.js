// Electromagnetic Type Tactile Sensor Visualization
// This visualization demonstrates how an electromagnetic-based tactile sensor works using Hall effect

// Initialize Three.js scene
let scene, camera, renderer, controls;
let magnetObject, hallSensors = [];
let protectiveLayer; // Reference to the blue transparent layer
let animationState = 0; // 0: no pressure, 1: normal load, 2: shear load
let pressureAmount = 0;
let shearAmount = 0;
let magneticField = [];
let fieldArrows = [];
let bounceFactor = 0; // For bouncy animation
let lastTime = 0; // For time-based animation

// Setup the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    // Create camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 3, 0); // Position camera for side view
    camera.lookAt(0, 1, 0);

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
    instructions.innerHTML = 'Press SPACE to toggle between states (Initial → Normal Load → Shear Load)';
    document.body.appendChild(instructions);

    // Add state indicator
    const stateIndicator = document.createElement('div');
    stateIndicator.id = 'state-indicator';
    stateIndicator.style.position = 'absolute';
    stateIndicator.style.top = '10px';
    stateIndicator.style.right = '10px';
    stateIndicator.style.color = 'white';
    stateIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    stateIndicator.style.padding = '10px';
    stateIndicator.style.borderRadius = '5px';
    stateIndicator.innerHTML = 'Current State: Initial';
    document.body.appendChild(stateIndicator);

    // Start animation loop
    lastTime = performance.now();
    animate();
}

// Create the sensor base and components
function createSensorBase() {
    // Create base platform
    const baseGeometry = new THREE.BoxGeometry(6, 0.5, 2);
    const baseMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x333333,
        transparent: true,
        opacity: 0.7
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -0.25;
    base.receiveShadow = true;
    scene.add(base);

    // Create sensor housing (green layer in diagram)
    const housingGeometry = new THREE.BoxGeometry(5, 0.2, 1.5);
    const housingMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x88cc88,
        transparent: true,
        opacity: 0.7
    });
    const housing = new THREE.Mesh(housingGeometry, housingMaterial);
    housing.position.y = 0.1;
    housing.receiveShadow = true;
    scene.add(housing);

    // Create Hall effect sensors (yellow rectangles in diagram)
    const hallSensorGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.8);
    const hallSensorMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffcc22,
        transparent: true,
        opacity: 0.7
    });
    
    // Create a row of Hall sensors
    for (let x = -1.5; x <= 1.5; x += 0.75) {
        const hallSensor = new THREE.Mesh(hallSensorGeometry, hallSensorMaterial.clone());
        hallSensor.position.set(x, 0.25, 0);
        hallSensor.receiveShadow = true;
        scene.add(hallSensor);
        hallSensors.push(hallSensor);
    }

    // Create protective layer (blue layer in diagram)
    const protectiveGeometry = new THREE.BoxGeometry(5, 0.3, 1.5);
    const protectiveMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x4488ff,
        transparent: true,
        opacity: 0.7
    });
    protectiveLayer = new THREE.Mesh(protectiveGeometry, protectiveMaterial);
    protectiveLayer.position.y = 0.45;
    protectiveLayer.receiveShadow = true;
    scene.add(protectiveLayer);

    // Create magnet object (yellow ball in diagram)
    const magnetGeometry = new THREE.SphereGeometry(0.6, 32, 32);
    const magnetMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffff00,
        transparent: true,
        opacity: 0.7
    });
    magnetObject = new THREE.Mesh(magnetGeometry, magnetMaterial);
    // Position the ball above the surface initially
    magnetObject.position.y = 1.5;
    magnetObject.castShadow = true;
    scene.add(magnetObject);

    // Create magnetic field visualization
    createMagneticField();
}

// Create magnetic field lines
function createMagneticField() {
    // Clear any existing field lines
    magneticField.forEach(field => {
        if (field.mesh) {
            scene.remove(field.mesh);
            field.mesh.geometry.dispose();
            field.mesh.material.dispose();
        }
    });
    
    fieldArrows.forEach(arrow => {
        if (arrow.arrow) {
            scene.remove(arrow.arrow);
        }
    });
    
    magneticField = [];
    fieldArrows = [];
    
    // Parameters for the magnetic field
    const blueLayerWidth = 4.5; // Slightly less than the actual width (5) to keep within edges
    const blueLayerDepth = 1.3; // Slightly less than the actual depth (1.5)
    const yBottom = 0.6; // Bottom of the top surface of the blue block
    
    // Number of field lines in each direction
    const linesX = 8; // Lines along X axis
    
    // Create grid of start and end points on the bottom of the top surface
    const startPoints = [];
    const endPoints = [];
    
    // Create evenly spaced points along the X axis
    const xSpacing = blueLayerWidth / (linesX + 1);
    for (let i = 1; i <= linesX; i++) {
        const x = -blueLayerWidth/2 + i * xSpacing;
        
        // Create points along positive Z
        startPoints.push(new THREE.Vector3(x, yBottom, blueLayerDepth/2));
        endPoints.push(new THREE.Vector3(x, yBottom, -blueLayerDepth/2));
        
        // Create points along negative Z
        startPoints.push(new THREE.Vector3(x, yBottom, -blueLayerDepth/2));
        endPoints.push(new THREE.Vector3(x, yBottom, blueLayerDepth/2));
    }
    
    // Create half-circle downward curves between start and end points
    for (let i = 0; i < startPoints.length; i++) {
        const start = startPoints[i];
        const end = endPoints[i];
        
        // Calculate midpoint between start and end
        const midX = (start.x + end.x) / 2;
        const midZ = (start.z + end.z) / 2;
        
        // Calculate distance between start and end
        const distance = Math.sqrt(
            Math.pow(end.x - start.x, 2) + 
            Math.pow(end.z - start.z, 2)
        );
        
        // Calculate depth of the curve (how far down it goes)
        const depth = distance * 0.5;
        
        // Create a half-circle curve using quadratic bezier
        const curve = new THREE.QuadraticBezierCurve3(
            start,
            new THREE.Vector3(midX, yBottom - depth, midZ),
            end
        );
        
        const points = curve.getPoints(50);
        
        // Create a tube geometry for the curve
        const tubeGeometry = new THREE.TubeGeometry(
            curve,
            50, // tubular segments
            0.03, // radius
            8, // radial segments
            false // closed
        );
        
        const material = new THREE.MeshPhongMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.7,
            shininess: 30
        });
        
        const tube = new THREE.Mesh(tubeGeometry, material);
        scene.add(tube);
        
        // Store field line data for animation
        magneticField.push({
            mesh: tube,
            curve: curve,
            start: start.clone(),
            end: end.clone(),
            midPoint: new THREE.Vector3(midX, yBottom - depth, midZ),
            baseDepth: depth, // Store the original depth for reference
            distance: distance
        });
        
        // Add arrows to show direction
        const arrowCount = 3;
        for (let j = 0; j < arrowCount; j++) {
            const t = 0.25 + j * 0.25; // Position along the curve (0.25, 0.5, 0.75)
            const point = curve.getPointAt(t);
            const direction = curve.getTangentAt(t);
            
            const arrowLength = 0.15;
            const arrowHelper = new THREE.ArrowHelper(
                direction.normalize(),
                point,
                arrowLength,
                0x000000, // black color
                arrowLength * 0.5, // head length
                arrowLength * 0.3  // head width
            );
            
            scene.add(arrowHelper);
            fieldArrows.push({
                arrow: arrowHelper,
                curveT: t,
                fieldIndex: i
            });
        }
    }
    
    // Create direct connections to Hall sensors
    for (let i = 0; i < hallSensors.length; i++) {
        const sensor = hallSensors[i];
        const xPos = sensor.position.x;
        
        // Create a curved connection from the bottom of the blue layer to the Hall sensor
        const curve = new THREE.CubicBezierCurve3(
            new THREE.Vector3(xPos, 0.3, 0), // Bottom of blue layer
            new THREE.Vector3(xPos, 0.28, 0), // Control point 1
            new THREE.Vector3(xPos, 0.27, 0), // Control point 2
            new THREE.Vector3(xPos, 0.25, 0)  // Hall sensor
        );
        
        const tubeGeometry = new THREE.TubeGeometry(
            curve,
            8, // tubular segments
            0.02, // radius
            6, // radial segments
            false // closed
        );
        
        const material = new THREE.MeshPhongMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.7
        });
        
        const tube = new THREE.Mesh(tubeGeometry, material);
        scene.add(tube);
        
        // Store connection data
        magneticField.push({
            mesh: tube,
            type: 'sensor',
            sensorIndex: i,
            xPos: xPos
        });
    }
}

// Update magnetic field based on magnet position
function updateMagneticField() {
    const magnetX = magnetObject.position.x;
    const magnetY = magnetObject.position.y;
    const magnetZ = magnetObject.position.z;
    
    // Update each field line
    magneticField.forEach((field, index) => {
        // Handle sensor connection lines
        if (field.type === 'sensor') {
            const xPos = field.xPos;
            
            // Calculate distance from this sensor to magnet center
            const distance = Math.sqrt(Math.pow(xPos - magnetX, 2) + Math.pow(0.25 - magnetY, 2));
            
            // Calculate field strength (inverse square law)
            const fieldStrength = 1 / (distance * distance);
            
            // Update Hall sensor color based on field strength
            if (field.sensorIndex >= 0 && field.sensorIndex < hallSensors.length) {
                const sensor = hallSensors[field.sensorIndex];
                // Map field strength to color (yellow to red)
                const colorValue = Math.min(1, fieldStrength * 5);
                sensor.material.color.setRGB(1, 1 - colorValue * 0.8, 0);
                // Maintain transparency when color changes
                sensor.material.transparent = true;
                sensor.material.opacity = 0.7;
            }
        } else {
            // Handle magnetic field curves
            const start = field.start;
            const end = field.end;
            const baseDepth = field.baseDepth;
            
            // Calculate midpoint between start and end
            const midX = (start.x + end.x) / 2;
            const midZ = (start.z + end.z) / 2;
            const yBottom = start.y; // Bottom of the top surface
            
            // Calculate distance from magnet to midpoint of curve
            const dx = midX - magnetX;
            const dy = yBottom - magnetY;
            const dz = midZ - magnetZ;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            // Calculate expansion factor based on distance
            // Closer magnet = more expansion (deeper curve)
            const maxExpansion = 2.5; // Maximum expansion factor
            const minDistance = 1.0; // Distance at which maximum expansion occurs
            
            // Calculate expansion factor (inverse relationship with distance)
            let expansionFactor = 1.0;
            if (distance < 3.0) {
                expansionFactor = 1.0 + (maxExpansion - 1.0) * Math.max(0, (3.0 - distance) / (3.0 - minDistance));
            }
            
            // Calculate new depth with expansion
            const newDepth = baseDepth * expansionFactor;
            
            // Create a new curve with the updated depth
            const newCurve = new THREE.QuadraticBezierCurve3(
                start,
                new THREE.Vector3(midX, yBottom - newDepth, midZ),
                end
            );
            
            // Update the geometry
            field.mesh.geometry.dispose(); // Clean up old geometry
            field.mesh.geometry = new THREE.TubeGeometry(
                newCurve,
                50, // tubular segments
                0.03, // radius
                8, // radial segments
                false // closed
            );
            
            // Update the curve reference for arrow updates
            field.curve = newCurve;
            
            // Calculate field strength
            const fieldStrength = 1 / (distance * distance);
            
            // Update opacity based on field strength but maintain base transparency
            field.mesh.material.opacity = 0.7;
        }
    });
    
    // Update field arrows
    fieldArrows.forEach(arrowData => {
        const t = arrowData.curveT;
        const field = magneticField[arrowData.fieldIndex];
        
        // Skip if the parent field doesn't exist anymore
        if (!field || !field.curve) return;
        
        // Get updated position and direction from the curve
        const point = field.curve.getPointAt(t);
        const direction = field.curve.getTangentAt(t);
        
        // Update arrow position and direction
        arrowData.arrow.position.copy(point);
        arrowData.arrow.setDirection(direction.normalize());
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
        // Cycle through states: 0 (initial) -> 1 (normal load) -> 2 (shear load) -> 0 (initial)
        animationState = (animationState + 1) % 3;
        
        // Reset values when returning to initial state
        if (animationState === 0) {
            pressureAmount = 0;
            shearAmount = 0;
        }
        
        // Add an initial bounce when changing states
        bounceFactor = 0.15;
        
        // Update state indicator
        const stateIndicator = document.getElementById('state-indicator');
        if (stateIndicator) {
            const states = ['Initial', 'Normal Load', 'Shear Load'];
            stateIndicator.innerHTML = `Current State: ${states[animationState]}`;
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
    
    // Animate based on current state
    if (animationState === 1) {
        // Normal load - move magnet down
        if (pressureAmount < 1) {
            pressureAmount += 0.01;
        }
        shearAmount = 0; // Reset shear when in normal load
    } else if (animationState === 2) {
        // Shear load - move magnet sideways
        if (shearAmount < 1) {
            shearAmount += 0.01;
        }
        // Keep some pressure in shear mode
        if (pressureAmount < 0.5) {
            pressureAmount += 0.01;
        } else if (pressureAmount > 0.5) {
            pressureAmount -= 0.01;
        }
    } else {
        // Initial state - reset position
        if (pressureAmount > 0) {
            pressureAmount -= 0.01;
        }
        if (shearAmount > 0) {
            shearAmount -= 0.01;
        }
    }
    
    // Clamp values
    pressureAmount = Math.max(0, Math.min(1, pressureAmount));
    shearAmount = Math.max(0, Math.min(1, shearAmount));
    
    // Update bounce animation
    if (bounceFactor > 0) {
        bounceFactor -= 0.005;
        if (bounceFactor < 0) bounceFactor = 0;
    }
    
    // Calculate bounce offset
    const bounceOffset = Math.sin(time * 0.01) * bounceFactor;
    
    // Update magnet position
    magnetObject.position.y = 1.5 - pressureAmount * 0.7 + bounceOffset;
    magnetObject.position.x = shearAmount * 1.5; // Move right for shear load
    
    // Update magnetic field visualization
    updateMagneticField();
    
    // Animate field arrows with subtle pulsing effect
    const pulseFactor = 0.8 + 0.2 * Math.sin(time * 0.002);
    fieldArrows.forEach((arrowData, index) => {
        // Apply slight pulsing effect with offset based on index
        const offset = index * 0.1;
        const individualPulse = 0.8 + 0.2 * Math.sin(time * 0.001 + offset);
        arrowData.arrow.scale.set(individualPulse, individualPulse, individualPulse);
    });
    
    // Render scene
    renderer.render(scene, camera);
}

// Initialize the visualization
init(); 