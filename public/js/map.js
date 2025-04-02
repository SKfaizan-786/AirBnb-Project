document.addEventListener("DOMContentLoaded", async function () {
    var mapElement = document.getElementById("map");

    var listingLat = parseFloat(mapElement.dataset.lat) || null;
    var listingLng = parseFloat(mapElement.dataset.lng) || null;
    var listingTitle = mapElement.dataset.title;
    var listingLocation = mapElement.dataset.location;

    var map = L.map("map").setView([20, 78], 5); // Default view over India

    // High-quality map tiles
    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap, Humanitarian OpenStreetMap Team',
        maxZoom: 18
    }).addTo(map);

    var redIcon = L.icon({
        iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png", // ✅ Proper red pin marker
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png", 
        iconSize: [25, 41], 
        iconAnchor: [12, 41], 
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
    

    async function getCoordinates(location) {
        try {
            let response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`);
            let data = await response.json();

            if (data.length > 0) {
                let lat = parseFloat(data[0].lat);
                let lon = parseFloat(data[0].lon);

                map.setView([lat, lon], 15);
                L.marker([lat, lon])
                    .addTo(map)
                    .bindPopup(`<b>${listingTitle}</b><br>${location}`)
                    .openPopup();
            } else {
                console.error("Location not found:", location);
            }
        } catch (error) {
            console.error("Error fetching coordinates:", error);
        }
    }

    if (listingLat && listingLng) {
        map.setView([listingLat, listingLng], 15);
        L.marker([listingLat, listingLng], { icon: redIcon })
            .addTo(map)
            .bindPopup(`<b>${listingTitle}</b><br>${listingLocation}`)
            .openPopup();
    } else {
        getCoordinates(listingLocation);
    }
});