// Initialize the map
const map = L.map('map').setView([0, 0], 2); // Centered at (0, 0) with zoom 2

// Add a tile layer (e.g., OpenStreetMap Topographic)
L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenTopoMap contributors',
}).addTo(map);
