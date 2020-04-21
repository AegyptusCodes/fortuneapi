// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region
AWS.config.update({region: 'us-east-1'});

// Create DynamoDB service object
var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

var params = {
  RequestItems: {
    "Fortunes": [
       {
         PutRequest: {
           Item: {
             "KEY": { "N": "fortuneID" },
               "fortune": { "S": "TEST" },
               "fortuneID": { "N": "1" }
           }
         }
       },
       {
         PutRequest: {
           Item: {
             "KEY": { "N": "fortuneID" },
               "fortune": { "S": "test2" },
               "fortuneID": { "N": "2" }
           }
         }
       }
    ]
  }
};

ddb.batchWriteItem(params, function(err, data) {
  if (err) {
    console.log("Error", err);
  } else {
    console.log("Success", data);
  }
});
