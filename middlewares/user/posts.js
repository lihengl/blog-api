'use strict';
var mysql = require('mysql');
var _ = require('lodash');


var INPUT_VALIDATION_RULE = {
  'alias': {
    format: /^[a-zA-Z\-]{1,20}$/,
    optional: false
  },
  'email': {
    format: /^[A-Za-z0-9._+\-\']+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/,
    optional: false
  },
  'forename': {
    format: /^[a-zA-Z\-]{1,50}$/,
    optional: false
  },
  'surname': {
    format: /^[a-zA-Z]{1,7}$/,
    optional: false
  },
  'password': {
    format: /^[a-zA-Z0-9]{8,50}$/,
    optional: false
  }
};


var buildQuery = function (user) {
  var salt = (Math.random() + 1).toString(36).slice(2, 6);
  var hmac = require('crypto').createHmac('md5', salt);

  user.password = salt + hmac.update(user.password).digest('hex');

  return mysql.format([
    'INSERT INTO user (alias, email, password, name_first, name_last)',
    'VALUES (?, ?, ?, ?, ?)'
  ].join(' '), [
    'alias', 'email', 'password', 'forename', 'surname'
  ].map(function (field) {
    return user[field];
  }));
};

var insertUser = function (req, res, next) {

  req.db.beginTransactionAsync().then(function () {
    return req.filter(INPUT_VALIDATION_RULE, 'body');
  }).then(function () {
    return req.db.queryAsync(buildQuery(req.body));
  }).bind({}).then(function (result) {
    this.id = _.get(result, '[0].insertId', 0);
    if (this.id < 1) { throw new Error('Unexpected insersion id'); }
    return req.db.commitAsync();
  }).then(function () {
    req.db.release();
    res.status(200).json(this);
    next();
  }).catch(function (err) {
    this.error = err;
    return req.db.rollbackAsync();
  }).then(function () {
    next(this.error);
  });

};

module.exports = insertUser;
