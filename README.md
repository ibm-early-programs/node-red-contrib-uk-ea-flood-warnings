# node-red-contrib-uk-ea-flood-warnings

[Node-RED](http://nodered.org) wrapper to the UK Environment Agency Real Time
Flood-monitoring [API](http://envrionment/data.gov.uk/flood-monitoring/doc/reference)

## Install
Use the manage palette option to install this node

## Usage
This node allows you to run query the UK Environment Agency Flood Warning API

## Configuration
Use the configuration to select the area to search for. If you select `All Flooded Areas`
all active flood alerts will be returned.

### Input
 `msg.payload` is not required. The node needs to be configured
to select an area. A list of available areas is
automatically retrieved by the node, making use of the API.

You can override the area setting by setting `msg.floodarea`, which must be a comma separated
string.

### Output
The output is a json array on `msg.payload`. If there are no
flood alerts in the selected area then the array is empty.


## Contributing
For simple typos and fixes please just raise an issue pointing out our mistakes. If you need to raise a pull request please read our [contribution guidelines](https://github.com/ibm-early-programs/node-red-contrib-uk-ea-flood-warnings/blob/master/CONTRIBUTING.md) before doing so.


## Copyright and license

Copyright 2018 IBM Corp. under the Apache 2.0 license.
