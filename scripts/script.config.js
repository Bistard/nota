// @ts-check

/**
 * @typedef {Record<string, { 
 *      command: string, 
 *      commandDescription?: string,
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
        command: "node ./scripts/build/build.js",
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
        command: "node ./scripts/tests/mochaRunner.js",
        description: 'Run all the unit tests stores in the files which end with .test.ts under the ./test directory. If any of the tests or suites are marked as `only`, the command will only execute those.\n' +
                      'e.g. Writing `suite.only(\'suite-name\', () => {})` in the source file.',
        options: [
            {
                flags: ['(-g | --grep) <pattern>'],
                descriptions: [
                    'Run all the unit tests that match the regular expression <pattern>.',
                    'For example, `npm run script test -- -g \'z\'` will match any unit tests that contain the letter `z`.',
                ]
            },
            {
                flags: ['--watch'],
                descriptions: [
                    'Build the nota and wait to rebuild by watching the change of the source directory.',
                ],
            }
        ]
    },

    "lint": {
        command: 'eslint . --format=./scripts/linting/formatter.js',
        description: 'The eslint . command runs the ESLint tool on all JavaScript and TypeScript files in the current directory and subdirectories, checking for and reporting any coding errors or stylistic issues based on your configuration rules.',
        options: [
            {
                flags: ['--fix'],
                descriptions: [
                    'Automatically fixes problems that can be fixed without any risk.'
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
        commandDescription: "_gen-icons [path]",
        description: 'The script will try to remove all the prefix of every svg files that are located at <path>, and generate the icon font from svg files using `fantasticon`.\n' +
                     'The svg files are downloaded at: https://www.flaticon.com/uicons/interface-icons',
        options: [
            {
                flags: ['[path]'],
                descriptions: [
                    'The path points to the original svg files. Example: "./assets/src-svg"'
                ]
            },
            {
                flags: ['--removePrefix'],
                descriptions: [
                    'Given a path to the directory that stores the original svg files and remove the prefix names.',
                ]
            },
            {
                flags: ['--force', '-f'],
                descriptions: [
                    'Force the script to regenerate icon files even there is no changes or missing target files.',
                ]
            },
            {
                flags: ['--extra=NewIconName1|NewIconName2'],
                descriptions: [
                    'A way to manually add extra icons even the code section does not use it yet. The caller should provide a list of icon file names seperated by \'|\'. Each name should be in Hanguarian Notation except that the first character should also be capitalized.'
                ]
            }
        ]
    },
}

module.exports = configuration;