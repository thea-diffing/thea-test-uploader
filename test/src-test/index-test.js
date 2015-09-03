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
    }

    gitInfoStub = require('../../lib/gitInfo');
    sinon.stub(gitInfoStub);

    gitInfoStub.getBranchAndSha.resolves({
      branch: 'fakeBranch',
      sha: 'fakeSha'
    });

    options = {
      project: 'project',
      numBrowsers: 2
    };

    TestUploader = proxyquire('../../', {
      'thea-js-sdk': TheaSdkStub,
      './gitInfo': gitInfoStub
    });

    testUploader = new TestUploader(options);
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
      return testUploader.promise
      .then(function() {
        assert.strictEqual(testUploader.branch, 'fakeBranch');
        assert.strictEqual(testUploader.sha, 'fakeSha');
      });
    });
  });

  describe('#_runIfNotOnMaster', function() {
    var runIfNotOnMaster;

    beforeEach(function() {
      runIfNotOnMaster = TestUploader.__get__('runIfNotOnMaster');
    });

    it('should not call callback if on master', function() {
      gitInfoStub.isOnBranch.resolves(true);

      var stub = sinon.stub();

      return runIfNotOnMaster('sha', stub)
      .then(function() {
        assert.notCalled(stub);
      });
    });

    it('should call callback if not on master', function() {
      gitInfoStub.isOnBranch.resolves(false);

      var stub = sinon.stub().resolves();

      return runIfNotOnMaster('sha', stub)
      .then(function() {
        assert.calledOnce(stub);
      });
    });

    it('should chain callback if not on master', function() {
      gitInfoStub.isOnBranch.resolves(false);

      var stub = sinon.stub().resolves(4);

      return runIfNotOnMaster('sha', stub)
      .then(function(result) {
        assert.strictEqual(result, 4);
      });
    });
  });

  describe('#start', function() {
    var runIfNotOnMasterOrig;
    var runIfNotOnMasterStub;

    beforeEach(function() {
      runIfNotOnMasterStub = sinon.stub().resolves();
      runIfNotOnMasterOrig = TestUploader.__get__('runIfNotOnMaster');
      TestUploader.__set__('runIfNotOnMaster', runIfNotOnMasterStub);
    });

    afterEach(function() {
      TestUploader.__set__('runIfNotOnMaster', runIfNotOnMasterOrig);
    });

    it('should call runIfNotOnMaster with start build', function() {
      return testUploader.start()
      .then(function() {
        var startBuildAgainstAncestor = testUploader._startBuildAgainstAncestor;

        assert.calledWith(runIfNotOnMasterStub, 'fakeSha', startBuildAgainstAncestor);
      });
    });
  });
});
