'use strict';

var git = require('git-rev');
var childProcess = require('child_process');
var promisify = require('es6-promisify');
var execAsync = promisify(childProcess.exec);

function parseRevListOutput(stdout) {
  var result = stdout[0].trim();
  var shas = result.split('\n');

  return shas;
}

function simplePromisify(func) {
  return new Promise(function(resolve) {
    func(resolve);
  });
}

function getBranch() {
  return simplePromisify(git.branch);
}

function getSha() {
  return simplePromisify(git.long);
}

var GitInfo = {
  getBranchAndSha: function() {
    return Promise.all([
      getBranch(),
      getSha()
    ])
    .then(function(results) {
      return {
        branch: results[0],
        sha: results[1]
      };
    });
  },

  isOnBranch: function(sha, branch) {
    return execAsync('git rev-list ' + branch)
    .then(function(revList) {
      var parsed = parseRevListOutput(revList);
      return parsed.indexOf(sha) !== -1;
    });
  }
};

module.exports = GitInfo;
