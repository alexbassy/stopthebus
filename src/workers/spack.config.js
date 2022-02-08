module.exports = {
  entry: {
    web: __dirname + '/index.ts',
  },
  output: {
    path: __dirname + '/dist',
    name: 'worker.js',
  },
}
