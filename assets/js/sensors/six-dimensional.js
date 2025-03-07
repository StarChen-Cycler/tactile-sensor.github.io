// Six-Dimensional Force Sensor Visualization
// This visualization demonstrates how a six-dimensional force sensor works using strain gauges

// Initialize Three.js scene
let scene, camera, renderer, controls;
let sensor, elasticBody, strainGauges = [];
let forceArrows = [];
let animationState = 0; // 0: no force, 1: applying force
let forceAmount = 0;
let forceDirection = new THREE.Vector3(0, -1, 0); // Default force direction (downward)
let torqueAxis = new THREE.Vector3(0, 0, 0); // Axis for torque application
let topMount; // Reference to the top mounting plate

// Setup the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);

    // Create camera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 5, 10);

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
    instructions.innerHTML = 'Press SPACE to apply/release force<br>Press 1-6 to change force direction';
    document.body.appendChild(instructions);

    // Start animation loop
    animate();
}

// Create the sensor base and components
function createSensorBase() {
    // Create base platform
    const baseGeometry = new THREE.CylinderGeometry(4, 4, 0.5, 32);
    const baseMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x555555,
        transparent: true,
        opacity: 0.7
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.y = -0.25;
    base.receiveShadow = true;
    scene.add(base);

    // Remove the outer ring cylinder and keep only the elastic beams
    
    // Create the elastic beams that connect outer and inner parts
    createElasticBeams();
    
    // Create strain gauges on the elastic beams
    createStrainGauges();
    
    // Create top mounting plate
    const topMountGeometry = new THREE.CylinderGeometry(3.5, 3.5, 0.5, 32);
    const topMountMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x555555,
        transparent: true,
        opacity: 0.7
    });
    topMount = new THREE.Mesh(topMountGeometry, topMountMaterial);
    topMount.position.y = 1.45;
    topMount.castShadow = true;
    scene.add(topMount);

    // Create force arrows
    createForceArrows();

    // Create robot end effector
    const robotGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.5, 32);
    const robotMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xcc4444,
        transparent: true,
        opacity: 0.7
    });
    sensor = new THREE.Mesh(robotGeometry, robotMaterial);
    sensor.position.y = 2.0;
    sensor.castShadow = true;
    scene.add(sensor);
    
    // Add a connector from the top mount to the end effector
    const connectorGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.5, 16);
    const connectorMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x999999,
        transparent: true,
        opacity: 0.7
    });
    const connector = new THREE.Mesh(connectorGeometry, connectorMaterial);
    connector.position.y = 1.7;
    scene.add(connector);
}

// Create elastic beams that connect the outer and inner rings
function createElasticBeams() {
    elasticBody = new THREE.Group(); // Group to hold all elastic beams
    
    // Create 4 elastic beams positioned at 90-degree intervals
    for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI / 2);
        const x = Math.cos(angle) * 3.15;
        const z = Math.sin(angle) * 3.15;
        
        // Create beam
        const beamGeometry = new THREE.BoxGeometry(0.7, 0.8, 0.7);
        const beamMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x88aadd,
            transparent: true,
            opacity: 0.8
        });
        const beam = new THREE.Mesh(beamGeometry, beamMaterial);
        beam.position.set(x, 0.6, z);
        beam.rotation.y = angle;
        beam.castShadow = true;
        
        elasticBody.add(beam);
        scene.add(beam);
    }
    
    scene.add(elasticBody);
}

// Create strain gauges on the elastic beams
function createStrainGauges() {
    // Clear existing strain gauges
    strainGauges.forEach(gauge => {
        scene.remove(gauge);
    });
    strainGauges = [];
    
    // Create strain gauges on each elastic beam
    // We'll create 6 strain gauges per beam (24 total) to capture all 6 dimensions
    
    // Define strain gauge properties
    const gaugeGeometry = new THREE.BoxGeometry(0.4, 0.05, 0.2);
    const gaugeMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xffcc00,
        emissive: 0x884400,
        emissiveIntensity: 0.5
    });
    
    // Create strain gauges for each beam
    for (let beamIndex = 0; beamIndex < 4; beamIndex++) {
        const angle = (beamIndex * Math.PI / 2);
        const beamX = Math.cos(angle) * 3.15;
        const beamZ = Math.sin(angle) * 3.15;
        
        // Create strain gauges on top and bottom of beam (Y-axis strain)
        const topGauge = new THREE.Mesh(gaugeGeometry, gaugeMaterial.clone());
        topGauge.position.set(beamX, 1.05, beamZ);
        topGauge.rotation.y = angle;
        topGauge.userData = { 
            beam: beamIndex, 
            position: 'top', 
            axis: 'y',
            baseColor: new THREE.Color(0xffcc00)
        };
        scene.add(topGauge);
        strainGauges.push(topGauge);
        
        const bottomGauge = new THREE.Mesh(gaugeGeometry, gaugeMaterial.clone());
        bottomGauge.position.set(beamX, 0.15, beamZ);
        bottomGauge.rotation.y = angle;
        bottomGauge.userData = { 
            beam: beamIndex, 
            position: 'bottom', 
            axis: 'y',
            baseColor: new THREE.Color(0xffcc00)
        };
        scene.add(bottomGauge);
        strainGauges.push(bottomGauge);
        
        // Create strain gauges on inner and outer sides of beam (radial strain)
        const innerOffset = 0.3;
        const innerX = beamX - Math.cos(angle) * innerOffset;
        const innerZ = beamZ - Math.sin(angle) * innerOffset;
        
        const innerGauge = new THREE.Mesh(gaugeGeometry, gaugeMaterial.clone());
        innerGauge.position.set(innerX, 0.6, innerZ);
        innerGauge.rotation.y = angle;
        innerGauge.rotation.z = Math.PI/2;
        innerGauge.userData = { 
            beam: beamIndex, 
            position: 'inner', 
            axis: 'r',
            baseColor: new THREE.Color(0xffcc00)
        };
        scene.add(innerGauge);
        strainGauges.push(innerGauge);
        
        const outerOffset = 0.3;
        const outerX = beamX + Math.cos(angle) * outerOffset;
        const outerZ = beamZ + Math.sin(angle) * outerOffset;
        
        const outerGauge = new THREE.Mesh(gaugeGeometry, gaugeMaterial.clone());
        outerGauge.position.set(outerX, 0.6, outerZ);
        outerGauge.rotation.y = angle;
        outerGauge.rotation.z = Math.PI/2;
        outerGauge.userData = { 
            beam: beamIndex, 
            position: 'outer', 
            axis: 'r',
            baseColor: new THREE.Color(0xffcc00)
        };
        scene.add(outerGauge);
        strainGauges.push(outerGauge);
        
        // Create strain gauges on left and right sides of beam (tangential strain)
        const leftAngle = angle + Math.PI/2;
        const leftOffset = 0.3;
        const leftX = beamX + Math.cos(leftAngle) * leftOffset;
        const leftZ = beamZ + Math.sin(leftAngle) * leftOffset;
        
        const leftGauge = new THREE.Mesh(gaugeGeometry, gaugeMaterial.clone());
        leftGauge.position.set(leftX, 0.6, leftZ);
        leftGauge.rotation.y = angle;
        leftGauge.rotation.x = Math.PI/2;
        leftGauge.userData = { 
            beam: beamIndex, 
            position: 'left', 
            axis: 't',
            baseColor: new THREE.Color(0xffcc00)
        };
        scene.add(leftGauge);
        strainGauges.push(leftGauge);
        
        const rightAngle = angle - Math.PI/2;
        const rightOffset = 0.3;
        const rightX = beamX + Math.cos(rightAngle) * rightOffset;
        const rightZ = beamZ + Math.sin(rightAngle) * rightOffset;
        
        const rightGauge = new THREE.Mesh(gaugeGeometry, gaugeMaterial.clone());
        rightGauge.position.set(rightX, 0.6, rightZ);
        rightGauge.rotation.y = angle;
        rightGauge.rotation.x = Math.PI/2;
        rightGauge.userData = { 
            beam: beamIndex, 
            position: 'right', 
            axis: 't',
            baseColor: new THREE.Color(0xffcc00)
        };
        scene.add(rightGauge);
        strainGauges.push(rightGauge);
    }
}

// Create arrows to visualize forces and torques
function createForceArrows() {
    const arrowColors = [
        0xff0000, // X force
        0x00ff00, // Y force
        0x0000ff, // Z force
        0xff00ff, // X torque
        0xffff00, // Y torque
        0x00ffff  // Z torque
    ];
    
    // Create arrows for each dimension
    for (let i = 0; i < 6; i++) {
        const direction = new THREE.Vector3(0, 1, 0);
        const origin = new THREE.Vector3(0, 2.0, 0);
        const length = 0;
        const color = arrowColors[i];
        
        const arrowHelper = new THREE.ArrowHelper(direction, origin, length, color, 0.2, 0.1);
        arrowHelper.visible = false;
        scene.add(arrowHelper);
        forceArrows.push(arrowHelper);
    }
}

// Update strain gauge colors based on applied forces
function updateStrainGauges() {
    strainGauges.forEach(gauge => {
        let strain = 0;
        const beamIndex = gauge.userData.beam;
        const position = gauge.userData.position;
        const axis = gauge.userData.axis;
        
        // Calculate beam angle
        const beamAngle = (beamIndex * Math.PI / 2);
        const beamDirX = Math.cos(beamAngle);
        const beamDirZ = Math.sin(beamAngle);
        
        // Calculate strain based on force direction, torque, and gauge position
        if (axis === 'y') {
            // Vertical strain gauges respond to Y force and X/Z torques
            const yForce = forceDirection.y * forceAmount;
            
            // Torque effects depend on beam position
            const xTorque = torqueAxis.x * forceAmount;
            const zTorque = torqueAxis.z * forceAmount;
            
            // Calculate torque effect based on beam position
            const torqueEffect = zTorque * beamDirX - xTorque * beamDirZ;
            
            // Combine effects
            strain = yForce + torqueEffect;
            
            // Adjust for gauge position (top/bottom)
            if (position === 'top') {
                strain *= -1; // Compression on top when pushing down
            }
        } 
        else if (axis === 'r') {
            // Radial strain gauges respond to X/Z forces and Y torque
            const xForce = forceDirection.x * forceAmount;
            const zForce = forceDirection.z * forceAmount;
            
            // Project forces onto beam direction
            const radialForce = xForce * beamDirX + zForce * beamDirZ;
            
            // Y-torque effect
            const yTorque = torqueAxis.y * forceAmount;
            
            // Combine effects
            strain = radialForce + yTorque * 0.5;
            
            // Adjust for gauge position (inner/outer)
            if (position === 'inner') {
                strain *= -1; // Opposite effect on inner side
            }
        }
        else if (axis === 't') {
            // Tangential strain gauges respond to X/Z forces and Y torque
            const xForce = forceDirection.x * forceAmount;
            const zForce = forceDirection.z * forceAmount;
            
            // Project forces perpendicular to beam direction
            const tangentialForce = -xForce * beamDirZ + zForce * beamDirX;
            
            // Y-torque has major effect on tangential strain
            const yTorque = torqueAxis.y * forceAmount;
            
            // Combine effects
            strain = tangentialForce + yTorque;
            
            // Adjust for gauge position (left/right)
            if (position === 'right') {
                strain *= -1; // Opposite effect on right side
            }
        }
        
        // Map strain to color (yellow to red)
        const normalizedStrain = Math.min(1, Math.abs(strain) * 2);
        const r = 1;
        const g = 1 - normalizedStrain * 0.8;
        const b = 0;
        
        gauge.material.color.setRGB(r, g, b);
        
        // Also adjust emissive intensity for more visual impact
        gauge.material.emissiveIntensity = 0.3 + normalizedStrain * 0.7;
    });
}

// Update force arrows
function updateForceArrows() {
    // Update force arrows (first 3 are forces, last 3 are torques)
    
    // X force
    forceArrows[0].visible = Math.abs(forceDirection.x) > 0;
    forceArrows[0].position.set(0, 2.0, 0);
    forceArrows[0].setDirection(new THREE.Vector3(forceDirection.x, 0, 0).normalize());
    forceArrows[0].setLength(Math.abs(forceDirection.x) * forceAmount * 2);
    
    // Y force
    forceArrows[1].visible = Math.abs(forceDirection.y) > 0;
    forceArrows[1].position.set(0, 2.0, 0);
    forceArrows[1].setDirection(new THREE.Vector3(0, forceDirection.y, 0).normalize());
    forceArrows[1].setLength(Math.abs(forceDirection.y) * forceAmount * 2);
    
    // Z force
    forceArrows[2].visible = Math.abs(forceDirection.z) > 0;
    forceArrows[2].position.set(0, 2.0, 0);
    forceArrows[2].setDirection(new THREE.Vector3(0, 0, forceDirection.z).normalize());
    forceArrows[2].setLength(Math.abs(forceDirection.z) * forceAmount * 2);
    
    // X torque
    forceArrows[3].visible = Math.abs(torqueAxis.x) > 0;
    forceArrows[3].position.set(0, 2.0, 0);
    forceArrows[3].setDirection(new THREE.Vector3(torqueAxis.x, 0, 0).normalize());
    forceArrows[3].setLength(Math.abs(torqueAxis.x) * forceAmount * 2);
    
    // Y torque
    forceArrows[4].visible = Math.abs(torqueAxis.y) > 0;
    forceArrows[4].position.set(0, 2.0, 0);
    forceArrows[4].setDirection(new THREE.Vector3(0, torqueAxis.y, 0).normalize());
    forceArrows[4].setLength(Math.abs(torqueAxis.y) * forceAmount * 2);
    
    // Z torque
    forceArrows[5].visible = Math.abs(torqueAxis.z) > 0;
    forceArrows[5].position.set(0, 2.0, 0);
    forceArrows[5].setDirection(new THREE.Vector3(0, 0, torqueAxis.z).normalize());
    forceArrows[5].setLength(Math.abs(torqueAxis.z) * forceAmount * 2);
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
    
    // Change force direction with number keys
    if (event.code === 'Digit1') {
        // X force
        resetForceDirection();
        forceDirection.set(1, 0, 0);
    } else if (event.code === 'Digit2') {
        // Y force
        resetForceDirection();
        forceDirection.set(0, -1, 0);
    } else if (event.code === 'Digit3') {
        // Z force
        resetForceDirection();
        forceDirection.set(0, 0, 1);
    } else if (event.code === 'Digit4') {
        // X torque
        resetForceDirection();
        torqueAxis.set(1, 0, 0);
    } else if (event.code === 'Digit5') {
        // Y torque
        resetForceDirection();
        torqueAxis.set(0, 1, 0);
    } else if (event.code === 'Digit6') {
        // Z torque
        resetForceDirection();
        torqueAxis.set(0, 0, 1);
    }
}

// Reset force direction
function resetForceDirection() {
    forceDirection.set(0, 0, 0);
    torqueAxis.set(0, 0, 0);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update controls
    controls.update();
    
    // Animate force application
    if (animationState === 1 && forceAmount < 1) {
        // Applying force
        forceAmount += 0.01;
    } else if (animationState === 0 && forceAmount > 0) {
        // Releasing force
        forceAmount -= 0.01;
    }
    
    // Clamp force amount
    forceAmount = Math.max(0, Math.min(1, forceAmount));
    
    // Update sensor position based on force
    if (Math.abs(forceDirection.y) > 0) {
        sensor.position.y = 2.0 + forceDirection.y * forceAmount * 0.3;
        // Update top mount position to move with sensor
        topMount.position.y = 1.45 + forceDirection.y * forceAmount * 0.3;
    } else {
        sensor.position.y = 2.0;
        topMount.position.y = 1.45;
    }
    
    if (Math.abs(forceDirection.x) > 0) {
        sensor.position.x = forceDirection.x * forceAmount * 0.3;
        // Update top mount position to move with sensor
        topMount.position.x = forceDirection.x * forceAmount * 0.3;
    } else {
        sensor.position.x = 0;
        topMount.position.x = 0;
    }
    
    if (Math.abs(forceDirection.z) > 0) {
        sensor.position.z = forceDirection.z * forceAmount * 0.3;
        // Update top mount position to move with sensor
        topMount.position.z = forceDirection.z * forceAmount * 0.3;
    } else {
        sensor.position.z = 0;
        topMount.position.z = 0;
    }
    
    // Apply torque (rotation)
    if (Math.abs(torqueAxis.x) > 0) {
        sensor.rotation.x = torqueAxis.x * forceAmount * 0.2;
        // Update top mount rotation to rotate with sensor
        topMount.rotation.x = torqueAxis.x * forceAmount * 0.2;
    } else {
        sensor.rotation.x = 0;
        topMount.rotation.x = 0;
    }
    
    if (Math.abs(torqueAxis.y) > 0) {
        sensor.rotation.y = torqueAxis.y * forceAmount * 0.2;
        // Update top mount rotation to rotate with sensor
        topMount.rotation.y = torqueAxis.y * forceAmount * 0.2;
    } else {
        sensor.rotation.y = 0;
        topMount.rotation.y = 0;
    }
    
    if (Math.abs(torqueAxis.z) > 0) {
        sensor.rotation.z = torqueAxis.z * forceAmount * 0.2;
        // Update top mount rotation to rotate with sensor
        topMount.rotation.z = torqueAxis.z * forceAmount * 0.2;
    } else {
        sensor.rotation.z = 0;
        topMount.rotation.z = 0;
    }
    
    // Update strain gauges
    updateStrainGauges();
    
    // Update force arrows
    updateForceArrows();
    
    // Render scene
    renderer.render(scene, camera);
}

// Initialize the visualization
init(); 