const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = {
  transpileDependencies: [
    '@aeternity'
  ],
  // added file-loader
  chainWebpack: config => {
    config.plugin('polyfills').use(NodePolyfillPlugin)

    // .aes loader
    config.module
      .rule('aes')
      .test(/\.aes$/)
      .use('raw-loader')
      .loader('raw-loader')
      .end()
  }

}
