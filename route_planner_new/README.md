# Disaster Evacuation Route Planner

This application helps plan evacuation routes during disasters using Dijkstra's algorithm to find the shortest path between a disaster-prone area and a safe location.

## Features

- Interactive map interface using OpenStreetMap
- Click to set source and destination points
- Calculates shortest path using Dijkstra's algorithm
- Displays distance and estimated travel time
- Real-time route visualization

## Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Run the Flask backend:
```bash
python app.py
```

3. Open `templates/index.html` in your web browser

## Usage

1. Click on the map to set the source location (disaster-prone area)
2. Click again to set the destination location (safe area)
3. Click "Calculate Route" to find the shortest path
4. The route will be displayed on the map with distance and estimated time

## Technical Details

- Backend: Python with Flask
- Frontend: HTML, CSS, JavaScript
- Map: OpenStreetMap with Leaflet.js
- Algorithm: Dijkstra's shortest path algorithm

## Note

The current implementation uses a sample graph data structure. In a real-world scenario, you would need to:
1. Replace the sample graph with actual road network data
2. Implement proper coordinate conversion between map points and graph nodes
3. Add more sophisticated time estimation based on road conditions and traffic
4. Include multiple evacuation routes and alternative paths 