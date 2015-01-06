// Copyright 2014, Renasar Technologies Inc.
/* jshint: node:true */

'use strict';

var di = require('di'),
    core = require('renasar-core')(di),
    injector = new di.Injector(
        core.injectables
    ),
    dgram = require('dgram'),
    server = dgram.createSocket('udp4'),
    logger = injector.get('Logger').initialize('SysLog'),
    _ = injector.get('_'),
    levels = [
        'emerg',
        'alert',
        'crit',
        'error',
        'warning',
        'notice',
        'info',
        'debug'
    ];

server.on('message', function (data, remote) {
    logger.info(data.toString('utf8'), remote);

    var match = data.message.match(/<(\d+)>(.+)/),
            message = data.message,
            level = 'info',
            meta = {};

        if (data.remote.address) {
            meta.ip = data.remote.address;
        }

        if (match) {
            var prival = parseInt(match[1]),
                facility = Math.floor(prival / 8),
                priority = prival - (facility * 8);

            level = levels[priority];
            message = match[2].trim();
        }

        if(_.keys(meta).length) {
            logger[level](message, meta);
        } else {
            logger[level](message);
        }
});

server.on('listening', function () {
    logger.notice('Listening');
});

server.on('error', function (error) {
    logger.error('SysLog Service Error.', {
        error: error
    });
});

server.on('close', function () {
    logger.notice('Closed');
});

server.bind(514);