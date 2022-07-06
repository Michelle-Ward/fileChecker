const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config()

// Gets md5 hash of file given
const getHash = (file) => {
    const hash = crypto.createHash('md5');
    hash.write(file);
    hash.setEncoding('hex');
    return hash.end().read();
}

// create function to iterate over the correct output and log output
const logResult = (result) => {
    //check if status is 'In queue'
    let scanResults = result.scan_results;
    console.log({ fileName: result.file_info.display_name });
    if (scanResults.scan_all_result_a === 'In queue') {
        console.log( {
            overall_status: 'Clean'
        })
    } else {
        let engines = Object.keys(scanResults.scan_details);
        engines.forEach( ( engine ) => {
            let details = scanResults.scan_details[engine];
            console.log({
                engine: engine,
                threat_found: details.threat_found,
                scan_result: details.scan_result_i,
                def_time: details.def_time,
            })
            
        })
    }
    process.exit(0);
}

// Pulls path to file given with path argument
let filePath = require('yargs/yargs')(process.argv.slice(2)).argv.path;

// read file with given file path outputs a buffer
let file = fs.readFileSync(filePath);

// get hash
let fileHash = getHash(file);


axios.get(`https://api.metadefender.com/v4/hash/${fileHash}`, {
    headers: {
        "apikey": process.env.OPSWAT_KEY
    },
    body: "{}"
})
    .then( (response) => {
       logResult(response.data);
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
            // Convert buffer version of file to binary
            let binary = Buffer.from(file);
            const options = {
                "method": "POST",
                "headers": {
                 "apikey": process.env.OPSWAT_KEY,
                 "Content-Type": "application/octet-stream",
                },
                data: binary,
            };
            axios("https://api.metadefender.com/v4/file", options)
                .then( ({ response }) => {
                    console.log("GOT result ", response);
                     //get data id 
                    let dataId = response.data.data_id;
                    console.log(dataId); 
                    // TODO
                   
                })
                .catch( (error) => {
                    //If opswat error give code
                    if (typeof error?.response?.data === 'undefined' ) {
                        console.log("Error was encountered uploading file:  ", error.code);
                        // Exit with failure
                        process.exit(1)
                    } else {
                        console.log("There was an error uploading file ");
                        process.exit(1)
                    }
                })
        }
    })



console.log("DONE");