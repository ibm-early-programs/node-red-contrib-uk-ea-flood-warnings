/**
 * Copyright 2018 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
  const request = require('request');

  function verifyPayload(msg) {
    // For now doesn't matter what is in the payload
    return Promise.resolve();
  }

  function getFloodAlerts(msg) {
    var p = new Promise(function resolver(resolve, reject) {
      let uriAddress = 'http://environment.data.gov.uk/flood-monitoring/id/floods';

      request({
        uri: uriAddress,
        method: 'GET'
      }, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          var b = JSON.parse(body);
          resolve(b);
        } else if (error) {
          reject(error);
        } else {
          reject('Error Invoking API ' + response.statusCode);
        }
      });
    });
    return p;
  }

  function fetchFloodAreas() {
    var p = new Promise(function resolver(resolve, reject) {
      let uriAddress = 'http://environment.data.gov.uk/flood-monitoring/id/floodAreas';

      request({
        uri: uriAddress,
        method: 'GET'
      }, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          var b = JSON.parse(body);
          resolve(b);
        } else if (error) {
          reject(error);
        } else {
          reject('Error Invoking API ' + response.statusCode);
        }
      });
    });
    return p;
  }

  function buildResponse(msg, data) {
    if (data && data.items) {
      msg.payload = data.items;
    } else {
      msg.payload = data;
    }
    return Promise.resolve();
  }

  function inList(theList, theValue) {
    let found = false;
    theList.forEach((v) => {
      if (v === theValue) {
        found = true;
      }
    });
    return found
  }

  function buildAreaResponse(data) {
    //console.log('Area Data looks like : ', data);
    let areas = {'areas' : []};
    if (data && data.items && Array.isArray(data.items)) {
      data.items.forEach((d) => {
        if (d.county) {
          if (!inList(areas.areas, d.county)) {
            areas.areas.push(d.county);
          }
        }
      });
    }
    return Promise.resolve(areas);
  }

  function inProgress(msg) {
    // Dummy Function to use when building the structure
    msg.payload = 'The node is still being coded';
    return Promise.resolve();
  }

  function reportError(node, msg, err) {
    var messageTxt = err;
    //if (err.code && 'ENOENT' === err.code) {
    //  messageTxt = 'Invalid File Path';
    //}
    if (err.error) {
      messageTxt = err.error;
    } else if (err.description) {
      messageTxt = err.description;
    } else if (err.message) {
      messageTxt = err.message;
    }
    node.status({
      fill: 'red',
      shape: 'dot',
      text: messageTxt
    });

    msg.result = {};
    msg.result['error'] = err;
    node.error(messageTxt, msg);
  }


  // API used by widget to fetch available areas
  RED.httpAdmin.get('/ukea/areas/', function (req, res) {
    fetchFloodAreas()
      .then( (data) => {
        return buildAreaResponse(data);
      })
      .then( (areas) => {
        res.json(areas);
      })
      .catch(function(err) {
        res.json({error:'Not able to fetch models'});
      });
  });



  function Node(config) {
    var node = this;
    RED.nodes.createNode(this, config);

    this.on('input', function(msg) {
      //var message = '';
      node.status({
        fill: 'blue',
        shape: 'dot',
        text: 'starting request'
      });

      verifyPayload(msg)
        .then(function() {
          return getFloodAlerts(msg);
        })
        .then(function(data) {
          return buildResponse(msg, data);
        })
        .then(function() {
          node.status({});
          node.send(msg);
        })
        .catch(function(err) {
          reportError(node,msg,err);
          node.send(msg);
        });

    });
  }

  RED.nodes.registerType('uk-flood-warnings', Node, {
    credentials: {
    }
  });
};
