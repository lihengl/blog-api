'use strict';
var Promise = require('bluebird');

var express = require('express');
var logger = require('morgan');
var mysql = require('mysql');

var endpoints = require('./endpoints/router');
var pkg = require('./package.json');


var dbPool = mysql.createPool(Object.assign({
  password: process.env.MYSQL_PWD
}, (process.env.NODE_ENV === 'production') ?
  pkg.mysqlConfig.production :
  (process.env.MODE === 'development') ?
  pkg.mysqlConfig.development :
  (process.env.MODE === 'test') ?
  pkg.mysqlConfig.test :
  pkg.mysqlConfig.staging
));


var server = express().disable('x-powered-by').enable('strict routing');

if (process.env.MODE === 'test') {
  server.set('muted', true);
} else {
  server.use(logger('combined'));
}

server.use(function (req, res, next) {
  dbPool.getConnection(function(err, connection) {
    if (err) { return next(err); }
    req.db = Promise.promisifyAll(connection);
    res.locals.connected = true;
    next();
  });
});

server.use(endpoints);

server.use(function (err, req, res, next) {
  res.locals.connected = false;
  req.db.release();

  console.error('Endpoint: ' + req.path);
  console.error(err.toString());

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    res.status(400).json({error: 'Database constraint failure'});
    return next();
  }

  dbPool.end(function (e) {
    if (e) { console.error('MySQL' + e.stack); }
    res.status(500).type('text/plain').send(err.message);
    next();
  });

});

if (process.env.MODE === 'test') {
  module.exports = server;
} else {
  server.listen(4080);
}
