'use strict';
var router = require('express').Router({caseSensitive: true, strict: true});


router.route('/v1/articles/:id')
  .delete(require('./article/deletes'))
  .get(require('./article/gets'))
  .put(require('./article/puts'));

router.route('/v1/articles')
  .delete(require('./article/delete'))
  .get(require('./article/get'))
  .post(require('./article/posts'));

router.route('/v1/users')
  .post(require('./user/posts'));


module.exports = router;
