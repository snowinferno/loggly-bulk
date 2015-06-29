var Loggly = require('loggly');

/**
 * Class to handle logging from the loggly module
 * config takes the following form, only token and subdomain are required,
 * all other items are optional and have working default values:
 * {
 *   token: "Your loggly token",
 *   subdomain: "Your loggly subdomain",
 *   json: {true|false}, // Whether the loggly logging should use json
 *   tags: ["tag1","tag2",...], // any tags that should be applied, in bulk these end up as part of the message
 *   bulk: {true|false}, // whether this will be used for bulk logging
 *   max_items: 42 // the maximum number of items, defaults to a calculated max that does not exceed 5MB total payload
 * }
 */

var LogglyFactory = function(config){
	'use strict';
	if (!config.token){
		return throw new Error("Required field `token` not provided.");
	}

	if (!config.subdomain){
		return throw new Error("Required field `subdomain` not provided.");
	}

	this.config = {
		token: config.token,
		subdomain: config.subdomain,
		json: config.json || true,
		tags: config.tags || []
	};

	this.bulk = config.bulk || true;

	this.maxStringLength = 64000; // limit strings to 64kb (64,000 characters)

	// if no max_items is given, calculate max_items based on size (5MB/64KB)
	this.maxItems = config.max_items || (5 * 1024 * 1024) / (64 * 1024);

	// create the client with the appropriate configuration
	this.client = Loggly.createClient(this.config);

	// create the array which will hold the items to be logged
	this.loggingArray = new Array();

	this.log = function(message, level, tags, forceSend, callback){
		var logObject = {log: message};

		if (level)
			logObject.level = level;

		var logTags = [];
		if (this.config.tags.length > 0) {
			for (var i = 0; i < this.config.tags.length; i++) {
				logTags.push(this.config.tags[i]);
			}
		}
		
		if (tags) {
			for (var i = 0; i < tags.length; i++) {
				logTags.push(tags[i]);
			}
		}

		if (this.bulk){
			// handle bulk logging, tags not supported but will be sent along, callback not supported
			var lengthLimit = this.maxStringLength;
			if (logTags.length > 0){
				lengthLimit -= JSON.stringify(logTags).length;
				if (logObject.log.length >= lengthLimit)
					logObject.log = logObject.log.slice(0,lengthLimit);

				logObject.tags = logTags;
			}

			this.loggingArray.push(logObject);

			// if we've reached maxItems or are being told to send regardless, send it
			if (this.loggingArray.length >= this.maxItems || forceSend){
				this.client.log(this.loggingArray);
				this.loggingArray = new Array();
			}
		} else {
			// handle normal logging

			if (callback) {
				if (tags) {
					this.client.log(logObject, logTags, callback);
				} else {
					this.client.log(logObject, callback);
				}
			} else {
				if (tags) {
					this.client.log(logObject, logTags);
				} else {
					this.client.log(logObject);
				}
			}
		}
	}

	// if config has been changed manually or by supplying a new config object, recreate the client after dumping existing logs
	this.updateConfig = function(config){
		// if there are items to be logged, offload them now and clear the loggingArray
		if (this.loggingArray.length > 0) {
			this.client.log(this.loggingArray);
			this.loggingArray = new Array();
		}

		// remove the old client
		delete this.client;

		// reinitialize the client, config, and config options
		if (config){
			var oldConfig = this.config;
			this.config = {
				token: config.token || oldConfig.token,
				subdomain: config.subdomain || oldConfig.subdomain,
				json: config.json || oldConfig.json,
				tags: config.tags || oldConfig.tags
			};
			this.bulk = config.bulk || oldConfig.bulk;
			this.maxItems = config.max_items || oldConfig.maxItems;
		}

		// recreate the logging client
		this.client = Loggly.createClient(this.config);
	};
};

module.exports = LogglyFactory;
