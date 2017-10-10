let request = require('request');
let Voronoi = require('voronoi');
let turf = require('@turf/turf');
let md5 = require('md5');
let mn_feature = require('./mn_feature.json');
let config = require('./config.json');
let aws = require('aws-sdk');

aws.config.update(config);

let s3 = new aws.S3();

function getDnr() {
  return new Promise((fulfill, reject) => {
    request("http://maps2.dnr.state.mn.us/cgi-bin/fall_colors_json.cgi", function(error, response, body) {
      if (error) reject(error);
      fulfill({
        json: JSON.parse(body.substring(21, body.length - 2)),
        md5: md5(body) });
    })
  });
}

function dnrToGeoJSON(dnr) {
  return new Promise((fulfill, reject) => {
    let voronoi = new Voronoi();
    let bbox = {xl: -180, xr: 180, yt: -90, yb: 90};
    let sites = dnr.json.map(dnrobj => ({
      dnrobj: dnrobj,
      x: parseFloat(dnrobj.lon),
      y: parseFloat(dnrobj.lat)
    }));

    let diagram = voronoi.compute(sites, bbox);

    let vertexToCoordinate = vertex => [vertex.x, vertex.y];
    let features = diagram.cells.map(cell => ({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            ...cell.halfedges.map(halfedge => vertexToCoordinate(halfedge.getStartpoint())),
            vertexToCoordinate(cell.halfedges[cell.halfedges.length - 1].getEndpoint())
          ]
        ]
      },
      properties: cell.site.dnrobj
    }));

    features.forEach(feature => {
      feature.geometry = turf.intersect(feature, mn_feature).geometry;
    });

    dnr.geojson = { type: "FeatureCollection", features: features };
    fulfill(dnr);
  });
}

function getMd5() {
  return new Promise((fulfill, reject) => {
    s3.getObject({
        Bucket: config.bucket,
        Key: "latest.md5"}, (err, data) => {
      if (err && err.code == 'NoSuchKey') fulfill('')
      else if (err) { console.log(err); reject(err); }
      else fulfill(data.Body.toString()); });
  })
}

function compareMd5(dnr, hash) {
  return new Promise((fulfill, reject) => {
    if (dnr.md5 == hash) reject({msg: "No update"})
    fulfill(dnr);
  })
}

function commitMd5(hash) {
  return new Promise((fulfill, reject) =>
    s3.putObject({ Body: hash, Bucket: config.bucket, Key: 'latest.md5', ACL: config.uploadAcl }, function(err) {
      if (err) reject(err);
      else fulfill();
    }));
}

function commitJson(geojson) {
  return new Promise((fulfill, reject) =>
    s3.putObject({ Body: JSON.stringify(geojson), Bucket: config.bucket, Key: 'latest.json', ACL: config.uploadAcl }, function(err) {
      if (err) reject(err);
      else fulfill('Updated');
    }));
}

exports.handler = (event, context, callback) => {
  Promise.all([getDnr(), getMd5()])
    .then(([dnr, hash]) => compareMd5(dnr, hash))
    .then(dnr => Promise.all([dnrToGeoJSON(dnr), commitMd5(dnr.md5)]))
    .then(([dnr, _]) => commitJson(dnr.geojson))
    .then(success => callback(null, success), err => {
      if (err && err.msg == "No update") callback(null, err.msg);
      else callback(err);
    });
};
