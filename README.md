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
