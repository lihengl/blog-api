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


var formatDuplicate = function (rawErrorMessage) {
  var messageChunks = rawErrorMessage.split('\'');
  var dupField = _.capitalize(messageChunks[3].toLowerCase());
  var dupValue = messageChunks[1];
  return {error: dupField + ': ' + dupValue + ' already existed'};
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

  req.db.beginTransactionAsync().bind({}).then(function () {
    return req.filter(INPUT_VALIDATION_RULE, 'body');
  }).then(function () {
    return req.db.queryAsync(buildQuery(req.body));
  }).then(function (result) {
    this.id = _.get(result, '[0].insertId', 0);
    return req.db.commitAsync();
  }).catch(function (err) {
    this.error = err;
    return req.db.rollbackAsync();
  }).then(function () {
    req.db.release();

    if (!_.has(this, 'error')) { return res.status(200).json(this); }
    if (this.error.code === 'ER_DUP_ENTRY') {
      res.status(403).json(formatDuplicate(this.error.message));
      return;
    }

    next(this.error);
  });

};

module.exports = insertUser;
