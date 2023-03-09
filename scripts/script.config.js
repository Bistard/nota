// @ts-check

/**
 * @typedef {Record<string, { 
 *      command: string, 
 *      description: string, 
 *      options?: { flags: string[], descriptions: string[] }[]
 * }>} ScriptConfiguration
 */

/** 
 * @description An object that describes all the valid scripts in the project.
 * @type {ScriptConfiguration} 
 */
const configuration = {
    
    "run": {
        command: "electron . --- --log=info",
        description: 'Run nota.'
    },

    "_run": {
        command: "electron . --- --log=trace --open-devtools",
        description: 'Run nota in develop mode.'
    },

    "build": {
        command: "node ./scripts/build.js",
        description: 'Build the nota.',
        options: [
            {
                flags: ['--watch', '-w'],
                descriptions: [
                    'Turn on watch mode. This means that after the initial build, webpack will continue to watch for changes in any of the resolved files.',
                    'default = false.',
                ]
            },
            {
                flags: ['--circular', '-c'], 
                descriptions: [
                    'Turn on the dependency circular check. It will start detecting any direct or indirect circular dependencies amoung all the used modules.',
                    'default = true.',
                ]
            },
        ]
    },

    "watch": {
        command: "npm run script build -- --watch=true --circular=false",
        description: 'Build the nota and wait to rebuild by watching the change of the source directory.'
    },

    "start": {
        command: "npm run script build && electron .",
        description: 'Build nota and run nota.',
        options: [
            {
                flags: ['--log=<level>'],
                descriptions: [
                    'Sets the logging level of the application, the <level> can be either "trace", "debug", "info", "warn", "error", "fatal".',
                    'default = info.',
                ]
            },
            {
                flags: ['--open-devtools'],
                descriptions: [
                    'Open a developer tool along with every window.',
                    'default = false.',
                ]
            }
        ]
    },

    "_start": {
        command: "npm run script start -- --log=trace --open-devtools",
        description: 'Build nota and run nota in develop mode.'
    },

    "test": {
        command: "mochapack --webpack-config ./scripts/webpack.config.test.js \"test/**/*.test.ts\" --ui tdd -r jsdom-global/register --timeout 10000",
        description: 'Run all the unit tests stores in the files which end with .test.ts under the ./test directory.\n' +
                      'If any of the tests or suites are marked as `only`, the command will only execute those.\n' +
                      'e.g. Writing `suite.only(\'suite-name\', () => {})` in the source file.',
        options: [
            {
                flags: ['(-g | --grep) <pattern>'],
                descriptions: [
                    'Run all the unit tests that match the regular expression <pattern>.',
                    'For example, `npm run script test -- -g \'z\'` will match any unit tests that contain the letter `z`.',
                ]
            }
        ]
    },

    "benchmark": {
        command: "node benchmark/benchmark.js",
        description: 'Run the benchmark tests.'
    },

    "_gen-icons": {
        command: "node ./scripts/icon.js",
        description: 'Regenerate the icon files.'
    },
}

module.exports = configuration;