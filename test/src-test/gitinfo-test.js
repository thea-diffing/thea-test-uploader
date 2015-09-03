'use strict';

var sinon = require('sinon-sandbox');
var gitInfo = require('../../lib/gitInfo');

describe('module/gitinfo', function() {
  describe('#parseRevListOutput', function() {
    var parseRevListOutput;

    beforeEach(function() {
      parseRevListOutput = gitInfo.__get__('parseRevListOutput');
    });

    it('should return array of each line of text', function() {
      var stdout = [
        'foo\nbar\n',
        ''
      ];

      var output = parseRevListOutput(stdout);
      assert.deepEqual(output, ['foo', 'bar']);
    });
  });

  describe('#simplePromisify', function() {
    var simplePromisify;

    beforeEach(function() {
      simplePromisify = gitInfo.__get__('simplePromisify');
    });

    it('should resolve with callback value of function', function() {
      function testFunction(callback) {
        callback(4);
      }

      return simplePromisify(testFunction)
      .then(function(result) {
        assert.strictEqual(result, 4);
      });
    });
  });

  describe('#getBranchAndSha', function() {
    it('should resolve an object with a branch and a sha', function() {
      return gitInfo.getBranchAndSha()
      .then(function(result) {
        assert.isString(result.branch);
        assert.isString(result.sha);

        assert.isAbove(result.sha.length, result.branch.length);
      });
    });
  });

  describe('#isOnBranch', function() {
    var parseRevListOutputOriginal;
    var parseRevListOutputStub;

    beforeEach(function() {
      parseRevListOutputStub = sinon.stub();

      parseRevListOutputStub.returns(['a', 'b', 'c']);

      parseRevListOutputOriginal = gitInfo.__get__('parseRevListOutput');
      gitInfo.__set__('parseRevListOutput', parseRevListOutputStub);
    });

    afterEach(function() {
      gitInfo.__set__('parseRevListOutput', parseRevListOutputOriginal);
    });

    it('should return true if sha appears on branch rev list', function() {
      gitInfo.isOnBranch('c', 'master');
    });

    it('should return false if sha does not appear on branch rev list', function() {
      gitInfo.isOnBranch('d', 'master');
    });
  });
});
