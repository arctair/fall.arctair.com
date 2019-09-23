const express = require('express');
const rq = require('request-promise');
const mktemp = require('mktemp');
const fs = require('fs').promises;
const exec = require('child_process').exec;

const app = express();

app.get('/', async (_, response) => {
  try {
    const body = JSON.stringify(await getGeoJson());
    const geojsonPath = await mktemp.createFile('/tmp/XXXXXX.geojson');
    console.log('geojsonPath', geojsonPath);
    const tifPath = await mktemp.createFile('/tmp/XXXXXX.tif');
    console.log('tifPath', tifPath);
    await fs.writeFile(geojsonPath, body);
    await new Promise((resolve, reject) => {
      exec(`sh createTif.sh ${geojsonPath} mn/mn.shp leaves ${tifPath}`, (error, stdout, stderr) => {
        if (error) reject(error);
        resolve(stdout);
      });
    });
    await new Promise(resolve => response.sendFile(tifPath, resolve));
    await Promise.all([fs.unlink(geojsonPath), fs.unlink(tifPath)]);
    console.log('unlink complete')
  }
  catch (error) {
    response.status(500);
    response.send(error);
  }
});

app.get('/geojson', async (_, response) => response.json(await getGeoJson()));

const getGeoJson = () => rq(process.env.DNR_CGI_URL)
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


app.listen(process.env.PORT || 8080, () => console.log(`*:${process.env.PORT || 8080}`));