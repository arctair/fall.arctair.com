let bucket_url = "https://s3.us-east-2.amazonaws.com/fall.arctair.com"



function loadLayers(colormap) {
  return Promise.all([
    getDNRGeoJSON().then(
      geojson => new Promise(resolve => {
        if (geojson.properties) addLastUpdated(colormap, geojson.properties.updated);
        return resolve(L.geoJSON(geojson, { style: dnrStyle }).addTo(colormap));
      }),
      err => Promise.reject(err)),
    getMNCountiesGeoJSON().then(
      geojson => Promise.resolve(L.geoJSON(geojson, { style: mnCountyStyle }).addTo(colormap)),
      err => Promise.reject(err)),
    getMNLakesGeoJSON().then(
      geojson => Promise.resolve(L.geoJSON(geojson, { style: mnLakesStyle }).addTo(colormap)),
      err => Promise.reject(err)),
    getMNGeoJSON().then(
      geojson => Promise.resolve(L.geoJSON(geojson, { style: mnStateStyle }).addTo(colormap)),
      err => Promise.reject(err)),
  ])
}

function ready() {
  let bounds = L.latLngBounds(
        L.latLng(43.25, -97.5), L.latLng(49.5, -89.25));

  let colormap = L.map('colormap', {
    maxBounds: bounds,
    zoomControl: true,
    zoomSnap: 0.25,
    minZoom: 6.5,
    zoom: 6.5,
    center: bounds.getCenter() });

  loadLayers(colormap)
    .then(([dnrGeojson, mnCountiesGeojson, mnLakesGeojson, mnGeojson]) => {
      dnrGeojson.bringToFront();
      mnGeojson.bringToFront();
      mnLakesGeojson.bringToFront();
      mnCountiesGeojson.bringToFront();
      addLegend(colormap);
    })

  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery &copy; <a href="http://mapbox.com">Mapbox</a>',
    maxZoom: 18,
    id: 'mapbox.satellite',
    accessToken: 'pk.eyJ1IjoiYXJjdGFpciIsImEiOiJjajZ0azlxc28wZnp5MndvNGZkOG9waXVmIn0.QkUWyUDc1TjXFn6K0DB1rg'
  }).addTo(colormap);
}

function getColor(v) {
  switch(parseInt(v)) {
    case 1:
      return "#627A48";
    case 2:
      return "#AFA73D";
    case 3:
      return "#F9CB01";
    case 4:
      return "#FAA526";
    case 5:
      return "#CB3430";
    case 6:
      return "#71211A";
    default:
      return "#000000";
  }
}

let dnrStyle = feature => ({
  fillColor: getColor(feature.properties.leaves),
  fillOpacity: 1,
  weight: 0.5,
  color: "#926239"
})
function getDNRGeoJSON() {
  return fetch(`${bucket_url}/latest.json`)
    .then(res => res.ok ? res.json() : Promise.reject(res))
}


let mnCountyStyle = {
  fillOpacity: 0,
  weight: 0.25,
  color: "#AAAAAA",
}
function getMNCountiesGeoJSON() {
  return fetch(`${bucket_url}/mn_counties.json`)
    .then(res => res.ok ? res.json() : Promise.reject(res))
}

let mnStateStyle = {
  fillOpacity: 0,
  weight: 4,
  color: "#4444CC",
}
function getMNGeoJSON() {
  return fetch(`${bucket_url}/mn_feature.json`)
    .then(res => res.ok ? res.json() : Promise.reject(res))
}

let mnLakesStyle = {
  fillColor: "#66ccff",
  fillOpacity: 1,
  weight: 0,
  color: "#4444DD",
}
function getMNLakesGeoJSON() {
  return fetch(`${bucket_url}/mn_lakes.json`)
    .then(res => res.ok ? res.json() : Promise.reject(res))
}

function addLegend(colormap) {
  var legend = L.control({position: 'bottomright'});

  legend.onAdd = function(map) {
    var div = L.DomUtil.create('div', 'info legend');
    var stageToLabels = [
      [1, '0-10%'],
      [2, '10-25%'],
      [3, '25-50%'],
      [4, '50-75%'],
      [5, '75-100%'],
      [6, 'past peak']
    ]

    stageToLabels.forEach(assoc => div.innerHTML +=
      `<i style="background:${getColor(assoc[0])}"></i>${assoc[1]}<br>`);

    return div;
  }
  return legend.addTo(colormap);
}

function addLastUpdated(colormap, unix_ms) {
  var timestamp = L.control({position: 'bottomright'});

  timestamp.onAdd = function(map) {
    var div = L.DomUtil.create('div', 'info');
    div.innerHTML = `<span style="color:#FFF;">last updated ${new Date(unix_ms)}</span>`;

    return div;
  }
  return timestamp.addTo(colormap);
}
