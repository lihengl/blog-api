'use strict';
require('babel/register')({extensions: ['.js']});
var Promise = require('bluebird');

var bodyParser = require('body-parser');
var express = require('express');
var logger = require('morgan');
var mysql = require('mysql');

var middlewares = require('./middlewares/router');
var pkg = require('./package.json');


var dbPool = mysql.createPool(Object.assign({
  database: 'blog',
  password: process.env.MYSQL_PWD,
  user: 'blog-api'
}, (process.env.NODE_ENV === 'production') ?
  pkg.mysqlConfig.production :
  (process.env.MODE === 'staging') ?
  pkg.mysqlConfig.staging :
  pkg.mysqlConfig.development
));


var server = express().disable('x-powered-by').enable('strict routing');

server.use(logger('combined'));

server.use(function (req, res, next) {
  dbPool.getConnection(function(err, connection) {
    if (err) { return next(err); }
    req.db = Promise.promisifyAll(connection);
    res.locals.connected = true;
    next();
  });
});

server.use(bodyParser.json());
server.use(middlewares);

server.use(function (err, req, res, next) {
  dbPool.end(function (e) {
    console.error('Endpoint: ' + req.path);
    console.error(err.stack);
    if (e) { console.error('MySQL: ' + e.stack); }
    res.status(500).type('text/plain').send(err.message);
    return next;
  });
});


server.listen(4080);
