# loggly-bulk
A module built on top of loggly to accommodate bulk logging.

## Installation
    npm install --save git+https://github.com/snowinferno/loggly-bulk.git

## Usage
    var LogFactory = require('loggly-bulk');
    var config = {
		token: "Your loggly token",
		subdomain: "Your loggly subdomain",
		json: {true|false},
		tags: ["tag1","tag2",...],
		bulk: {true|false},
		max_items: 42
    };
    var logger = new LogFactory(config);
    logger.log(
    	"This is my log message",
    	"Log Level",
    	["some","tags","for","this","message"],
    	force_send,
    	callback
    );

### #log
This is how logging is handled.

*   In bulk=false mode, options are passed directly on to the loggly module for submission.
*   In bulk=true mode, callback is not supported (restriction in loggly module). If force_send is true
    or max_items has been reached, the bulk logs are offloaded.
*   Tags, if provided, are included with logs. In bulk=false mode, these are passed along to loggly module
    log method directly. In bulk mode, these are added as an additional item on the logged json.
*   Log Level can be any string, for sanity sake it is a good idea to keep to standard levels.
*   Log message, if longer than 64,000 characters will be truncated. This is due to the calculated max_items
    and 5MB loggly payload limit.

## Configuration
Only two configuration fields are required, token and subdomain.

*   token: The token attribute should reflect your loggly customer token.
*   subdomain: The subdomain should reflect your loggly subdomain.
*   json: Whether or not the log should be submitted using Loggly's json format, defaults to true
*   tags: Global tags that will be provided with every log request, defaults to no tags
*   bulk: Whether or not this should cache logs for bulk submission, defaults to true
*   max_items: The maximum number of log items to be cached before submission. If omitted
    this will default to a calculated max_items to remain within the 5MB payload maximum from Loggly.

The username/pass auth parameter afforded by the loggly module is not yet supported here.
