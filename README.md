# mn-fallmap
JavaScript app for displaying fall color information from the Minnesota DNR

## Requirements
* nodejs
* npm
* AWS Lambda
* AWS S3

## Installing and running
Run `npm install`  
Copy config.example.json to config.json and configure config.json.  
Upload a zip to Amazon Lambda containing pollAndStoreGeoJSONFromDNR.js, node_modules, config.json and mn_feature.json.  
Configure the first line of colormap.js to match your S3 configuration.  

This function seems to work best with 512MB of memory and a 10 second timeout. Most of the time, the function completes within 1 second (if no update is needed). For running the function on a schedule, investigate AWS CloudWatch cron.

## Demo
A demo is available at [amazonaws.com/fall.arctair.com](https://s3.us-east-2.amazonaws.com/fall.arctair.com/colormap.html)
