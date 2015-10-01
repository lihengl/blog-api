'use strict';
var mysql = require('mysql');
var _ = require('lodash');


var INPUT_VALIDATION = {
  'cover': {
    format: /^[.*]{10,2048}$/,
    required: false
  },
  'name': {
    format: /^[a-zA-Z0-9\_\-]{3,16}$/,
    required: true
  },
  'tagline': {
    format: /^[a-zA-Z0-9]{1,50}$/,
    required: false
  },
  'user': {
    format: /^[0-9]$/,
    required: true
  }
};


var insertBlog = function (input) {
  return mysql.format([
    'INSERT INTO blog (name, tagline, url_image_cover, id_user)',
    'VALUES (?, ?, ?, ?)'
  ].join(' '), [
    input.name, input.tagline, input.cover, _.parseInt(input.user)
  ]);
};

var postBlog = function (req, res, next) {

  req.db.beginTransactionAsync().then(function () {
    return req.filter(INPUT_VALIDATION, 'body');
  }).then(function () {
    return req.db.queryAsync(insertBlog(req.body));
  }).bind({}).then(function (result) {
    this.id = _.get(result, '[0].insertId', 0);
    if (this.id < 1) { throw new Error('Unexpected insersion id'); }
    return req.db.commitAsync();
  }).then(function () {
    res.status(200).json(this);
    next();
  }).catch(function (err) {
    this.error = err;
    return req.db.rollbackAsync();
  }).then(function () {
    next(this.error);
  });

};

module.exports = postBlog;
