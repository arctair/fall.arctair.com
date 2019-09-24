const exec = require('child_process').exec;
const express = require('express');
require('express-zip');
const fs = require('fs').promises;
const mktemp = require('mktemp');
const rq = require('request-promise');
const sqlite = require('sqlite3');

const app = express();
const db = new sqlite.Database('fall.sqlite');

db.run('CREATE TABLE IF NOT EXISTS snapshots (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, geojson STRING)');

app.get('/geojson', async (_, response) => response.json(await getGeoJson()));

app.get('/tifs', async (_, response) => {
  try {
    const files = (await generateTifs(JSON.stringify(await getGeoJson())))
    .map(({ field, path }) => ({ name: `${field}.tif`, path }));
    await new Promise(resolve => response.zip(files, resolve));
    await Promise.all(files.map(({ path }) => fs.unlink(path)));
  }
  catch (error) {
    console.error(error);
    response.status(500);
    response.send(error);
  }
});

app.post('/saveGeojson', async (_, response) => {
  const geojson = JSON.stringify(await getGeoJson());
  const id = await new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO snapshots (geojson) VALUES (?)',
      geojson,
      function(error) {
        if (error) reject(error);
        else resolve(this.lastID)
      },
    );
  });
  response.json({ id });
});

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
}));

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

const generateTifs = async geojson => {
  const geojsonPath = await mktemp.createFile('/tmp/XXXXXX.geojson');
  const fieldPaths = await Promise.all(
    ['leaves', 'grasses', 'flowers']
    .map(async field => {
      const path = await mktemp.createFile('/tmp/XXXXXX.tif');
      return { field, path };
    })
  );
  await fs.writeFile(geojsonPath, geojson);
  await Promise.all(
    fieldPaths.map(
      ({ field, path }) => new Promise((resolve, reject) => {
        exec(`sh createTif.sh ${geojsonPath} mn/mn.shp ${field} ${path}`, (error, stdout, stderr) => {
          if (error) reject(error);
          resolve(stdout);
        });
      })
    )
  );
  await fs.unlink(geojsonPath);
  return fieldPaths;
};

app.listen(process.env.PORT || 8080, () => console.log(`*:${process.env.PORT || 8080}`));