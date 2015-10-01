'use strict';
var Promise = require('bluebird');
var _ = require('lodash');

var ERROR_CODE = 'ERR_INPUT_VALIDATION';


var validate = function (rule, key) {
  var input = _.get(this, this.target, false);

  if (this.error) { return; }
  if (input === false) {
    this.error = ('Target req.' + target + ' does not exist');
  } else if (_.has(input, key) && !rule.format.test(input[key])) {
    this.error = ('Bad ' + this.target + '.' + key + ' (' + input[key] + ')');
  } else if (!_.has(input, key) && rule.required) {
    this.error = ('Missing ' + this.target + '.' + key);
  } else {
    this.error = null;
  }
};

var filter = Promise.promisify(function (validation, target, callback) {
  var error = null;

  _.forIn(validation, validate, _.extend(this, {target: target}));

  if (this.error) {
    error = new Error(this.error);
    error.code = ERROR_CODE;
    return callback(error);
  }

  delete this.error;
  return callback();
});


exports.input = function (req, res, next) {
  req.filter = filter;
  next();
  return res;
};

exports.catch = function (err, req, res, next) {
  if (err.code !== ERROR_CODE) { return next(err); }

  console.error(err.toString());

  req.db.release();
  res.status(400).json({error: err.message});
};
