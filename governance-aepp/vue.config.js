module.exports = {
  transpileDependencies: [
    '@aeternity'
  ],
  // added file-loader
  chainWebpack: config => {
    // .aes loader
    config.module
      .rule('aes')
      .test(/\.aes$/)
      .use('raw-loader')
      .loader('raw-loader')
      .end()
  }

}
