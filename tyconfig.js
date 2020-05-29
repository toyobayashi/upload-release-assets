module.exports = {
  target: 'node',
  configureWebpack: {
    node (config) {
      config.externals = []
    }
  }
}
