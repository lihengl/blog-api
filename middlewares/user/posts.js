'use strict';
var mysql = require('mysql');
var _ = require('lodash');


var INPUT_VALIDATION = {
  'alias': {
    format: /^[a-zA-Z\-]{1,20}$/,
    required: true
  },
  'email': {
    format: /^[A-Za-z0-9._+\-\']+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/,
    required: true
  },
  'forename': {
    format: /^[a-zA-Z\-]{1,50}$/,
    required: true
  },
  'surname': {
    format: /^[a-zA-Z]{1,7}$/,
    required: true
  },
  'password': {
    format: /^[a-zA-Z0-9]{8,50}$/,
    required: true
  }
};


var insertUser = function (input) {
  var salt = (Math.random() + 1).toString(36).slice(2, 6);
  var hmac = require('crypto').createHmac('md5', salt);

  input.password = salt + hmac.update(input.password).digest('hex');

  return mysql.format([
    'INSERT INTO user (alias, email, password, name_first, name_last)',
    'VALUES (?, ?, ?, ?, ?)'
  ].join(' '), [
    'alias', 'email', 'password', 'forename', 'surname'
  ].map(function (field) {
    return input[field];
  }));
};

var postUser = function (req, res, next) {

  req.db.beginTransactionAsync().then(function () {
    return req.filter(INPUT_VALIDATION, 'body');
  }).then(function () {
    return req.db.queryAsync(insertUser(req.body));
  }).bind({}).then(function (result) {
    this.id = _.get(result, '[0].insertId', false);
    if (!this.id) { throw new Error('Unexpected insersion id'); }
    return req.db.commitAsync();
  }).then(function () {
    req.db.release();
    res.status(200).json(this);
  }).catch(function (err) {
    this.error = err;
    return req.db.rollbackAsync();
  }).then(function () {
    next(this.error);
  });

};

module.exports = postUser;
