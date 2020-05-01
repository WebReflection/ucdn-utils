import {createReadStream, readFile} from 'fs';
import {extname, join, resolve} from 'path';

import umap from 'umap';

import compressed from './compressed.js';

const {parse} = JSON;
const {assign} = Object;

const streamFile = (res, asset, headers) => {
  res.writeHead(200, headers);
  createReadStream(asset).pipe(res);
};

export const _json = new Map;

export const clear = (map, asset) => {
  map.delete(asset);
};

export const compression = (path, AcceptEncoding) => {
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

export const create = (timer, callback) => ({
  timer,
  promise: new Promise(callback)
});

export const fallback = (req, res, next) => () => {
  if (next)
    next(req, res);
  else {
    res.writeHead(404);
    res.end();
  }
};

export const favicon = (res, asset, size, headers) => {
  streamFile(res, asset, assign(
    {
      'Content-Type': 'image/vnd.microsoft.icon',
      'Content-Length': size
    },
    headers
  ));
};

export const getHeaders = ({headers}) => {
  const {
    ['accept-encoding']: AcceptEncoding,
    ['if-none-match']: ETag,
    ['if-modified-since']: Since
  } = headers;
  return {AcceptEncoding, ETag, Since};
};

export const getPath = source => (
  source[0] === '/' ? source : resolve(source)
);

export const getURL = ({url}) => decodeURIComponent(url.replace(/\?.*$/, ''));

const $json = umap(_json);
export const json = (asset, timeout = 1000) => (
  $json.get(asset) || $json.set(asset, create(
    timeout && setTimeout(clear, timeout, _json, asset),
    (res, rej) => {
      readFile(asset + '.json', (err, data) => {
        err ? rej(err) : res(parse(data));
      });
    }
  ))
).promise;

export const serve = (source, cacheTimeout) => {
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

export const serveFile = (res, asset, headers, ETag, same) => {
  if (same && headers.ETag === ETag) {
    res.writeHead(304, headers);
    res.end();
  }
  else
    streamFile(res, asset, headers);
};
