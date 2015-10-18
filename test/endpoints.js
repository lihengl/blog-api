'use strict';
var supertest = require('supertest');
var _ = require('lodash');

var server = require('../server');


describe('POST /v1/users', function () {
  var user = {
    alias: 'robot',
    email: 'foobar@example.com',
    forename: 'Foo',
    password: '123',
    surname: 'Bar',
  };

  it('should error out when missing required input field', function (done) {
    supertest(server).post('/v1/users').send(_.omit(user, 'alias'))
    .expect(400, {error: 'Missing body.alias'}, done);
  });

  it('should error out when given invalid input value', function (done) {
    supertest(server).post('/v1/users').send(user)
    .expect(400, {error: 'Bad body.password: 123'}, done);
  });

  it('should respond with created user id with valid input', function (done) {
    user.password = '1qaz2wsx';
    supertest(server).post('/v1/users').send(user)
    .expect(200, {id: 1}, done);
  });

});
