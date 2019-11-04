const merge = require('webpack-merge');
const common = require('./webpack.common.js');

const PurgecssPlugin = require('purgecss-webpack-plugin');
let glob = require('glob-all');
const path = require('path');


// Custom PurgeCSS extractor for Tailwind that allows special characters in
// class names.
//
// https://github.com/FullHuman/purgecss#extractor
class TailwindExtractor {
  static extract(content) {
    return content.match(/[A-z0-9-:\/]+/g) || []
  }
}

module.exports = merge(common, {
  mode: 'production',
  output: {
    filename: 'bundle.js?[hash]',
    publicPath: './'
  },
  plugins: [
    new PurgecssPlugin({
      // Specify the locations of any files you want to scan for class names.
      paths: glob.sync([
        path.join(__dirname, './src/**/*.vue'),
        path.join(__dirname, './src/index.html')
      ]),
      extractors: [
        {
          extractor: TailwindExtractor,
          // Specify the file extensions to include when scanning for
          // class names.
          extensions: ['html', 'js', 'vue']
        }
      ]
    })
  ]
});
