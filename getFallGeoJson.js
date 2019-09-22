const request = require('request-promise');

const pipeline = () => request('http://maps2.dnr.state.mn.us/cgi-bin/fall_colors_json.cgi')
.then(deduplicateCommas)
.then(extractJsonList)
.then(JSON.parse)
.then(createDnrFallGeoJson)
.then(featureCollection => ({
  ...featureCollection,
  features: featureCollection.features.sort((
    { properties: { id: idFirst } },
    { properties: { id: idLast } },
  ) => idFirst.localeCompare(idLast)),
}))
.then(JSON.stringify)
.then(s => process.stdout.write(s))

const deduplicateCommas = s => s.replace(/,+/g, ',');

const extractJsonList = s => s.substring(
  s.indexOf('['),
  s.lastIndexOf(']') + 1,
);

const createDnrFallGeoJson = json => {
  return createFeatureCollection(
    json.map(
      ({ lat, lon, ...properties }) => createFeature(
        [lon, lat].map(n => parseFloat(n, 10)),
        parseProperties(properties),
      )
    )
  );
};

const createFeatureCollection = features => ({
  type: 'FeatureCollection',
  features,
})

const createFeature = (coordinates, properties) => ({
  type: 'Feature',
  geometry: createPoint(coordinates),
  properties,
});

const createPoint = coordinates => ({
  type: 'Point',
  coordinates,
});

const parseProperties = ({ flowers, grasses, leaves, ...properties }) => ({
  flowers: parseInt(flowers, 10),
  grasses: parseInt(grasses, 10),
  leaves: parseInt(leaves, 10),
  ...properties,
});

pipeline();