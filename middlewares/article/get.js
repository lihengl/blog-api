'use strict';
var mysql = require('mysql');

var SQL = 'SELECT title FROM article WHERE id = ?';

var article = function (req, res, next) {
  req.db.queryAsync(mysql.format(SQL, [req.param.id])).then(function (result) {
    req.db.release();
    res.status(200).json({entries: result[0]});
  }, next);
};

module.exports = article;
