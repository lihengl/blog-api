'use strict';
var mysql = require('mysql');
var _ = require('lodash');


var INPUT_VALIDATOR = {
  'email': /^[A-Za-z0-9._+\-\']+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/,
  'forename': /^[a-zA-Z\-]{1,50}$/,
  'nickname': /^[a-zA-Z\-]{1,20}$/,
  'surname': /^[a-zA-Z]{1,7}$/,
  'password': /^[a-zA-Z0-9]{8,50}$/
};


var validateInput = function (regex, field) {
  if (this.error) { return; }
  if (!_.has(this, field)) {
    this.error = ('Missing req.body.' + field);
  } else if (!regex.test(this[field])) {
    this.error = ('Bad format of req.body.' + field);
  } else {
    this.error = null;
  }
};

var insertUser = function (input) {
  var salt = (Math.random() + 1).toString(36).slice(2, 6);
  var hmac = require('crypto').createHmac('md5', salt);

  input.password = salt + hmac.update(input.password).digest('hex');

  return mysql.format([
    'INSERT INTO user',
    '(email, password, name_first, name_last, name_alias)',
    'VALUES (?, ?, ?, ?, ?)'
  ].join(' '), [
    'email', 'password', 'forename', 'surname', 'nickname'
  ].map(function (field) {
    return input[field];
  }));
};

var postUser = function (req, res, next) {
  _.forIn(INPUT_VALIDATOR, validateInput, req.body);

  if (req.body.error) {
    req.db.release();
    console.error('Endpoint: ' + req.path);
    console.error('Error: ' + req.body.error);
    res.status(400).json({error: req.body.error});
    return next();
  }

  req.db.beginTransactionAsync().then(function () {
    return req.db.queryAsync(insertUser(req.body));
  }).bind({}).then(function (result) {
    this.id = _.get(result, '[0].insertId', false);
    if (!this.id) { throw new Error('Unexpected insersion id'); }
    return req.db.commitAsync();
  }).then(function () {
    res.status(200).json(this);
  }).catch(function (err) {
    this.error = err;
    return req.db.rollbackAsync();
  }).then(function () {
    req.db.release();
    next(this.error);
  });

};

module.exports = postUser;
