'use strict';
var router = require('express').Router({caseSensitive: true, strict: true});
var parser = require('body-parser').json();

var filter = require('./filter');


router.route('/v1/articles/:id').all(filter.input)
  .delete(require('./article/deletes'))
  .get(require('./article/gets'))
  .put(parser, require('./article/puts'));

router.route('/v1/articles').all(filter.input)
  .delete(require('./article/delete'))
  .get(require('./article/get'))
  .post(parser, require('./article/posts'));

router.route('/v1/blogs').all(filter.input)
  .post(parser, require('./blog/posts'));

router.route('/v1/users').all(filter.input)
  .post(parser, require('./user/posts'));


router.use(filter.catch);


module.exports = router;
