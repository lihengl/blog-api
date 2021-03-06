'use strict';
var mysql = require('mysql');
var _ = require('lodash');


var INPUT_VALIDATION_RULE = {
  'cover': {
    format: /^[.*]{10,2048}$/,
    optional: true
  },
  'name': {
    format: /^[a-zA-Z0-9\_\-]{3,16}$/,
    optional: false
  },
  'tagline': {
    format: /^[a-zA-Z0-9]{1,50}$/,
    optional: true
  },
  'user': {
    format: /^[0-9]$/,
    optional: false
  }
};


var buildQuery = function (blog) {
  return mysql.format([
    'INSERT INTO blog (name, tagline, url_image_cover, id_user)',
    'VALUES (?, ?, ?, ?)'
  ].join(' '), [
    blog.name, blog.tagline, blog.cover, _.parseInt(blog.user)
  ]);
};

var insertBlog = function (req, res, next) {

  req.db.beginTransactionAsync().then(function () {
    return req.filter(INPUT_VALIDATION_RULE, 'body');
  }).then(function () {
    return req.db.queryAsync(buildQuery(req.body));
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

module.exports = insertBlog;
