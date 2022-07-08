# Getting Started


## Prerequisites

This project uses npm and Node v14 or v16. Installation instructions can be found in the [npm docs](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm). An API key from opswat is required to make requests to the MetaDefender API.

## Installation

1. Install packages 

`npm install`

2. Create `.env` file to store api key at root level of this repo. There will be a single property:

`OPSWAT_KEY={{API_KEY}}`

# Usage


To start program, run command with path to file:

`npm run file_upload -- --path {{PATH TO FILE HERE}}`

This will check if the file had been previously scanned. If not, the file will be uploaded and scanned. 

Results of the scan will appear in the console.
