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
    // Check if status is 'In queue'
    let scanResults = result.scan_results;
    console.log(`\n file_name: ${result.file_info.display_name} \n`);
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

const handleError = (error, message) => {
    //If opswat error give code
    if (typeof error?.response?.data === 'undefined' ) {
        console.log(message, error.code);
        // Exit with failure
        process.exit(1)
    } else {
        console.log(message, error.code);
        process.exit(1)
    }
}

const pollByDataId = async (dataId) => {
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
    let progressComplete = false;
    //pull until progress is 100
    while (!progressComplete) {
        try {
            let result = await axios(`https://api.metadefender.com/v4/file/${dataId}`, options);
            logResult(result.data);
            if (result.data.scan_results.progress_percentage === 100) {
                progressComplete = true;
                process.exit(1)
            }
        } catch (error) {
            handleError(error, "Error occurred while getting by data_id: ")
        }
    }
   
}

const uploadFile = async (targetFile) => {
  // Convert buffer version of file to binary
  let binary = Buffer.from(targetFile);
  let options = {
      "method": "POST",
      "headers": {
       "apikey": process.env.OPSWAT_KEY,
       "Content-Type": "application/octet-stream",
      },
      data: binary,
  };
  try {
    let response = await axios("https://api.metadefender.com/v4/file", options);
    let dataId = response.data.data_id;
    pollByDataId(dataId);
  } catch (error) {
    handleError(error, "Error occured while uploading file ");
  }
}

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
    .then( (result) => {
        // File was found log out data according to expected output
        logResult(result.data);
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
          uploadFile(file);
        }
    });