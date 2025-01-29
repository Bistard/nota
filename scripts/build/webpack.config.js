const path = require('path');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { KeyToIndexTransformPlugin } = require('../i18n/i18n.plugin');
const WebpackBaseConfigurationProvider = require('../webpack/webpack.config.base');
const { ScriptHelper, log } = require('../utility');
const { SUPPORT_LOCALIZATION_LIST } = require('../i18n/localization');
const { SpinnerPlugin } = require('./spinner.plugin');

class WebpackPluginProvider {
    constructor() {}

    /**
     * @param {{
    *      cwd: string;
    *      circular?: boolean;
    * } | undefined} opts 
    */
    getPlugins(opts) {
        const plugins = [];
        const cwd = opts.cwd;

        if (!cwd || typeof cwd !== 'string') {
            log('error', `[WebpackPluginProvider] CWD is not provided or provided with wrong type: '${typeof cwd}'!`);
        }

        /**
         * mini-css-extract plugin
         * 
         * This plugin extracts CSS into separate files. It creates a CSS file per 
         * JS file which contains CSS. It supports On-Demand-Loading of CSS and 
         * SourceMaps.
         */
        plugins.push(new MiniCssExtractPlugin({
            filename: 'index.css',
        }));

        const MAX_CYCLES = 0;
        let detectedCycleCount = 0;

        if (opts && opts.circular) {
            plugins.push(
                new CircularDependencyPlugin({
                    exclude: /a\.js|node_modules/,
                    include: /src/,
                    cwd: cwd,
                    failOnError: true,
                    allowAsyncCycles: false,

                    // `onStart` is called before the cycle detection starts
                    onStart({ _compilation }) {
                        log('info', 'start detecting webpack modules cycles');
                    },

                    // `onDetected` is called for each module that is cyclical
                    onDetected({ module: _webpackModuleRecord, paths, compilation }) {
                        // `paths` will be an Array of the relative module paths that make up the cycle
                        // `module` will be the module record generated by webpack that caused the cycle
                        detectedCycleCount++;
                        log('error', `detecting webpack modules cycle:\n${paths.join(' -> ')}`);
                        compilation.warnings.push(new Error(paths.join(' -> ')));
                    },

                    // `onEnd` is called before the cycle detection ends
                    onEnd({ compilation }) {
                        log('info', 'end detecting webpack modules cycles');
                        if (detectedCycleCount > MAX_CYCLES) {
                            compilation.errors.push(new Error(`Detected ${detectedCycleCount} cycles which exceeds configured limit of ${MAX_CYCLES}`));
                        }
                    },
                })
            );
        }

        return plugins;
    }
}

/**
 * @description The general webpack configuration of the application compilation.
 */
class WebpackConfigurationProvider extends WebpackBaseConfigurationProvider {
    #distPath = './dist';
    #minNodeJsVer = '16.7.0';

    /** @type {string} Current working directory */
    #cwd;

    /** @type {string} environment mode */
    #buildMode;
    #isWatchMode;
    #isCircular;
    #i18n_error;

    constructor(cwd) {
        super();
        this.#cwd = cwd;

        /** @type {['BUILD_MODE', 'WATCH_MODE', 'CIRCULAR']} */
        const envList = ['BUILD_MODE', 'WATCH_MODE', 'CIRCULAR', 'i18n_error'];
        const env = ScriptHelper.getEnv(envList);

        // TODO: elegant print (this line is too long)
        log('info', `Webpack environments: ${JSON.stringify(env)}`);

        // init environment constant
        this.#buildMode   = env.BUILD_MODE;
        this.#isWatchMode = env.WATCH_MODE == 'true';
        this.#isCircular  = env.CIRCULAR == 'true';
        this.#i18n_error  = env.i18n_error == 'true';
    }

    // [public - configuration initialization]
    construct() {
        this.checkNodeJsRequirement(this.#minNodeJsVer, process.versions.node);

        // base configuration
        const baseConfiguration = Object.assign(
            {},
            super.construct({
                mode: this.#buildMode,
                cwd: this.#cwd,
                watchMode: this.#isWatchMode,
                plugins: [...new WebpackPluginProvider().getPlugins({
                    cwd: this.#cwd,
                    circular: this.#isCircular,
                })],
            })
        );

        // base renderer configuraition
        const baseRendererConfiguration = Object.assign(
            {},
            baseConfiguration
        );
        // compiles SCSS files to CSS files
        baseRendererConfiguration.module.rules.push({
            test: /\.(css|scss|sass)$/,
            use: [
                MiniCssExtractPlugin.loader,
                'css-loader',
                {
                    loader: 'sass-loader',
                    options: {
                        sassOptions: {
                            includePaths: [path.resolve(this.#cwd, 'src/')],
                            
                            /**
                             * @see https://github.com/sass/dart-sass/issues/2352
                             * @see https://github.com/nolimits4web/swiper/issues/7771
                             */
                            silenceDeprecations: ['legacy-js-api', 'import'],
                        },
                    },
                },
            ],
        });

        return [
            this.#constructInspectorProcess(Object.assign({}, baseRendererConfiguration)),
            this.#constructRendererProcess(Object.assign({}, baseRendererConfiguration)),
            this.#constructMainProcess(Object.assign({}, baseConfiguration)),
        ];
    }

    #constructMainProcess(baseConfiguration) {
        return Object.assign(baseConfiguration, {
            target: 'electron-main',
            entry: { main: './src/main.js' },
            output: {
                filename: '[name]-bundle.js',
                path: path.resolve(this.#cwd, this.#distPath),
            },
            plugins: [
                ...baseConfiguration.plugins, 
                new SpinnerPlugin({ processType: 'main process' }),
            ]
        });
    }

    #constructRendererProcess(baseConfiguration) {
        return Object.assign(baseConfiguration, {
            target: 'electron-renderer',
            entry: { renderer: './src/code/browser/renderer.desktop.ts' },
            output: {
                filename: '[name]-bundle.js',
                path: path.resolve(this.#cwd, this.#distPath),
            },
            plugins: [
                ...baseConfiguration.plugins, 
                new SpinnerPlugin({ processType: 'renderer process' }),
                new KeyToIndexTransformPlugin({
                    logLevel: this.#i18n_error === true ? 'error' : 'warn',
                    sourceCodePath: path.resolve(this.#cwd, './src'),
                    localeOutputPath: path.resolve(this.#cwd, './assets/locale'),
                    localizationFileName: 'en.json',
                    lookupFileName: 'en_lookup_table.json',
                    otherLocales: SUPPORT_LOCALIZATION_LIST
                }),
            ]
        });
    }

    #constructInspectorProcess(baseConfiguration) {
        return Object.assign(baseConfiguration, {
            target: 'electron-renderer',
            entry: { renderer: './src/code/browser/inspector/renderer.inspector.ts' },
            output: {
                filename: '[name]-inspector-bundle.js',
                path: path.resolve(this.#cwd, this.#distPath),
            },
            plugins: [
                ...baseConfiguration.plugins, 
                new SpinnerPlugin({ processType: 'renderer process (inspector)' }),
            ]
        });
    }
}

// entries
ScriptHelper.init('webpack');
const provider = new WebpackConfigurationProvider(process.cwd());
module.exports = provider.construct();
