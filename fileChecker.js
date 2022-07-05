const fs = require('fs');
const crypto = require('crypto');

// get hash
const hash = crypto.createHash('sha256');
console.log(hash);