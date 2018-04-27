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

  function buildResponse(msg, data) {
    if (data && data.items) {
      msg.payload = data.items;
    } else {
      msg.payload = data;
    }
    return Promise.resolve();
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
