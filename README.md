# thea-test-uploader

[![Build Status](https://travis-ci.org/thea-diffing/thea-test-uploader.svg)](https://travis-ci.org/thea-diffing/thea-test-uploader)
[![devDependency Status](https://david-dm.org/thea-diffing/thea-test-uploader.svg)](https://david-dm.org/thea-diffing/thea-test-uploader#info=devDependencies)
[![devDependency Status](https://david-dm.org/thea-diffing/thea-test-uploader/dev-status.svg)](https://david-dm.org/thea-diffing/thea-test-uploader#info=devDependencies)

Use this module to run your application's image capture code and upload your images.

Thea doesn't care how images are captured and uploaded. This package provides some best practices that we have found to be useful when using Thea.

When uploading images to Thea, it requires that they are grouped with a unique identifier and group name. This package uses the current git sha as the identifier, and the browser they were captured in as the group name.

When telling Thea that it should start a build, the server needs to be told the two identifiers it will be comparing (head and base), and how many groups to wait to be uploaded with the head identifier. This package specifies the current git sha, and the git sha of where the current branch was branched off of the master branch.

When this package is run from the master branch, the current images are uploaded but no build is started.

## Installation

```sh
$ npm install thea-test-uploader --save-dev
```

## Usage


### `constructor({ integer numBrowsers, boolean verbose, thea-sdk-options options })`

Create a new instance of the TheaTestUploader. All options will be passed through to an instance of the [thea-js-sdk](https://github.com/thea-diffing/thea-js-sdk).

If `verbose` is true then message will be logged to the console when starting a build and uploading. Defaults to false.


```
var TheaTestUploader = require('thea-test-uploader');

var theaTestUploader = new TheaTestUploader({
  api: 'https://my-thea-instance.com'
  project: '092f9894-26b0-4482-9eba-c287cb99fc62',
  numBrowsers: 3
});
```

### `start()`

Call `start` once to conditionally start a build on Thea if the current sha is not on master.

```
theaTestUploader.start();
```

### `runAndUpload({ string browser, string imagePath, function runner })`

Call `runAndUpload` once for each browser you want to run your tests in.

`imagePath` should be the path where the images for this browser are saved.

`runner` needs to be a function that when called returns a promise. Once this promise resolves `imagePath` will be uploaded to the API.

```
function runMyBrowserTests() {
  return new Promise(function(resolve) {
    // capture screenshots to imagePath and call resolve
  });
}

theaTestUploader.runAndUpload({
  browser: 'chrome',
  imagePath: path.join(__dirname, 'screenshots', 'chrome'),
  runner: runMyBrowserTests
});
```

