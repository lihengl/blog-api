'use strict';
require('babel/register')({extensions: ['.js']});
var Promise = require('bluebird');

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

server.use(middlewares);

server.use(function (err, req, res, next) {
  res.locals.connected = false;
  req.db.release();

  console.error('Endpoint: ' + req.path);
  console.error(err.toString());

  if (err.code === 'ERR_INPUT_VALIDATION') {
    res.status(400).json({error: err.message});
    return next();
  }

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


server.listen(4080);
