## Introduction

This project aims to visualize different types of tactile sensors using Three.js. The tactile sensors include Resistor Type, Capacitor Type, Electromagnetic Type, Six-Dimensional Force Sensor, and Visual-Tactile. Each sensor has its own working principle, technical characteristics, problem-solving situations, and future market prospects.

## Sensor Descriptions

### 1. Resistor Type

- **Principle**: Measures resistance changes to detect pressure or touch. The resistance value changes when the medium is under pressure.
- **Technical Characteristics**:
  - Error range up to ±10%.
  - Susceptible to temperature and humidity drift.
  - Short lifespan and poor durability.
  - Can only measure single-axis force.
- **Problem-Solving**: No effective solution since inception.
- **Market Prospect**: Limited by principle, not suitable for multi-axis force measurement and robot tactile sensing.

### 2. Capacitor Type

- **Principle**: Measures capacitance changes caused by pressure or external force altering the distance between capacitor plates, dielectric constant, or plate area.
- **Technical Characteristics**:
  - Poor anti-electromagnetic interference, requiring additional shielding.
  - Electrode wear affects durability and lifespan.
  - Can only measure single-axis force.
- **Problem-Solving**: No effective solution since inception.
- **Market Prospect**: Limited by principle, not suitable for multi-axis force measurement and robot tactile sensing.

### 3. Electromagnetic Type

- **Principle**: Detects magnetic field changes using the Hall effect to sense tactile information.
- **Technical Characteristics**:
  - Good anti-electromagnetic interference (solved by Paxini in 2024).
  - External magnetic interference is difficult to shield.
- **Problem-Solving**: External magnetic interference remains unsolved.
- **Market Prospect**: With the popularity of robots, electromagnetic tactile sensors have broad market space.

### 4. Six-Dimensional Force Sensor

- **Principle**: Uses strain gauges to measure force changes. Strain gauges on an elastic body change resistance when force is applied.
- **Technical Characteristics**:
  - Large volume.
  - High usage threshold.
  - Standardization difficulties.
- **Problem-Solving**: No effective solution since inception.
- **Market Prospect**: Suitable for robot end-effectors but not for tactile sensing.

### 5. Visual-Tactile

- **Principle**: Mimics human skin using a凝胶头 (gel head) and internal camera to capture changes and establish a tactile information mapping.
- **Technical Characteristics**:
  - High power consumption, not suitable for modular use.
  - Optical focusing requires distance and thickness.
  - Inconsistent, difficult standardization.
  - Low frequency, lacks high-frequency information.
  - High bandwidth requirements.
  - Poor force measurement accuracy.
- **Problem-Solving**: No effective solution since inception.
- **Market Prospect**: Suitable for high-end applications like universities with high requirements for bandwidth, lifespan, and size.
