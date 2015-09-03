/* eslint no-console:0 */

'use strict';

var TheaSdk = require('thea-js-sdk');
var assert = require('chai').assert;
var gitInfo = require('./gitInfo');

function runIfNotOnMaster(sha, func) {
  return gitInfo.isOnBranch(sha, 'master')
  .then(function(isOnMaster) {
    if (!isOnMaster) {
      return func();
    }
  });
}

function TestUploader(options) {
  assert.isObject(options);
  assert.isString(options.project);
  assert.isNumber(options.numBrowsers);

  this.numBrowsers = options.numBrowsers;
  this.sdk = new TheaSdk(options);
  this.promise = this._setup();
}

TestUploader.prototype = {
  _setup: function() {
    return gitInfo.getBranchAndSha()
    .then((function(branchInfoObj) {
      this.branch = branchInfoObj.branch;
      this.sha = branchInfoObj.sha;
    }).bind(this));
  },

  _startBuildAgainstAncestor: function() {
    var ancestorSha;

    return gitInfo.getCommonAncestor(this.sha, 'origin/master')
    .then((function(ancestor) {
      ancestorSha = ancestor;
      return this.sdk.startBuild({
        head: this.sha,
        base: ancestor,
        numBrowsers: this.numBrowsers
      });
    }).bind(this))
    .then(function(build) {
      console.log('Build %s started between %s and %s', build.build, this.sha, ancestorSha);
    });
  },

  start: function(options) {
    assert.isObject(options);
    assert.isString(options.browser);
    assert.isString(options.imagePath);
    assert.isFunction(options.runner);

    return this.promise()
    .then((function() {
      return runIfNotOnMaster(this.sha, this._startBuildAgainstAncestor.bind(this));
    }).bind(this))
    .then(function() {
      var userResult = options.runner();

      assert.isFunction(userResult.then, 'The function given to start must be a thenable');

      return userResult;
    })
    .then((function() {
      return this.sdk.upload({
        sha: this.sha,
        browser: options.browser,
        imagePath: options.imagePath
      });
    }).bind(this));
  }
};

module.exports = TestUploader;
