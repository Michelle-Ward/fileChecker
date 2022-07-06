const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config()

// get hash
const hash = crypto.createHash('sha256');

// Pulls path to file given with path argument
let filePath = require('yargs/yargs')(process.argv.slice(2)).argv.path;

// read file with given file path
let file = fs.readFileSync(filePath);

//produce file hash
let fileHash = hash.update(file).digest('sha256');
// curl -X POST https://api.metadefender.com/v4/file -H 'apikey: $YOUR_API_KEY' -H 'filename: file.zip' -d
// figure out what is the result of a hash check
axios.get(`https://api.metadefender.com/v4/hash/${fileHash}`, {
    method: "GET",
    headers: {
        "apikey": process.env.OPSWAT_KEY
    }
})
    .then( (response) => {
       console.log("the results in the way asked")
    })
    .catch( ({error}) => {
        console.log(error);
        // check if error is no hash found
        // if (error.code === 404003) {
        //     // upload file
        //     const options = {
        //         "method": "POST",
        //         "headers": {
        //          "apikey": "{apikey}",
        //          "Content-Type": "{Content-Type}",
        //         },
        //         "body": file,
        //     };

        //     fetch("https://api.metadefender.com/v4/file", options)
        //         .then( (result) => {
        //             // get data-id
        //         })
        //         .catch( (error) => {

        //         })
        // }
       
    })
//make fetch request to api given ash
    //if success
        //print out info

    //if error occurs logout an error occurs


console.log("DONE");