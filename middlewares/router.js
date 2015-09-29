'use strict';
var router = require('express').Router({caseSensitive: true, strict: true});
var parser = require('body-parser').json();

var filter = require('./filter');


router.route('/v1/articles/:id')
  .delete(require('./article/deletes'))
  .get(require('./article/gets'))
  .put(parser, filter, require('./article/puts'));

router.route('/v1/articles')
  .delete(require('./article/delete'))
  .get(require('./article/get'))
  .post(parser, filter, require('./article/posts'));

router.route('/v1/blogs')
  .post(parser, filter, require('./blog/posts'));

router.route('/v1/users')
  .post(parser, filter, require('./user/posts'));


module.exports = router;
