const path = require('path');
const WebpackBaseConfigurationProvider = require('./webpack/webpack.config.base');
const nodeExternals = require('webpack-node-externals');

/**
 * @description The webpack configuration of the application compilation only
 * for unit testing.
 */
class WebpackUnitTestConfigurationProvider {

    /** @type {string} Current working directory */
    #cwd;
    #minNodeJsVer = '16.7.0';

    constructor(cwd) {
        this.#cwd = cwd;
    }

    // [public - configuration initialization]

    construct() {
        const baseProvider = new WebpackBaseConfigurationProvider();
        baseProvider.checkNodeJsRequirement(this.#minNodeJsVer, process.versions.node);

        const testConfiguration = Object.assign(
            baseProvider.construct({
                
                // only run in development mode
                mode: 'development',
                cwd: this.#cwd,
            }), 
            {
                // make sure running in nodejs environment
                target: 'node',
            },
        );

        // ignore stylesheet loading
        testConfiguration.module.rules.push({
            test: /\.(css|scss|sass)$/,
            loader: path.resolve(this.#cwd, 'scripts/webpack/nullLoader.js'),
        });

        /** 
         * When bundling with Webpack for the backend - you usually don't 
         * want to bundle its `node_modules` dependencies. This library 
         * creates an externals function that ignores `node_modules` when 
         * bundling in Webpack.
         */
        testConfiguration.externals = [nodeExternals()];

        return testConfiguration;
    }
}

// entries
const provider = new WebpackUnitTestConfigurationProvider(process.cwd());
module.exports = provider.construct();