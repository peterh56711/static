// Initialize the map and set the view to the center of Antelope Island, Utah
var map = L.map('map').setView([40.9167, -112.238], 13);  // Center the map on Antelope Island, Utah

// Add OpenTopoMap tile layer for topographic map
L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://opentopomap.org/copyright">OpenTopoMap</a>'
}).addTo(map);

// Enable drawing functionality on the map
var drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

var drawControl = new L.Control.Draw({
    edit: {
        featureGroup: drawnItems
    },
    draw: {
        polyline: true,  // Allow only polyline (line) to be drawn
        polygon: false,
        rectangle: false,
        circle: false
    }
});
map.addControl(drawControl);

// Event listener to handle when a polyline is drawn
map.on('draw:created', function(e) {
    var layer = e.layer;
    drawnItems.addLayer(layer);
    
    // Get the lat/lng of the drawn polyline
    var latlngs = layer.getLatLngs();
    
    // Calculate the distance of the drawn polyline
    var distance = calculateDistance(latlngs);
    
    // Fetch the elevation profile data for the drawn polyline
    getElevationProfile(latlngs, distance);  
});

// Function to calculate the total distance of the polyline (in meters)
function calculateDistance(latlngs) {
    var totalDistance = 0;
    for (var i = 0; i < latlngs.length - 1; i++) {
        totalDistance += latlngs[i].distanceTo(latlngs[i + 1]);  // Add the distance between consecutive points
    }
    return totalDistance;  // Return the total distance in meters
}

// Fetch the elevation data for the drawn polyline
function getElevationProfile(latlngs, distance) {
    // Prepare the coordinates for the API request (Open Elevation API)
    var coordinates = latlngs.map(function(latlng) {
        return [latlng.lat, latlng.lng];
    });

    // Construct the URL for the Open Elevation API
    var url = 'https://api.open-elevation.com/api/v1/lookup?locations=' +
        coordinates.map(coord => coord.join(',')).join('|');

    // Fetch the elevation data
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data && data.results) {
                // Extract elevation data (in meters) and convert to feet
                var elevationsInMeters = data.results.map(result => result.elevation);
                console.log("Elevations in meters:", elevationsInMeters);
                
                // Convert elevation data from meters to feet (1 meter = 3.28084 feet)
                var elevationsInFeet = elevationsInMeters.map(elevation => elevation * 3.28084);
                console.log("Elevations in feet:", elevationsInFeet);
                
                // Call the function to draw the elevation profile
                drawElevationProfile(elevationsInFeet, distance);
            } else {
                console.error('No valid elevation data found.');
            }
        })
        .catch(error => console.error('Error fetching elevation data:', error));
}

// Render the elevation profile using Chart.js
function drawElevationProfile(elevations, distance) {
    // Check if there's any elevation data
    if (elevations.length === 0) {
        console.log("No elevation data available to display.");
        return;  // Do not attempt to draw the chart if there's no data
    }

    var ctx = document.getElementById('elevationProfile').getContext('2d');
    
    var elevationChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: Array.from({length: elevations.length}, (_, i) => (i + 1) + ' Point'), // X-axis labels
            datasets: [{
                label: 'Elevation (ft)',  // Label for the elevation (in feet)
                data: elevations,  // Elevation data for the profile
                borderColor: 'blue',
                fill: false,
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return value.toFixed(0) + ' ft';  // Show 'ft' for the y-axis
                        }
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `Distance: ${Math.round(distance / 1000)} km`  // Show the distance (in km) in the chart title
                }
            }
        }
    });
}
