'use strict';
const {createReadStream, readFile} = require('fs');
const {extname, join, resolve} = require('path');

const umap = (m => m.__esModule ? /* istanbul ignore next */ m.default : /* istanbul ignore next */ m)(require('umap'));

const compressed = (m => m.__esModule ? /* istanbul ignore next */ m.default : /* istanbul ignore next */ m)(require('./compressed.js'));

const {parse} = JSON;
const {assign} = Object;

const streamFile = (res, asset, headers) => {
  res.writeHead(200, headers);
  createReadStream(asset).pipe(res);
};

const _json = new Map;
exports._json = _json;

const clear = (map, asset) => {
  map.delete(asset);
};
exports.clear = clear;

const compression = (path, AcceptEncoding) => {
  if (compressed.has(extname(path).toLowerCase())) {
    switch (true) {
      case /\bbr\b/.test(AcceptEncoding):
        return path + '.br';
      case /\bgzip\b/.test(AcceptEncoding):
        return path + '.gzip';
      case /\bdeflate\b/.test(AcceptEncoding):
        return path + '.deflate';
    }
  }
  return path;
};
exports.compression = compression;

const create = (timer, callback) => ({
  timer,
  promise: new Promise(callback)
});
exports.create = create;

const fallback = (req, res, next) => () => {
  if (next)
    next(req, res);
  else {
    res.writeHead(404);
    res.end();
  }
};
exports.fallback = fallback;

const favicon = (res, asset, size, headers) => {
  streamFile(res, asset, assign(
    {
      'Content-Type': 'image/vnd.microsoft.icon',
      'Content-Length': size
    },
    headers
  ));
};
exports.favicon = favicon;

const getHeaders = ({headers}) => {
  const {
    ['accept-encoding']: AcceptEncoding,
    ['if-none-match']: ETag,
    ['if-modified-since']: Since
  } = headers;
  return {AcceptEncoding, ETag, Since};
};
exports.getHeaders = getHeaders;

const getPath = source => (
  source[0] === '/' ? source : resolve(source)
);
exports.getPath = getPath;

const getURL = ({url}) => decodeURIComponent(
  url.replace(/\?.*$/, '').replace(/\/$/, '/index.html')
);
exports.getURL = getURL;

const $json = umap(_json);
const json = (asset, timeout = 1000) => (
  $json.get(asset) || $json.set(asset, create(
    timeout && setTimeout(clear, timeout, _json, asset),
    (res, rej) => {
      readFile(asset + '.json', (err, data) => {
        err ? rej(err) : res(parse(data));
      });
    }
  ))
).promise;
exports.json = json;

const serve = (source, cacheTimeout) => {
  const SOURCE = getPath(source);
  return (req, res, next) => {
    const {AcceptEncoding, ETag} = getHeaders(req);
    const asset = SOURCE + compression(getURL(req), AcceptEncoding);
    json(asset, cacheTimeout).then(
      headers => {
        serveFile(res, asset, headers, ETag, true);
      },
      fallback(req, res, next)
    );
  };
};
exports.serve = serve;

const serveFile = (res, asset, headers, ETag, same) => {
  if (same && headers.ETag === ETag) {
    res.writeHead(304, headers);
    res.end();
  }
  else
    streamFile(res, asset, headers);
};
exports.serveFile = serveFile;
