const CircularDependencyPlugin = require('circular-dependency-plugin');
const { IgnorePlugin } = require('webpack');
const path = require('path');

const cwd = process.cwd();

// check nodejs requirement
checkNodeJsRequirement();

const ENV_MODE = process.env.NODE_ENV ?? 'development';
const IS_DEV = ENV_MODE === 'development';
const IS_WATCH = (process.env.WATCH_MODE == 'true');

// The webpack base configuration for each entry
const baseConfiguration = {
    
    /**
     * Tells webpack to use its built-in optimizations accordingly.
     *      'development' | 'production' | 'none'
     */
    mode: ENV_MODE,

    /**
     * The base directory, an absolute path, for resolving entry points and 
     * loaders from the configuration.
     */
    context: cwd,

    // Node.js options whether to polyfill or mock certain Node.js globals.
    node: {
        // The dirname of the input file relative to the `context`.
        __dirname: true,
    },

    /**
     * These options determine how the different types of modules within a 
     * project will be treated.
     */
    module: {

        rules: [
            // compile TypeScript files into JavaScript files
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
            },
            // allows Nnode.js module to be used in the browser environment
            {
                test: /.node$/,
                loader: 'node-loader',
            },
            // // compiles SCSS to CSS
            // {
            //     test: /\.scss$/,
            //     use: 'sass-loader',
            // }
        ]
    },

    // These options change how modules are resolved
    resolve: {
        
        // Create aliases to import or require modules.
        alias: {
            src: path.resolve(cwd, 'src/'),
            // Ensure testing utility code is forbidden when in product mode
            test: IS_DEV ? path.resolve(cwd, 'test/') : undefined,
        },
        
        extensions: ['.tsx', '.ts', '.js'],
    },

    // watch options
    watch: IS_WATCH,
    watchOptions: {
        poll: 1000, // check for changes in milliseconds.
        aggregateTimeout: 500, // aggregates any changes during the period into one rebuild.
        ignored: /node_modules/,
    },

    /**
     * Source maps are used to display your original JavaScript while debugging, 
     * which is a lot easier to look at than minified production code.
     * See more choice here https://webpack.js.org/configuration/devtool/
     */
    devtool: IS_DEV ? 'eval-source-map' : 'source-map',
    stats: 'normal',
    bail: !IS_WATCH,

    // webpack extensions
    plugins: getPlugins({ circular: process.env.CIRCULAR === 'true' }),
};

// entries
module.exports = [
    Object.assign({}, baseConfiguration, {
        target: 'electron-main',
        entry: {
            main: './src/main.js',
        },
        output: {
            filename: '[name]-bundle.js',
            path: path.resolve(cwd, './dist')
        },
    }),
    Object.assign({}, baseConfiguration, {
        target: 'electron-renderer',
        entry: {
            renderer: './src/code/browser/renderer.ts',
        },
        output: {
            filename: '[name]-bundle.js',
            path: path.resolve(cwd, './dist')
        },
    }),
    Object.assign({}, baseConfiguration, {
        target: 'electron-renderer',
        entry: {
            renderer: './src/code/browser/lookup/browser.lookup.ts',
        },
        output: {
            filename: '[name]-lookup-bundle.js',
            path: path.resolve(cwd, './dist')
        },
    }),
];

// [configuration helpers]

function checkNodeJsRequirement() {
    const requiredNodeJsVersion = '16.7.0'.split('.');
    const currNodeJsVersion = process.versions.node.split('.');
    for (let i = 0; i < currNodeJsVersion.length; i++) {
        if (Number(currNodeJsVersion[i]) >= Number(requiredNodeJsVersion[i])) {
            continue;
        }

        const err = new Error('Node.js version requires at least v16.7.0.');
        err.stack = undefined;
        throw err;
    }
}

// [plugins]

function getPlugins(opts) {
    const plugins = [...getOptionalPlugins()];
    
    const MAX_CYCLES = 3;
    let detectedCycleCount = 0;

    // circular dependency plugin
    if (opts && opts.circular) {
        plugins.push(new CircularDependencyPlugin(
            {
                exclude: /a\.js|node_modules/,
                include: /src/,
                cwd: cwd,
                // `onStart` is called before the cycle detection starts
                onStart({ _compilation }) {
                console.log('start detecting webpack modules cycles');
                },
                // `onDetected` is called for each module that is cyclical
                onDetected({ module: _webpackModuleRecord, paths, compilation }) {
                    // `paths` will be an Array of the relative module paths that make up the cycle
                    // `module` will be the module record generated by webpack that caused the cycle
                    detectedCycleCount++;
                    console.log(`detecting webpack modules cycle:\n${paths.join(' -> ')}`);
                    compilation.warnings.push(new Error(paths.join(' -> ')));
                },
                // `onEnd` is called before the cycle detection ends
                onEnd({ compilation }) {
                    console.log('end detecting webpack modules cycles');
                    if (detectedCycleCount > MAX_CYCLES) {
                        compilation.errors.push(new Error(`Detected ${detectedCycleCount} cycles which exceeds configured limit of ${MAX_CYCLES}`));
                    }
                },
            }
        ));
    }
    
    return plugins;
}

function getOptionalPlugins() {
    const plugins = [];

    // https://github.com/paulmillr/chokidar/issues/828
    if (process.platform !== "darwin") {
        plugins.push(
            new IgnorePlugin({ resourceRegExp: /^fsevents$/, })
        );
    }

    return plugins;
}