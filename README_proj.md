# Tactile Sensor Visualization Project

This project provides interactive 3D visualizations of different types of tactile sensors using Three.js. Each visualization demonstrates the working principle, technical characteristics, and limitations of the respective sensor type.

## Sensor Types Included

1. **Resistor Type** - Visualizes how resistance changes under pressure in a resistive tactile sensor.
2. **Capacitor Type** - Demonstrates how capacitance changes when pressure alters the distance between capacitor plates.
3. **Electromagnetic Type** - Shows how magnetic fields are detected using the Hall effect to sense tactile information.
4. **Six-Dimensional Force Sensor** - Illustrates how strain gauges measure forces and torques in all six dimensions.
5. **Visual-Tactile** - Demonstrates how a gel head and internal camera can capture tactile information.

## How to Use

1. Open `index.html` in a modern web browser to access the main page.
2. Click on any sensor card to view its detailed 3D visualization.
3. In each visualization:
   - Press the **SPACE** key to apply/release pressure on the sensor
   - Use the mouse to rotate the view (left-click and drag)
   - Zoom in/out with the mouse wheel
   - For the Six-Dimensional Force Sensor, press keys 1-6 to change force direction

## Technical Implementation

- Built with Three.js for 3D rendering
- Uses OrbitControls for camera manipulation
- Each sensor has its own dedicated JavaScript file in the `assets/js/sensors/` directory
- Responsive design that works on various screen sizes

## Project Structure

```
output_3d_vis/
│
├── index.html                 # Main landing page
├── resistance.html            # Resistor type sensor visualization
├── capacitance.html           # Capacitor type sensor visualization
├── electromagnetic.html       # Electromagnetic type sensor visualization
├── six-dimensional.html       # Six-dimensional force sensor visualization
├── haptic-vision.html         # Visual-tactile sensor visualization
│
└── assets/
    └── js/
        ├── three.min.js       # Three.js library
        ├── OrbitControls.js   # Camera controls
        │
        └── sensors/
            ├── resistance.js      # Resistor sensor visualization code
            ├── capacitance.js     # Capacitor sensor visualization code
            ├── electromagnetic.js # Electromagnetic sensor visualization code
            ├── six-dimensional.js # Six-dimensional force sensor code
            └── haptic-vision.js   # Visual-tactile sensor visualization code
```

## Browser Compatibility

This project works best in modern browsers that support WebGL:
- Chrome (recommended)
- Firefox
- Safari
- Edge

## Credits

- Three.js - https://threejs.org/
- OrbitControls - Part of Three.js examples 