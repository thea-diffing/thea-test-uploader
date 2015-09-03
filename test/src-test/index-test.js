'use strict';

var TheaSdk = require('thea-js-sdk');
var proxyquire = require('proxyquire');
var sinonOrig = require('sinon');
var sinon = require('sinon-sandbox');

describe('module/thea-test-uploader', function() {
  var TestUploader;
  var testUploader;
  var options;
  var gitInfoStub;

  beforeEach(function() {
    function TheaSdkStub() {
      return sinonOrig.createStubInstance(TheaSdk);
    };

    gitInfoStub = require('../../lib/gitInfo');
    sinon.stub(gitInfoStub);

    options = {
      project: 'project',
      numBrowsers: 2
    };

    TestUploader = proxyquire('../../', {
      'thea-js-sdk': TheaSdkStub,
      './gitInfo': gitInfoStub
    });

    var stub = sinon.stub(TestUploader.prototype, '_setup').resolves();

    testUploader = new TestUploader(options);

    stub.restore();
  });

  describe('#constructor', function() {
    it('should save browsers, create an sdk, and save a promise', function() {
      assert.isDefined(testUploader.numBrowsers);
      assert.instanceOf(testUploader.sdk, TheaSdk);
      assert.isFunction(testUploader.promise.then);
    });
  });

  describe('#_setup', function() {
    it('saves branch and sha', function() {
      gitInfoStub.getBranchAndSha.resolves({
        branch: 'branch',
        sha: 'sha'
      });

      assert.isUndefined(testUploader.branch);
      assert.isUndefined(testUploader.sha);

      return testUploader._setup()
      .then(function() {
        assert.strictEqual(testUploader.branch, 'branch');
        assert.strictEqual(testUploader.sha, 'sha');
      });
    });
  });
});
