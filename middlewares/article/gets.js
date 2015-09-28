'use strict';
var mysql = require('mysql');

var SQL = 'SELECT title FROM article WHERE id = ?';

var getArticle = function (req, res, next) {
  var sql = mysql.format(SQL, [req.param.id]);

  req.db.queryAsync(sql).then(function (result) {
    req.db.release();
    res.status(200).json({entries: result[0]});
  }, next);

};

module.exports = getArticle;
