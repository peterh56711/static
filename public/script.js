// Initialize the map
var map = L.map('map').setView([51.505, -0.09], 13);

// Add OpenTopoMap as the base layer
L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenTopoMap contributors'
}).addTo(map);

// Initialize Leaflet Draw control
var drawControl = new L.Control.Draw({
    draw: {
        polyline: true,  // Allow polyline drawing (line)
        polygon: false,
        circle: false,
        rectangle: false,
        marker: false
    }
});
map.addControl(drawControl);

// Event listener for drawing completion
map.on('draw:created', function(e) {
    var layer = e.layer;
    map.addLayer(layer);  // Add the drawn line to the map

    // Extract coordinates from the drawn polyline
    var latlngs = layer.getLatLngs();
    var coordinates = latlngs.map(function(latlng) {
        return [latlng.lat, latlng.lng];
    });

    // Fetch elevation data from OpenElevation API
    fetch('https://api.open-elevation.com/api/v1/lookup?locations=' + coordinates.map(function(coord) {
        return coord.join(',');
    }).join('|'))
        .then(response => response.json())
        .then(data => {
            var elevations = data.results.map(function(result) {
                return result.elevation;
            });
            plotElevationProfile(elevations);  // Plot the elevation profile
        })
        .catch(err => console.error('Error fetching elevation data:', err));
});

// Function to plot elevation profile using Chart.js
function plotElevationProfile(elevations) {
    var ctx = document.getElementById('elevationProfile').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: elevations.map(function(_, index) {
                return index + 1;  // X-axis labels representing segments
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
