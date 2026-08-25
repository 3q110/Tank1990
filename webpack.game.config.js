const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  entry: './src/game.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'game.js',
    // 微信小游戏需要 IIFE 格式，不能用 eval
    libraryTarget: 'commonjs',
    globalObject: 'GameGlobal',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              compilerOptions: {
                module: 'esnext',
                target: 'es2015',
                moduleResolution: 'node',
              },
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.TARO_ENV': JSON.stringify('game'),
    }),
  ],
  // 微信小游戏环境：禁用 eval，使用 source-map 文件
  devtool: 'source-map',
  // 不打包 wx 对象（小游戏全局对象）
  externals: {
    wx: 'commonjs wx',
  },
  optimization: {
    // 保持模块结构清晰，避免过度压缩导致调试困难
    minimize: true,
  },
};
