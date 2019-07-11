s3-access-to-csv
================

## Overview

Host a static S3 website? Have access logs piping into an S3 bucket but missing an easy way to view them?
`s3-access-to-csv` aims to solve this by converting the cumbersome S3 access log format into a digestable CSV
that can be consumed by any datawarehousing platform.

## Key Features

- Converts log lines into structured CSV records
- Formats the timestamp value to be developer friendly
- Separates URI information into several columns for easier indexing
- Can be applied to several files or even just a single access file

## How it works

Assume we have the following log line:
```
XXX_OWNER_ID_XXX mywebsite.com [05/Jul/2019:19:46:09 +0000] 94.81.65.11 982374924012849831725912hf1233 23479823312 REST.GET.PUBLIC_ACCESS_BLOCK - "GET /mywebsite.com/?publicAccessBlock HTTP/1.1" 404 NoSuchPublicAccessBlockConfiguration 342 - 15 - "-" "S3Console/0.4" - EOIWjflaejfaeoiwjflaw+3298iqlakfje SigV4 ECDHE-RSA-AES128-SHA AuthHeader s3.amazonaws.com TLSv1.2
```

`s3-access-to-csv` would convert the above to the following CSV file:

|owner_id|bucket                       |timestamp|ip_address                                   |requester                     |request_id |request_type                |bucket_key|http_method|http_path                        |http_version|http_status_code|error_code                          |bytes_sent|object_size|total_request_time|turn_around_time|referrer|user_agent   |version_id|host_id                           |signature_version|cipher_suite|authentiation_type|host_header|tls_version|
|--------|-----------------------------|---------|---------------------------------------------|------------------------------|-----------|----------------------------|----------|-----------|---------------------------------|------------|----------------|------------------------------------|----------|-----------|------------------|----------------|--------|-------------|----------|----------------------------------|---|---|---|---|
|XXX_OWNER_ID_XXX|mywebsite.com                 |2019-07-05 19:46:09|94.81.65.11                                  |982374924012849831725912hf1233|23479823312|REST.GET.PUBLIC_ACCESS_BLOCK|          |GET        |/mywebsite.com/?publicAccessBlock|HTTP/1.1    |404             |NoSuchPublicAccessBlockConfiguration|342       |           |15                |                |        |S3Console/0.4|          |EOIWjflaejfaeoiwjflaw+3298iqlakfje|SigV4|ECDHE-RSA-AES128-SHA|AuthHeader|s3.amazonaws.com|TLSv1.2|

## Setup

To setup the project for use run the following commands:

```
$ git clone ...

$ cd s3-access-to-csv

$ npm install
```

## Running

To run the application simply give it a bucket and key prefix. The application will then download all log files matching
the key prefix. All data will then be aggregated to stdout.

```
Usage:
$ node src/index.js [bucket] [prefix]

Example:
$ node src/index.js my-bucket access_log_files/
```

