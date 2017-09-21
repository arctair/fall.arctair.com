$(document).ready(function() {
  Promise.all([getMNGeoJSON(), getDNRData()])
    .then(updateMap)
});

function getDNRData() {
  return $.ajax({
    url: "/json",
    dataType: "json"
  });
}

function getMNGeoJSON() {
  return $.ajax({
    url: "/public/mn_bounds.gjson",
    dataType: "json"
  })
}

function updateMap(data) {

  mn_bounds = data[0];
  dnr_color = data[1];

  let colormap = L.map('colormap');

  colormap.fitBounds(L.latLngBounds(
        L.latLng(43, -97.5), L.latLng(50, -89.5)));

  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery &copy; <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.satellite',
    accessToken: 'pk.eyJ1IjoiYXJjdGFpciIsImEiOiJjajZ0azlxc28wZnp5MndvNGZkOG9waXVmIn0.QkUWyUDc1TjXFn6K0DB1rg'
  }).addTo(colormap);

  L.geoJSON(mn_bounds).addTo(colormap);

  L.geoJSON({
    "type": "FeatureCollection",
    "features": dnr_color
      .map(dnrobj => {
        return {
          "type": "Feature",
          "geometry": {
            "type": "Point",
            "coordinates": [parseFloat(dnrobj.lon), parseFloat(dnrobj.lat)]
          },
          "properties": {
            "name": dnrobj.name,
          }
        }
      })
  }).addTo(colormap)
}
