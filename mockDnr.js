const express = require('express');
const path = require('path');
const app = express();

app.get('/', (request, response) => {
  response.sendFile(path.join(__dirname, 'mockDnrResponse.js'));
});

app.listen(process.env.PORT || 8080, () => console.log(`*:${process.env.PORT || 8080}`));
