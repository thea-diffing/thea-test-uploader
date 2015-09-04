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
  var theaSdkStub;
  var gitCommonAncestorStub;
  var consoleLogStub;

  beforeEach(function() {
    function TheaSdkStub() {
      var instance = sinonOrig.createStubInstance(TheaSdk);
      theaSdkStub = instance;
      return instance;
    }

    gitInfoStub = require('../../lib/gitInfo');
    sinon.stub(gitInfoStub);

    gitCommonAncestorStub = require('git-common-ancestor');
    sinon.stub(gitCommonAncestorStub);

    gitInfoStub.getBranchAndSha.resolves({
      branch: 'fakeBranch',
      sha: 'fakeSha'
    });

    consoleLogStub = sinon.stub(console, 'log');

    options = {
      project: 'project',
      numBrowsers: 2
    };

    TestUploader = proxyquire('../../', {
      'thea-js-sdk': TheaSdkStub,
      'git-common-ancestor': gitCommonAncestorStub,
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

    it('should default to not verbose', function() {
      assert.isFalse(testUploader.verbose);
    });

    it('should take verbose from options if set', function() {
      options.verbose = true;

      testUploader = new TestUploader(options);

      assert.isTrue(testUploader.verbose);
    });
  });

  describe('#_log', function() {
    it('should call console log if verbose', function() {
      testUploader.verbose = true;

      testUploader._log('foo', 'bar');

      assert.calledWith(consoleLogStub, 'foo', 'bar');
    });

    it('should not call console log if not verbose', function() {
      testUploader.verbose = false;

      testUploader._log('foo', 'bar');

      assert.notCalled(consoleLogStub);
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

  describe('#_startBuildAgainstAncestor', function() {
    it('should call ofShaAndBranch with sha or origin master', function() {
      gitCommonAncestorStub.ofShaAndBranch.resolves('ancestor');
      var logStub = sinon.stub(testUploader, '_log');

      return testUploader._startBuildAgainstAncestor()
      .then(function() {
        assert.calledWith(logStub, sinon.match(function(value) {
          return value.indexOf('Not on master. Starting build between') >= 0;
        }));

        assert.calledWith(gitCommonAncestorStub.ofShaAndBranch, 'fakeSha', 'origin/master');
      });
    });

    it('should start build with ancestor a number of browsers', function() {
      gitCommonAncestorStub.ofShaAndBranch.resolves('ancestor');

      return testUploader._startBuildAgainstAncestor()
      .then(function() {
        assert.calledWith(theaSdkStub.startBuild, {
          head: 'fakeSha',
          base: 'ancestor',
          numBrowsers: 2
        });
      });
    });

    it('should return a thenable', function() {
      gitCommonAncestorStub.ofShaAndBranch.resolves('ancestor');
      theaSdkStub.startBuild.resolves();

      var start = testUploader._startBuildAgainstAncestor();

      assert.isFunction(start.then);
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

    it('should return a thenable', function() {
      var start = testUploader.start();

      assert.isFunction(start.then);
    });
  });

  describe('#runAndUpload', function() {
    it('should reject if not given function that returns a promise', function() {
      function testRunner() {
        return 'foo';
      }

      return testUploader.runAndUpload({
        browser: 'chrome',
        imagePath: __dirname,
        runner: testRunner
      })
      .then(function() {
        assert.fail();
      },
      function(err) {
        assert.include(err.message, 'thenable');
      });
    });

    it('should call testRunner and then upload', function() {
      function testRunner() {
        return Promise.resolve();
      }

      var runnerSpy = sinon.spy(testRunner);

      return testUploader.runAndUpload({
        browser: 'chrome',
        imagePath: 'imagePath',
        runner: runnerSpy
      })
      .then(function() {
        assert.calledWith(theaSdkStub.upload, {
          sha: 'fakeSha',
          browser: 'chrome',
          imagePath: 'imagePath'
        });

        assert.callOrder(runnerSpy, theaSdkStub.upload);
      });
    });

    it('should log that it is uploading', function() {
      var logStub = sinon.stub(testUploader, '_log');

      function testRunner() {
        return Promise.resolve();
      }

      var runnerSpy = sinon.spy(testRunner);

      return testUploader.runAndUpload({
        browser: 'chrome',
        imagePath: 'imagePath',
        runner: runnerSpy
      })
      .then(function() {
        assert.calledWith(logStub, sinon.match(function(value) {
          return value.indexOf('Uploading images for browser') >= 0;
        }));
      });
    });
  });
});
