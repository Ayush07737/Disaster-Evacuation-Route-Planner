// Initialize map centered on Dehradun
const map = L.map('map').setView([30.3165, 78.0322], 13);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let sourceMarker = null;
let routeLines = [];
let destinationMarkers = [];

// Dehradun disaster-prone areas and safe zones with correct coordinates
const locations = {
    // Disaster-prone areas
    'Rajpur Road': { lat: 30.3662, lng: 78.0806, type: 'disaster' },
    'Mussoorie Diversion': { lat: 30.4022, lng: 78.0747, type: 'disaster' },
    'Kandoli': { lat: 30.3792, lng: 78.1031, type: 'disaster' },
    'Rajpur': { lat: 30.3915, lng: 78.1037, type: 'disaster' },
    'Anarwala': { lat: 30.3256, lng: 78.0112, type: 'disaster' },
    'Dalanwala': { lat: 30.3250, lng: 78.0490, type: 'disaster' },
    'Karanpur': { lat: 30.3372, lng: 78.0442, type: 'disaster' },
    'Astley Hall': { lat: 30.3258, lng: 78.0436, type: 'disaster' },
    'Paltan Bazaar': { lat: 30.3206, lng: 78.0437, type: 'disaster' },
    // Additional disaster-prone areas
    'Sahastradhara': { lat: 30.3952, lng: 78.1392, type: 'disaster' },
    'Clement Town': { lat: 30.2707, lng: 78.0322, type: 'disaster' },
    'Prem Nagar': { lat: 30.3211, lng: 77.9632, type: 'disaster' },
    'Patel Nagar': { lat: 30.3092, lng: 78.0182, type: 'disaster' },
    'Vasant Vihar': { lat: 30.3345, lng: 77.9978, type: 'disaster' },
    'Nehru Colony': { lat: 30.3078, lng: 78.0325, type: 'disaster' },
    'Majra': { lat: 30.3089, lng: 78.0123, type: 'disaster' },
    'ISBT': { lat: 30.2701, lng: 78.0087, type: 'disaster' },
    'Chakrata Road': { lat: 30.3550, lng: 77.9630, type: 'disaster' },
    'Subhash Nagar': { lat: 30.3340, lng: 78.0260, type: 'disaster' },
    
    // Safe zones (with unique coordinates)
    'Forest Research Institute': { lat: 30.3376, lng: 77.9996, type: 'safe' },
    'Doon University': { lat: 30.3542, lng: 77.9476, type: 'safe' },
    'Indian Military Academy': { lat: 30.3217, lng: 77.9702, type: 'safe' },
    'Gandhi Park': { lat: 30.3252, lng: 78.0430, type: 'safe' },
    'Robber\'s Cave': { lat: 30.3957, lng: 78.0596, type: 'safe' },
    'Mindrolling Monastery': { lat: 30.2706, lng: 78.0807, type: 'safe' },
    'Dehradun Airport': { lat: 30.1897, lng: 78.1800, type: 'safe' },
    'Clock Tower': { lat: 30.3255, lng: 78.0437, type: 'safe' }
};

// Function to generate graph data using map's distance calculation
function generateGraphData() {
    const locationNames = Object.keys(locations);
    const graphData = [];
    
    for (let i = 0; i < locationNames.length; i++) {
        const row = [];
        for (let j = 0; j < locationNames.length; j++) {
            if (i === j) {
                row.push(0); // Distance to self is 0
            } else {
                const loc1 = locations[locationNames[i]];
                const loc2 = locations[locationNames[j]];
                // Use map's distance function (returns distance in meters, convert to km)
                const distance = map.distance([loc1.lat, loc1.lng], [loc2.lat, loc2.lng]) / 1000;
                row.push(distance);
            }
        }
        graphData.push(row);
    }
    
    return graphData;
}

// Generate graph data automatically
const graphData = generateGraphData();

// Add location markers to map
Object.entries(locations).forEach(([name, data]) => {
    const marker = L.marker([data.lat, data.lng])
        .bindPopup(`${name} (${data.type === 'disaster' ? 'Disaster-prone Area' : 'Safe Zone'})`)
        .addTo(map);
    
    if (data.type === 'disaster') {
        marker.setIcon(L.divIcon({
            className: 'disaster-marker',
            html: '⚠️',
            iconSize: [25, 25]
        }));
    } else {
        marker.setIcon(L.divIcon({
            className: 'safe-marker',
            html: '🛡️',
            iconSize: [25, 25]
        }));
    }
});

async function calculateRoutes() {
    const sourceInput = document.getElementById('source').value;

    if (!sourceInput) {
        alert('Please select a disaster area');
        return;
    }

    // Find index in the graph for source
    const sourceIndex = Object.keys(locations).indexOf(sourceInput);

    if (sourceIndex === -1) {
        alert('Invalid source selected');
        return;
    }

    // Clear previous routes
    clearRoutes();

    // Get all safe zone indices
    const safeZoneIndices = Object.entries(locations)
        .map(([name, data], index) => data.type === 'safe' ? index : -1)
        .filter(index => index !== -1);

    // Calculate routes to all safe zones
    const routes = [];
    for (const destIndex of safeZoneIndices) {
        try {
            const response = await fetch('http://localhost:5000/calculate-route', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    graph: graphData,
                    source: sourceIndex,
                    destination: destIndex,
                    location_names: Object.keys(locations)
                })
            });

            const data = await response.json();
            const destName = Object.keys(locations)[destIndex];
            routes.push({
                destination: destName,
                distance: data.distance,
                path: data.path,
                detailed_path: data.detailed_path,
                total_distance: data.total_distance
            });
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Sort routes by distance
    routes.sort((a, b) => a.distance - b.distance);

    // Display routes
    displayRoutes(routes);
}

function displayRoutes(routes) {
    // Clear previous routes
    clearRoutes();

    // Update routes list
    const routesList = document.getElementById('routes-list');
    routesList.innerHTML = '<h4>Available Evacuation Routes:</h4>';

    // Draw routes on map with different colors
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFA500', '#800080', '#008080', '#FFC0CB', '#A52A2A'];
    
    routes.forEach((route, index) => {
        // Add route to list
        const routeElement = document.createElement('div');
        routeElement.className = 'route-item';
        
        // Weather card placeholder (will be filled by fetch)
        const weatherId = `route-weather-${index}`;

        // Add Nearest Safe Location badge for the first (nearest) route
        const nearestBadge = index === 0 ? '<div class="nearest-safe-badge">Nearest Safe Location</div>' : '';

        routeElement.innerHTML = `
            <p><strong>${index + 1}. To ${route.destination}</strong></p>
            ${nearestBadge}
            <p>Total Distance: ${route.total_distance.toFixed(2)} km</p>
            <p>Estimated Time: ${Math.ceil(route.total_distance * 2)} minutes</p>
            <div id="${weatherId}" class="route-weather"><em>Loading weather...</em></div>
        `;
        routesList.appendChild(routeElement);

        // Draw route on map
        const routeCoordinates = route.path.map(nodeIndex => {
            const locationName = Object.keys(locations)[nodeIndex];
            const location = locations[locationName];
            return [location.lat, location.lng];
        });

        // Style for the route line
        const isShortestRoute = index === 0;
        const routeStyle = {
            color: isShortestRoute ? '#FF0000' : colors[index % colors.length],
            weight: isShortestRoute ? 5 : 3,
            opacity: isShortestRoute ? 0.8 : 0.5,
            dashArray: isShortestRoute ? null : '5, 10'
        };

        const routeLine = L.polyline(routeCoordinates, routeStyle).addTo(map);

        // Add popup for the shortest route
        if (isShortestRoute) {
            const midPoint = routeCoordinates[Math.floor(routeCoordinates.length / 2)];
            routeLine.bindPopup(`
                <strong>Shortest Route</strong><br>
                To: ${route.destination}<br>
                Distance: ${route.total_distance.toFixed(2)} km<br>
                Time: ${Math.ceil(route.total_distance * 2)} minutes
            `).openPopup();
        }

        routeLines.push(routeLine);

        // Add destination marker with different color
        const destLocation = locations[route.destination];
        const destMarker = L.marker([destLocation.lat, destLocation.lng], {
            icon: L.divIcon({
                className: 'destination-marker',
                html: '🎯',
                iconSize: [30, 30]
            })
        }).addTo(map);

        destinationMarkers.push(destMarker);

        // Fetch and display weather for this safe location
        if (destLocation && destLocation.lat && destLocation.lng) {
            fetchRouteWeather(destLocation.lat, destLocation.lng, weatherId);
        } else {
            document.getElementById(weatherId).innerHTML = '<em>Weather unavailable.</em>';
        }
    });

    // Fit map to show all routes
    if (routeLines.length > 0) {
        const bounds = L.latLngBounds(routeLines.flatMap(line => line.getLatLngs()));
        map.fitBounds(bounds);
    }
}

function fetchRouteWeather(lat, lng, elementId) {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${WEATHER_API_KEY}&units=metric`;
    fetch(url)
        .then(res => res.json())
        .then(data => {
            if (data.cod !== 200) throw new Error(data.message);
            const icon = data.weather[0].icon;
            const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
            const temp = data.main.temp.toFixed(1);
            const desc = data.weather[0].description;
            const humidity = data.main.humidity;
            const wind = data.wind.speed;
            document.getElementById(elementId).innerHTML = `
                <span class="route-weather-title">Current Weather</span>
                <div>Temperature: ${temp}&deg;C</div>
                <div>Conditions: ${desc}</div>
                <div>Humidity: ${humidity}%</div>
                <div>Wind Speed: ${wind} m/s</div>
            `;
        })
        .catch(err => {
            document.getElementById(elementId).innerHTML = '<em>Weather unavailable.</em>';
        });
}

function clearRoutes() {
    // Remove previous route lines
    routeLines.forEach(line => map.removeLayer(line));
    routeLines = [];

    // Remove destination markers
    destinationMarkers.forEach(marker => map.removeLayer(marker));
    destinationMarkers = [];

    // Clear source marker
    if (sourceMarker) {
        map.removeLayer(sourceMarker);
        sourceMarker = null;
    }
}

// Add click event to map for setting source
map.on('click', function(e) {
    const latlng = e.latlng;
    
    // Find the closest location
    let closestLocation = null;
    let minDistance = Infinity;
    
    Object.entries(locations).forEach(([name, data]) => {
        if (data.type === 'disaster') {  // Only consider disaster-prone areas
            const distance = map.distance(latlng, [data.lat, data.lng]);
            if (distance < minDistance) {
                minDistance = distance;
                closestLocation = { name, ...data };
            }
        }
    });

    // Only set marker if clicked within 500 meters of a disaster area
    if (minDistance <= 500 && closestLocation) {
        if (sourceMarker) {
            map.removeLayer(sourceMarker);
        }
        sourceMarker = L.marker([closestLocation.lat, closestLocation.lng], {
            icon: L.divIcon({
                className: 'source-marker',
                html: '📍',
                iconSize: [30, 30]
            })
        }).addTo(map);
        document.getElementById('source').value = closestLocation.name;
    }
});

// Emergency Helpline Modal Logic (refactored)
const openHelplineModal = document.getElementById('open-helpline-modal');
const helplineModal = document.getElementById('helpline-modal');
const closeHelplineModal = document.getElementById('close-helpline-modal');

if (openHelplineModal && helplineModal && closeHelplineModal) {
    openHelplineModal.addEventListener('click', function() {
        helplineModal.style.display = 'flex';
    });
    closeHelplineModal.addEventListener('click', function() {
        helplineModal.style.display = 'none';
    });
    helplineModal.addEventListener('click', function(e) {
        if (e.target === helplineModal) {
            helplineModal.style.display = 'none';
        }
    });
}

// Weather Widget for Dehradun
const WEATHER_API_KEY = '75aa4200418dd3826b0ed01ea04ad9f3';
const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/weather?q=Dehradun,IN&appid=${WEATHER_API_KEY}&units=metric`;

function updateWeatherWidget() {
    const weatherDiv = document.getElementById('weather-info');
    weatherDiv.innerHTML = '<p>Loading weather...</p>';
    fetch(WEATHER_API_URL)
        .then(res => res.json())
        .then(data => {
            if (data.cod !== 200) throw new Error(data.message);
            const icon = data.weather[0].icon;
            const iconUrl = `https://openweathermap.org/img/wn/${icon}@2x.png`;
            const temp = Math.round(data.main.temp);
            const desc = data.weather[0].description;
            const humidity = data.main.humidity;
            const wind = data.wind.speed;
            weatherDiv.innerHTML = `
                <h4><img src="${iconUrl}" class="weather-icon" alt=""> ${temp}&deg;C, ${desc.charAt(0).toUpperCase() + desc.slice(1)}</h4>
                <p>Humidity: ${humidity}%</p>
                <p>Wind: ${wind} m/s</p>
            `;
        })
        .catch(err => {
            weatherDiv.innerHTML = '<p>Weather unavailable.</p>';
        });
}

updateWeatherWidget(); 