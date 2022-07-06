const fs = require('fs');
const crypto = require('crypto');
const axios = require('axios');
const { resourceLimits } = require('worker_threads');
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
    // Check if status is 'In queue'
    let scanResults = result.scan_results;
    console.log(scanResults);
    console.log(`file_name: ${result.file_info.display_name} \n`);
    if (scanResults.scan_all_result_a === 'In queue') {
        console.log(`overall_status: In queue \n`);
    } else {
        let engines = Object.keys(scanResults.scan_details);
        engines.forEach( ( engine ) => {
            let details = scanResults.scan_details[engine];
            console.log(details.threat_found)
            console.log(`
                engine: ${engine} \n
                threat_found: ${details.threat_found} \n
                scan_result: ${details.scan_result_i} \n
                def_time: ${details.def_time}\n
            `)
        })
    }
}

const handleError = (error) => {
    //If opswat error give code
    if (typeof error?.response?.data === 'undefined' ) {
        console.log("Error was encountered uploading file:  ", error.code);
        // Exit with failure
        process.exit(1)
    } else {
        console.log("There was an error uploading file ", error);
        process.exit(1)
    }
}
//create a single error handler function to handle opswat related functions
// handle non opswat errors by loggin and then exiting

// Pulls path to file given with path argument
let filePath = require('yargs/yargs')(process.argv.slice(2)).argv.path;

// Read file with given file path outputs a buffer
let file = fs.readFileSync(filePath);

// Get hash
let fileHash = getHash(file);

// Lookup by hash
axios.get(`https://api.metadefender.com/v4/hash/${fileHash}`, {
    headers: {
        "apikey": process.env.OPSWAT_KEY
    },
    body: "{}"
})
    .then( (response) => {
        // File was found log out data according to expected output
        console.log("FILE WAS FOUND");
        logResult(response.data);
        process.exit(0)
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
            let options = {
                "method": "POST",
                "headers": {
                 "apikey": process.env.OPSWAT_KEY,
                 "Content-Type": "application/octet-stream",
                },
                data: binary,
            };
            // Upload file
            axios("https://api.metadefender.com/v4/file", options)
                .then( ( response ) => {
                    console.log("GOT result ", response);
                     //get data id 
                    let dataId = response.data.data_id;
                    console.log(dataId); 
                    let options = {
                        "method": "GET",
                        "url": `https://api.metadefender.com/v4/file/${dataId}`,
                        "headers": {
                         "apikey": process.env.OPSWAT_KEY,
                        //  unknown what the integer should be using 1 for now
                         "x-file-metadata": 1
                        },
                        "body": "{}"
                    };
                    // TODO
                    // keep track of file progress
                    let progressComplete = false;
                    //pull until progress is 100
                    while (!progressComplete) {
                        //make following axios call
                        // access results
                        // update progress value with progress off of result
                        //result scan_results.progress_percentage
                        //put this call into a promise and do an await
                        axios(`https://api.metadefender.com/v4/file/${dataId}`, options)
                            .then((result) => {
                                console.log("result of data_id");
                                logResult(result.data);
                                if (result.data.scan_results.progress_percentage === 100) {
                                    progressComplete = true;
                                }
                                process.exit(1)
                            })
                            .catch((error) => {
                                handleError(error)
                            })
                    }

                   
                })
                .catch( (error) => {
                    handleError(error);
                })
        }
    })

    //unest and chaing the axios calls
    // put axios for file loading into it's own function