const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config()

// Pulls path to file given with path argument
let filePath = require('yargs/yargs')(process.argv.slice(2)).argv.path;

// read file with given file path
let file = fs.readFileSync(filePath);
// get hash
const hash = crypto.createHash('md5');
hash.write(file);
hash.setEncoding('hex');
let fileHash = hash.end().read();

axios.get(`https://api.metadefender.com/v4/hash/${fileHash}`, {
    headers: {
        "apikey": process.env.OPSWAT_KEY
    },
    body: "{}"
})
    .then( ({ response }) => {
       console.log("the results in the way asked ", response);
    })
    .catch( (error) => {
        // Check for non opswat 404 response
        if (typeof error?.response?.data === 'undefined' ) {
            console.log("Error was encountered looking up hash with code:  ", error.code);
            // Exit with failure
            process.exit(1)
        }
        let errorData = error.response.data.error;
        // Code corresponds to file not being found
        if (errorData.code === 404003) {
            // upload file

//             multipart/form-data (when doing multipart upload)
// application/octet-stream (when doing binary upload)
// essages: [ 'Request body is empty. Please send a binary file.' ]
//determine content type wheter its either or
// or maybe we convert any file to binary
            const options = {
                "method": "POST",
                "headers": {
                 "apikey": process.env.OPSWAT_KEY,
                 "Content-Type": "multipart/form-data",
                },
                "body": file,
            };
            console.log("got to uploading the file");
            axios("https://api.metadefender.com/v4/file", options)
                .then( (result) => {
                    console.log("GOT result ", result);
                    //get data id 
                })
                .catch( (error) => {
                    if (typeof error?.response?.data === 'undefined' ) {
                        console.log("Error was encountered uploading file:  ", error.code);
                        // Exit with failure
                        process.exit(1)
                    }
                    console.log("Went into the error of uploading file ", error.response.data.error);
                })
        }
       
    })



console.log("DONE");