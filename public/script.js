// Initialize the map
var map = L.map('map').setView([51.505, -0.09], 13);

// Add OpenTopoMap as the base layer
L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenTopoMap contributors'
}).addTo(map);

// Initialize the Leaflet Draw control
var drawControl = new L.Control.Draw({
    draw: {
        polyline: true,  // Enable line drawing
        polygon: false,
        circle: false,
        rectangle: false,
        marker: false
    }
});
map.addControl(drawControl);

// Listen for the 'draw:created' event to capture the drawn polyline
map.on('draw:created', function(e) {
    var layer = e.layer;
    map.addLayer(layer);  // Add the drawn line to the map

    // Extract the coordinates of the drawn line
    var latlngs = layer.getLatLngs();
    var coordinates = latlngs.map(function(latlng) {
        return [latlng.lat, latlng.lng];
    });

    // Fetch elevation data for the drawn line using OpenElevation API
    fetch('https://api.open-elevation.com/api/v1/lookup?locations=' + coordinates.map(function(coord) {
        return coord.join(',');
    }).join('|'))
        .then(response => response.json())
        .then(data => {
            // Process the elevation data and create an elevation profile
            var elevations = data.results.map(function(result) {
                return result.elevation;
            });
            plotElevationProfile(elevations);  // Call function to plot elevation profile
        })
        .catch(err => console.error('Error fetching elevation data:', err));
});

// Function to plot the elevation profile using Chart.js
function plotElevationProfile(elevations) {
    var ctx = document.getElementById('elevationProfile').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: elevations.map(function(_, index) {
                return index + 1;  // Use the index as the "distance" on the x-axis
            }),
            datasets: [{
                label: 'Elevation (m)',
                data: elevations,
                fill: false,
                borderColor: 'rgba(75, 192, 192, 1)',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Distance (Segment)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Elevation (meters)'
                    }
                }
            }
        }
    });
}
