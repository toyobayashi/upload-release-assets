const config: import('@tybys/ty').Configuration = {
  target: 'node',
  terserPlugin: {
    terserOptions: {
      output: {
        comments: false
      }
    }
  },
  configureWebpack: {
    node (config) {
      config.externals = []
    }
  }
}

export default config
