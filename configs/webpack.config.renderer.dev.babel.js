/* eslint global-require: off, import/no-dynamic-require: off */

/**
 * Build config for development electron renderer process that uses
 * Hot-Module-Replacement
 *
 * https://webpack.js.org/concepts/hot-module-replacement/
 */

import path from 'path';
import fs from 'fs';
import webpack from 'webpack';
import chalk from 'chalk';
import merge from 'webpack-merge';
import { spawn, execSync } from 'child_process';
import baseConfig from './webpack.config.base';
import CheckNodeEnv from '../internals/scripts/CheckNodeEnv';

CheckNodeEnv('development');

const port = process.env.PORT || 1212;
const publicPath = `http://localhost:${port}/dist`;
const dll = path.join(__dirname, '..', 'dll');
const manifest = path.resolve(dll, 'renderer.json');
const requiredByDLLConfig = module.parent.filename.includes('webpack.config.renderer.dev.dll');

/**
 * Warn if the DLL is not built
 */
if (!requiredByDLLConfig && !(fs.existsSync(dll) && fs.existsSync(manifest))) {
  execSync('npm run build-dll');
}

export default merge.smart(baseConfig, {
  devtool: 'inline-source-map',

  mode: 'development',

  target: 'electron-renderer',

  entry: [
    'react-hot-loader/patch',
    `webpack-dev-server/client?http://localhost:${port}/`,
    'webpack/hot/only-dev-server',
    require.resolve('../app/renderer/index'),
  ],

  output: {
    publicPath: `http://localhost:${port}/dist/`,
    filename: 'renderer.dev.js',
  },
  plugins: [
    requiredByDLLConfig
      ? null
      : new webpack.DllReferencePlugin({
          context: path.join(__dirname, '..', 'dll'),
          manifest: require(manifest),
          sourceType: 'var',
        }),

    new webpack.HotModuleReplacementPlugin({
      multiStep: true,
    }),

    new webpack.NoEmitOnErrorsPlugin(),

    /**
     * Create global constants which can be configured at compile time.
     *
     * Useful for allowing different behaviour between development builds and
     * release builds
     *
     * NODE_ENV should be production so that modules do not perform certain
     * development checks
     *
     * By default, use 'development' as NODE_ENV. This can be overriden with
     * 'staging', for example, by changing the ENV variables in the npm scripts
     */
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development',
    }),

    new webpack.LoaderOptionsPlugin({
      debug: true,
    }),
  ],

  node: {
    __dirname: false,
    __filename: false,
  },

  devServer: {
    port,
    publicPath,
    compress: true,
    noInfo: true,
    stats: 'errors-only',
    inline: true,
    lazy: false,
    hot: true,
    headers: { 'Access-Control-Allow-Origin': '*' },
    contentBase: path.join(__dirname, 'dist'),
    watchOptions: {
      aggregateTimeout: 300,
      ignored: /node_modules/,
      poll: 100,
    },
    historyApiFallback: {
      verbose: true,
      disableDotRule: false,
    },
    before() {
      spawn('npm', ['run', 'start-main-dev'], {
        shell: true,
        env: process.env,
        stdio: 'inherit',
      })
        .on('close', code => process.exit(code))
        .on('error', spawnError => console.error(spawnError));
    },
  },
});
