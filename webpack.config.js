const CircularDependencyPlugin = require('circular-dependency-plugin');
const path = require('path');

const __MAX_CYCLES = 3;
let cycleCount = 0;

let common_config = {
    node: {
        __dirname: true
    },
    mode: process.env.ENV || 'development',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: [
                    /node_modules/,
                    // path.resolve(__dirname, "src/ui")
                ]
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        alias: {
            src: path.resolve(__dirname, 'src/')
        },
    },
    plugins: [
        new CircularDependencyPlugin({
            
            // `onStart` is called before the cycle detection starts
            onStart({ _compilation }) {
              console.log('start detecting webpack modules cycles');
            },
            
            // `onDetected` is called for each module that is cyclical
            onDetected({ module: _webpackModuleRecord, paths, compilation }) {
                // `paths` will be an Array of the relative module paths that make up the cycle
                // `module` will be the module record generated by webpack that caused the cycle
                cycleCount++;
                // compilation.errors.push(new Error(paths.join(' -> ')))
                compilation.warnings.push(new Error(paths.join(' -> ')));
            },
            
            // `onEnd` is called before the cycle detection ends
            onEnd({ compilation }) {
                console.log('end detecting webpack modules cycles');
                if (cycleCount > __MAX_CYCLES) {
                    compilation.errors.push(new Error(
                        `Detected ${cycleCount} cycles which exceeds configured limit of ${__MAX_CYCLES}`
                    ));
                }
            },
          })
      ]
};

module.exports = [
    Object.assign({}, common_config, {
        target: 'electron-main',
        entry: {
            main: './src/code/electron-main/main.ts',
        },
        output: {
            filename: '[name]-bundle.js',
            path: path.resolve(__dirname, './dist')
        },
    }),
    Object.assign({}, common_config, {
        target: 'electron-renderer',
        entry: {
            renderer: './src/code/browser/browser.ts',
        },
        output: {
            filename: '[name]-bundle.js',
            path: path.resolve(__dirname, './dist')
        },
    }),
    
]
