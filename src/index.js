/*eslint no-process-env: "off"*/

const readline = require('readline');
const fs = require('fs');
const Path = require('path');
const moment = require('moment');
const AWS = require('aws-sdk');
const csv = require('fast-csv');
const s3 = new AWS.S3();

const LOG_REGEX = /([^ ]+) ([^ ]+) \[([^\]]+)\] ([^ ]+) ([^ ]+) ([^ ]+) ([^ ]+) ([^ ]+) "([^ ]+) ([^ ]+) ([^"]+)" ([^ ]+) ([^ ]+) ([^ ]+) ([^ ]+) ([^ ]+) ([^ ]+) "([^ ]+)" "([^"]+)" ([^ ]+) ([^ ]+) ([^ ]+) ([^ ]+) ([^ ]+) ([^ ]+) ([^ ]+)/;

const OUTPUT_HEADERS = [
    'owner_id',
    'bucket',
    'timestamp',
    'ip_address',
    'requester',
    'request_id',
    'request_type',
    'bucket_key',
    'http_method',
    'http_path',
    'http_version',
    'http_status_code',
    'error_code',
    'bytes_sent',
    'object_size',
    'total_request_time',
    'turn_around_time',
    'referrer',
    'user_agent',
    'version_id',
    'host_id',
    'signature_version',
    'cipher_suite',
    'authentiation_type',
    'host_header',
    'tls_version',
];

function createCSVStream(headers) {
    let csvStream = csv.format({ headers: headers });
    csvStream.pipe(process.stdout)
        .on('end', process.exit);

    return csvStream;
}

function parseLogLine(line) {
    let data = LOG_REGEX.exec(line);
    if (!data || data.length < 26) {
        return null;
    }
    
    data = data.map(v => {
        if (v == '\'-\'' || v == '"-"' || v == '-') {
            return null;
        }
        return v;
    });

    return {
        owner_id: data[1],
        bucket: data[2],
        timestamp: moment(data[3], 'DD/MMM/YYYY:HH:mm:ss').format('YYYY-MM-DD HH:mm:ss'),
        ip_address: data[4],
        requester: data[5],
        request_id: data[6],
        request_type: data[7],
        bucket_key: data[8],
        http_method: data[9],
        http_path: data[10],
        http_version: data[11],
        http_status_code: data[12],
        error_code: data[13],
        bytes_sent: data[14],
        object_size: data[15],
        total_request_time: data[16],
        turn_around_time: data[17],
        referrer: data[18],
        user_agent: data[19],
        version_id: data[20],
        host_id: data[21],
        signature_version: data[22],
        cipher_suite: data[23],
        authentiation_type: data[24],
        host_header: data[25],
        tls_version: data[26],
    };
    
}

function listS3Objects(bucket, prefix) {
    return new Promise((accept, reject) => {
        s3.listObjects({
            Bucket: bucket,
            Prefix: prefix,
            MaxKeys: 1000,
        }, (error, data) => {
            if (error) {
                reject(error);
                return;
            }
            accept(data.Contents);
        });
    });
}

function downloadFile(bucket, fileObject) {
    let filename = fileObject.Key;
    return new Promise((accept, reject) => {
        s3.getObject({
            Bucket: bucket,
            Key: filename
        }, (error, data) => {
            if (error) {
                reject(error);
                return;
            }

            let tempname = Path.join('/', 'tmp', Path.basename(filename));
            fs.writeFileSync(tempname, data.Body, {
                encoding: 'utf8'
            });
            accept(tempname);
        });
    });
}

function parseLogFile(csvStream, filename) {
    return new Promise((accept, reject) => {
        let reader = readline.createInterface({
            input: fs.createReadStream(filename),
            console: false
        });

        reader.on('line', (line) => {
            let parsed = parseLogLine(line);
            if (parsed) {
                csvStream.write(parsed);
            }
        });

        reader.on('close', () => {
            accept(filename);
        });

        reader.on('error', (error) => {
            reject(error);
        });
    });
}

function runScript(bucket, prefix, headers) {
    let csvStream = createCSVStream(headers);

    listS3Objects(bucket, prefix)
        .then((remoteFilenames) => {
            return Promise.all(remoteFilenames.map(f => downloadFile(bucket, f)));
        })
        .then((localFilenames) => {
            return Promise.all(localFilenames.map(f => parseLogFile(csvStream, f)));
        })
        .then((localFilenames) => {
            localFilenames.forEach(fs.unlinkSync);
            csvStream.end();
        })
        .catch((error) => {
            console.log('Error:', error.message || error);
        });
}

function printHelp() {
    console.log('s3-access-to-csv Usage');
    console.log('======================');
    console.log('');
    console.log('node s3-access-to-csv.js [bucket] [prefix]');
}

if (process.argv.length < 3) {
    printHelp();
    return 1;
}

let bucket = process.argv[2];
let prefix = process.argv[3];

runScript(bucket, prefix, OUTPUT_HEADERS);

