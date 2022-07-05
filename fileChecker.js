const fs = require('fs');
const crypto = require('crypto');

// get hash
const hash = crypto.createHash('sha256');

// Pulls path to file given with path argument
let filePath = require('yargs/yargs')(process.argv.slice(2)).argv.path;

// read file with given file path
let file = fs.readFileSync(filePath);
