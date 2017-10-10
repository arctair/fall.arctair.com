# mn-fallmap
JavaScript app for displaying fall color information from the Minnesota DNR

![Screenshot of mn-fallmap](https://github.com/arctair/arctair.github.io/raw/master/arctair/mn-fallmap/mn-fallmap.png)

## Requirements
* nodejs
* npm
* AWS Lambda
* AWS S3

## Installing and running
1. Run `npm install`  
2. Copy config.example.json to config.json and configure config.json.  
3. Upload a zip to Amazon Lambda containing pollAndStoreGeoJSONFromDNR.js, node_modules/, config.json and mn_feature.json.
4. Run the Lambda function.
5. Configure the first line of public/colormap.js to match your S3 configuration.
6. Optionally, host the content in public/ in S3 or your web server.
7. Navigate to public/colormap.html.

This function seems to work best with 512MB of memory and a 10 second timeout. Most of the time, the function completes within 1 second (if no update is needed). For running the function on a schedule, investigate AWS CloudWatch cron.

## Demo
A demo is available at [fall.arctair.com](http://fall.arctair.com)
