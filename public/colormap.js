$(document).ready(function() {
  init_promise = initMap()
  mn_promise = getMNGeoJSON()

  Promise.all([mn_promise, getDNRData(), init_promise])
    .then(result => buildDNRFeatureCollection(...result))

  Promise.all([mn_promise, init_promise])
    .then(result => L.geoJSON(result[0]).addTo(result[1]))
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

function buildDNRPopup(feature) {
}

function stageToColor(stage) {
  switch (stage) {
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

function getFeatureStyle(feature) {
  return {
    fillColor: stageToColor(feature.properties.leaves),
    fillOpacity: 1,
    weight: 0.5,
    color: "#926239"
  }
}

function buildDNRFeatureCollection(mn_feature, dnr_json, colormap) {
  return new Promise((fulfill, reject) => {

    var voronoi = d3.voronoi();
    voronoi.x(dnrobj => parseFloat(dnrobj.lon));
    voronoi.y(dnrobj => parseFloat(dnrobj.lat));
    voronoi.extent([[-180, -90], [180, 90]])
    var polygons = voronoi.polygons(dnr_json);

    // reinsert first vertex to finish polygon loops
    polygons.forEach(polygon => polygon.push(polygon[0]))

    var features = polygons.map((polygon, i) => ({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [polygon]
      }
    }));

    // clip to minnesota
    features = features.map(feature => turf.intersect(feature, mn_feature))

    // reassociate properties from dnr data
    features.forEach((feature, i) => feature.properties = {
      leaves: parseInt(dnr_json[i].leaves),
      grasses: parseInt(dnr_json[i].grasses),
      flowers: parseInt(dnr_json[i].flowers),
      whereToGo: dnr_json[i].whereToGo,
      whatToSee: dnr_json[i].whatToSee,
      name: dnr_json[i].name,
      alsoOfInterest: dnr_json[i].alsoOfInterest,
    });

    features.forEach(buildDNRPopup);

    dnr_layer = L.geoJSON(
      { type: "FeatureCollection", features: features },
      {
        style: getFeatureStyle,
        onEachFeature: (feature, layer) => layer.bindPopup(feature.properties.popupContent)
      }).addTo(colormap);
    fulfill(dnr_layer);
  });
}

function initMap() {
  return new Promise((fulfill, reject) => {
    let colormap = L.map('colormap');

    colormap.fitBounds(L.latLngBounds(
          L.latLng(43.5, -97.5), L.latLng(49.25, -89.5)));

    L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery &copy; <a href="http://mapbox.com">Mapbox</a>',
      maxZoom: 18,
      id: 'mapbox.satellite',
      accessToken: 'pk.eyJ1IjoiYXJjdGFpciIsImEiOiJjajZ0azlxc28wZnp5MndvNGZkOG9waXVmIn0.QkUWyUDc1TjXFn6K0DB1rg'
    }).addTo(colormap);
    fulfill(colormap);
  });
}
