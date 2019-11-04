const merge = require('webpack-merge');
const common = require('./webpack.common.js');

const path = require('path');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-source-map',
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    port: 8081,
    historyApiFallback: true,
    disableHostCheck: true,
    host: '0.0.0.0'
  },

  output: {
    filename: 'bundle.js?[hash]',
    publicPath: '/'
  },
});
