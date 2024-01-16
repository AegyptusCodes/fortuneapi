#!/usr/bin/env node

import express from 'express';
import bodyParser from 'body-parser';
import AWS from 'aws-sdk';
import axios from 'axios';
var app = express();
var table = "Fortunes";


import * as async from 'async';
import randnum from 'random-number-between';

// Set path for the database
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sessionToken: process.env.AWS_SESSION_TOKEN, // Optional, only for temporary credentials
  region: "us-east-1",
  endpoint: "https://dynamodb.us-east-1.amazonaws.com",
});

const docClient = new AWS.DynamoDB.DocumentClient();
const svc = new AWS.DynamoDB();

let fortuneID = 0;

let scanComplete = false;
let itemCountTotal = 0;
let consumedCapacityUnitsTotal = 0;

const scanParams = { TableName: table };

// Replace async.until with a while loop
async function processScan() {
  while (!scanComplete) {
    try {
      const result = await svc.scan(scanParams).promise();
      console.log(result);
      if (typeof result.LastEvaluatedKey === 'undefined') {
        scanComplete = true;
      } else {
        scanParams.ExclusiveStartKey = result.LastEvaluatedKey;
      }
      itemCountTotal += result.Count;
      consumedCapacityUnitsTotal += result.ConsumedCapacityUnits;
      if (!scanComplete) {
        console.log('cumulative itemCount ' + itemCountTotal);
        console.log('cumulative capacity units ' + consumedCapacityUnitsTotal);
      }
    } catch (err) {
      console.log(err);
      scanComplete = true; // Stop the loop on error
    }
  }
}

processScan()
  .then(() => {
    console.log('scan complete');
    console.log('Total items: ' + itemCountTotal);
    console.log('Total capacity units consumed: ' + consumedCapacityUnitsTotal);
  })
  .catch((err) => {
    console.log('error in processing scan ');
    console.log(err);
  });

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
  res.render('index', { fortune: null, error: null });
});

app.post('/', function (req, res) {
  let fortune = req.body.newFortune;

  if (itemCountTotal >= 1) {
    fortuneID = itemCountTotal;
  }

  fortuneID = fortuneID + 1;
  console.log('Fortune ID:', fortuneID);

  const params = {
    TableName: table,
    Item: {
      fortuneID: fortuneID,
      fortune: fortune,
    },
  };

  docClient.put(params, function (err, data) {
    if (err) {
      res.render('index', { fortune: null, error: 'Unable to add item.' });
    } else {
      if (params == undefined) {
        res.render('index', { fortune: null, error: 'Error, please try again' });
      } else {
        let fortuneText = `Fortune: ${params.Item.fortune}, added!`;
        res.render('index', { fortune: fortuneText, error: null });
      }
    }
  });
});

app.get('/get', function (req, res) {
  res.render('index', { fortune: null, error: null });
});

app.post('/get', function (req, res) {
  let fortune = req.body.getFortune;
  let count = 0;

  if (itemCountTotal <= 1) {
    count = fortuneID;
  } else {
    count = itemCountTotal;
  }

  count = count + 1;
  let rand = randnum(1, count, 1);
  rand = parseInt(rand);

  const getparams = {
    TableName: table,
    Key: {
      fortuneID: rand,
    },
  };

  if (count <= 1) {
    res.render('index', { fortune: null, error: 'Error, please enter a fortune first' });
  } else {
    docClient.get(getparams, function (err, data) {
      if (err) {
        res.render('index', { fortune: null, error: 'Unable to get item.' });
      } else {
        if (getparams == undefined) {
          res.render('index', { fortune: null, error: 'Error, please try again' });
        } else {
          let fortuneText = `Fortune: ${data.Item.fortune}!`;
          res.render('index', { fortune: fortuneText, error: null });
        }
      }
    });
  }
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
