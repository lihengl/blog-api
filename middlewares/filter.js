'use strict';
var Promise = require('bluebird');
var _ = require('lodash');


var ERROR_CODE = 'ERR_INPUT_VALIDATION';


var findError = function (rule, key) {
  var clear = false;
  var input = _.get(this, this.target, {});

  if (_.isEmpty(input)) {
    this.error = new Error('Object req.' + this.target + ' does not exist');
  } else if (_.has(input, key) && !rule.format.test(input[key])) {
    this.error = new Error('Bad ' + this.target + '.' + key + ': ' + input[key]);
  } else if (!_.has(input, key) && rule.required) {
    this.error = new Error('Missing ' + this.target + '.' + key);
  } else {
    clear = true;
  }

  return clear;
};

var filter = function (validation, target, callback) {
  _.forOwn(validation, findError, _.extend(this, {target: target}));

  if (_.has(this, 'error')) {
    this.error.code = ERROR_CODE;
    return callback(this.error);
  }

  callback();
};


exports.apply = function (req, res, next) {
  req.filter = Promise.promisify(filter);
  next();
  return res;
};

exports.catch = function (err, req, res, next) {
  if (err.code !== ERROR_CODE) { return next(err); }

  if (!req.app.get('muted')) {
    console.error(err.toString());
  }

  req.db.release();
  res.status(400).json({error: err.message});
};
