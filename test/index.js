const {createWriteStream} = require('fs');

const {compression, favicon, serve, getPath, getURL} = require('../cjs');

const response = path => {
  const stream = createWriteStream(path);
  stream.invokes = [];
  stream.writeHead = function () {
    stream.invokes.push(arguments);
  };
  stream.end = function () {
    stream.invokes.push(arguments);
  };
  return stream;
};

let handler = serve(__dirname);

handler(
  {
    url: '/package',
    headers: {}
  },
  {
    writeHead(code, {type}) {
      console.assert(code === 304, 'expected code');
      console.assert(type === 'commonjs', 'expected header');
    },
    end() {
      console.assert(arguments.length < 1, 'no arguments sent');
      console.log('✔ handles 304');
    }
  }
);

handler(
  {
    url: '/nope',
    headers: {}
  },
  {
    writeHead(code) {
      console.assert(code === 404, 'expected code');
    },
    end() {
      console.assert(arguments.length < 1, 'no arguments sent');
      console.log('✔ handles 404');
    }
  }
);

handler(
  {
    url: '/nope',
    headers: {}
  },
  {
  },
  () => {
    console.log('✔ next on 404');
  }
);

handler = serve(__dirname, 100);

handler(
  {
    url: '/package',
    headers: {'if-none-match': 'shenanigans'}
  },
  response(__dirname + '/tmp').on('open', () => {
    console.log('✔ handles 200');
  })
);

handler(
  {
    url: '/favicon.ico',
    headers: {}
  },
  {},
  () => {
    favicon(
      response(__dirname + '/tmp.ico').on('open', () => {
        console.log('✔ handles favicon.ico');
      }),
      __dirname + '/favicon.ico',
      0
    );
  }
);

console.assert(compression('file.txt', 'gzip') === 'file.txt.gzip', 'correct gzip');
console.assert(compression('file.txt', 'deflate') === 'file.txt.deflate', 'correct deflate');
console.assert(compression('file.txt', 'br') === 'file.txt.br', 'correct br');
console.assert(getPath('./test') === __dirname, 'correct path');
console.assert(getURL({url:'/test.js'}) === '/test.js', 'correct URL');
