const express = require('express');
const path = require('path');
const request = require('request');
const app = express();

app.use('/leaflet', express.static(path.join(__dirname, '/node_modules/leaflet/dist')));
app.use('/jquery', express.static(path.join(__dirname, '/node_modules/jquery/dist')));
app.use('/bootstrap', express.static(path.join(__dirname, '/node_modules/bootstrap/dist')));
app.use('/turf', express.static(path.join(__dirname, '/node_modules/@turf/turf')));
app.use('/public', express.static(path.join(__dirname, '/public')));



app.get('/', (req, res) => res.sendFile(path.join(__dirname, '/public/colormap.html')));
app.get('/json', (req, res) => {
  request.get('http://maps2.dnr.state.mn.us/cgi-bin/fall_colors_json.cgi', (err, response, body) => {
    if (err || response.statusCode != 200) {
      res.status(response.statusCode).send(err);
    } else {
      res.status(200)
        .send(body.substr(21, body.length - 23));
    }
  });
});

app.listen(3000, () => console.log("*:3000"));
