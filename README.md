# <em>µ</em>cdn-utils

[![Build Status](https://travis-ci.com/WebReflection/ucdn-utils.svg?branch=master)](https://travis-ci.com/WebReflection/ucdn-utils) [![Coverage Status](https://coveralls.io/repos/github/WebReflection/ucdn-utils/badge.svg?branch=master)](https://coveralls.io/github/WebReflection/ucdn-utils?branch=master)

Basic [µcdn](https://github.com/WebReflection/ucdn#readme) utilities in order to just serve files pre generated via [µcompress](https://github.com/WebReflection/ucompress#readme).

The only interesting utility to use is likely the `serve(path[, cacheTimeout])` one, as the rest is mostly needed for internal purposes in _µcdn_ module or in here.

#### Please Note

This module assumes all files already have associated headers. If you don't have those headers files, please use [ucompress.createHeaders(path)](https://github.com/WebReflection/ucompress#about-ucompresscreateheaderspath-headers) before serving via `serve(path[, cacheTimeout])`.


### Example

The following example will serve every file within any folder in the `source` directory, automatically optimizing on demand all operations, including the creation of _brotli_, _gzip_, or _deflate_.

```js
import {createServer} from 'http';
import {serve} from 'ucdn-utils';

import umeta from 'umeta';
const {dirName} = umeta(import.meta);

const callback = serve(dirName + '/source', 60000);

createServer(callback).listen(8080);
```

The callback works with _Express_ too, and similar modules, where all non existent files in the source folder will be ignored, and anything else will execute regularly.

```js
const {join} = require('path');

const express = require('express');
const {serve} = require('ucdn-utils');

const app = express();
app.use(serve(join(__dirname, 'source')));
app.get('/unknown', (req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('OK');
});
app.listen(8080);
```
