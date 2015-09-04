'use strict';

var TheaSdk = require('thea-js-sdk');
var assert = require('chai').assert;
var gitInfo = require('./gitInfo');
var gitCommonAncestor = require('git-common-ancestor');

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

  if (options.verbose) {
    assert.isBoolean(options.verbose);
  }

  this.verbose = options.verbose || false;

  this.numBrowsers = options.numBrowsers;
  this.sdk = new TheaSdk(options);
  this.promise = this._setup();

  this._startBuildAgainstAncestor = this._startBuildAgainstAncestor.bind(this);
}

TestUploader.prototype = {
  _log: function() {
    if (this.verbose) {
      console.log.apply(console, arguments); // eslint-disable-line
    }
  },

  _setup: function() {
    return gitInfo.getBranchAndSha()
    .then((function(branchInfoObj) {
      this.branch = branchInfoObj.branch;
      this.sha = branchInfoObj.sha;
    }).bind(this));
  },

  _startBuildAgainstAncestor: function() {
    return gitCommonAncestor.ofShaAndBranch(this.sha, 'origin/master')
    .then((function(ancestor) {
      this._log('Not on master. Starting build between', this.sha, 'and', ancestor);

      return this.sdk.startBuild({
        head: this.sha,
        base: ancestor,
        numBrowsers: this.numBrowsers
      });
    }).bind(this));
  },

  start: function() {
    this.promise = this.promise
    .then((function() {
      return runIfNotOnMaster(this.sha, this._startBuildAgainstAncestor);
    }).bind(this));

    return this.promise;
  },

  runAndUpload: function(options) {
    assert.isString(options.browser);
    assert.isString(options.imagePath);
    assert.isFunction(options.runner);

    return this.promise
    .then(function() {
      var userResult = options.runner();
      assert.isFunction(userResult.then, 'The function given to start must be a thenable');

      return userResult;
    })
    .then((function() {
      this._log('Uploading images for browser', options.browser, 'from', options.imagePath);

      return this.sdk.upload({
        sha: this.sha,
        browser: options.browser,
        imagePath: options.imagePath
      });
    }).bind(this));
  }
};

module.exports = TestUploader;
