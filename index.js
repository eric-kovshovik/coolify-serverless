'use strict'
var request = require('request');
var bodyParser = require('body-parser');
const express = require('express');
var urlencodedParser = bodyParser.urlencoded({ extended: false });

const app = express()

const clientId = '2915741764.485844475751'       // process.env.CLIENT_ID;
const clientSecret = 'ec018124f52db018d1264c58cc701566'         //process.env.CLIENT_SECRET;

function sendMessageToSlackResponseURL(responseURL, JSONmessage){
  var postOptions = {
    uri: responseURL,
    method: 'POST',
    // statusCode: 200,
    headers: {
      'Content-type': 'application/json'
    },
    json: JSONmessage
  };
  request(postOptions, (error, response, body) => {
    // response.status(200).end();
    response.send({"isBase64Encoded": true, "statusCode": 200, "headers": { }, "body": ""});
    if (error){
      // handle errors as you see fit
    }
  })
}

app.get('/',function(req,res){
  res.sendFile(__dirname + '/index.html');
});


app.get('/oauth', function(req, res) {
  if (!req.query.code) {
    res.status(500);
    res.send({"Error": "Looks like we're not getting code."});
    console.log("Looks like we're not getting code.");
  } else {
    request({
      url: 'https://slack.com/api/oauth.access', //URL to hit
      qs: {code: req.query.code, client_id: clientId, client_secret: clientSecret}, //Query string data
      method: 'GET', //Specify the method

    }, function (error, response, body) {
      if (error) {
        console.log(error);
      } else {
        res.json(body);
      }
    })
  }
});

app.post('/command', function(req, res) {
  res.send('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
});

function getText(req) {
 return (req.body.text.length == 0 ? [] : req.body.text.split(' '))
}

function parseCommand(name) {
  if (name.length == 2) {
    return {firstName: name[0], lastName: name[1], limitTo: 'nerdy'};
  }
  if (name.length == 1) {
    return {firstName: name[0], lastName: 'from Decisely', limitTo: 'nerdy'};
  }
  if (name.length == 0 || name.length > 2) {
    return {limitTo: 'nerdy'};
  }
}

app.post('/chuck_joke', urlencodedParser, (req, res) => {
  // res.status(200).send('ebany pesos');
  var reqBody = req.body;
  var responseURL = reqBody.response_url;
  var coolified_person = getText(req);
  var params = parseCommand(coolified_person);
  if (reqBody.token != '5ZuxGCfL84ENPqiuOcGI2R9d'){  // process.env.CLIENT_TOKEN
    res.status(403).end("Access forbidden")
  }else {
    request({
      url: 'http://api.icndb.com/jokes/random',
      qs: params,
      method: 'GET',
    }, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var obj = JSON.parse(body);
        const text = obj.value.joke;
        const params_string = JSON.stringify(params);
        var message = {
          "text": text,
          "replace_original": true,
          "attachments": [
            {
              "fallback": "Shame... buttons aren't supported in this land",
              "callback_id": "button_tutorial",
              "color": "#3AA3E3",
              "attachment_type": "default",
              "actions": [
                {
                  "name": "send",
                  "text": "send",
                  "type": "button",
                  "value": text
                },
                {
                  "name": "next",
                  "text": "next",
                  "type": "button",
                  "value": params_string        // params_string
                },
                {
                  "name": "don't send",
                  "text": "don't send",
                  "type": "button",
                  "value": "don't send",
                  "style": "danger"
                }
              ]
            }
          ]
        };
        sendMessageToSlackResponseURL(responseURL, message)
      }
    })
  }
});

app.post('/slack/actions', urlencodedParser, (req, res) =>{
  // res.status(200).send('ebany nasos ');
  console.log('HUJ')
  var actionJSONPayload = JSON.parse(req.body.payload);
  if (actionJSONPayload.actions[0].name == "send") {
    var payload = JSON.parse(req.body.payload)
    var text = payload.actions[0].value;
    var message = {
      "response_type": "in_channel",
      "text": text,
      "replace_original": false,
      "delete_original": true
    };
    sendMessageToSlackResponseURL(actionJSONPayload.response_url, message);
  }
  if (actionJSONPayload.actions[0].name == "next"){
    var payload = JSON.parse(req.body.payload)
    var params_string = payload.actions[0].value;
    console.log(params_string)
    var params = JSON.parse(params_string);
    console.log(params);
    request({
      url: 'http://api.icndb.com/jokes/random',
      qs: params,
      method: 'GET',

    }, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var obj = JSON.parse(body);
        const text = obj.value.joke;
        var message = {
          "text": text,
          "replace_original": true,
          "attachments": [
            {
              "fallback": "Shame... buttons aren't supported in this land",
              "callback_id": "button_tutorial",
              "color": "#3AA3E3",
              "attachment_type": "default",
              "actions": [
                {
                  "name": "send",
                  "text": "send",
                  "type": "button",
                  "value": text
                },
                {
                  "name": "next",
                  "text": "next",
                  "type": "button",
                  "value": params_string
                },
                {
                  "name": "don't send",
                  "text": "don't send",
                  "type": "button",
                  "value": "don't send",
                  "style": "danger"
                }
              ]
            }
          ]
        };
        sendMessageToSlackResponseURL(actionJSONPayload.response_url, message);
      }
    });
  }
  if (actionJSONPayload.actions[0].name == "don't send") {
    var message =  {
      "text": "",
      "delete_original": true
    };
    sendMessageToSlackResponseURL(actionJSONPayload.response_url, message);
  }
});

module.exports = app;