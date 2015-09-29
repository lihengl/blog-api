'use strict';
var Promise = require('bluebird');
var _ = require('lodash');


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
    error.code = 'ERR_INPUT_VALIDATION';
    return callback(error);
  }

  delete this.error;
  return callback();
});


module.exports = function (req, res, next) {
  req.filter = filter;
  next();
  return res;
};
