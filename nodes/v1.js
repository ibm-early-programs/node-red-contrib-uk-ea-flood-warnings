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

  function checkForValidMsgOverride(msg) {
    // if provided the overide must be a string
    if (msg.floodarea) {
      if ('string' !== typeof msg.floodarea) {
        return Promise.reject('msg.floodarea can only be a string');
      }
    }
    return Promise.resolve();
  }

  function processRequest(uriAddress) {
    var p = new Promise(function resolver(resolve, reject) {
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

  function getFloodAlerts(msg, config) {
    let uriAddress = 'http://environment.data.gov.uk/flood-monitoring/id/floods';
    let floodarea = null;

    if (msg.floodarea) {
      floodarea = msg.floodarea;
    } else if (config && config.area) {
      //console.log('Have Area Setting of : ', config.area);
      floodarea = config.area;
    }

    if (floodarea && 'All Flooded Areas' !== floodarea) {
      uriAddress += '?county=';
      uriAddress += floodarea;
    }

    return processRequest(uriAddress);
  }

  function fetchFloodAreas() {
    let uriAddress = 'http://environment.data.gov.uk/flood-monitoring/id/floodAreas';
    return processRequest(uriAddress);
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
      areas.areas.sort();
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
          return checkForValidMsgOverride(msg);
        })
        .then(function() {
          return getFloodAlerts(msg, config);
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
