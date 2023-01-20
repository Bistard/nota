// @ts-check

/**
 * @typedef {Record<string, { command: string, description: string }>} ScriptConfiguration
 */

/** 
 * @description An object that describes all the valid scripts in the project.
 * @type {ScriptConfiguration} 
 */
const configuration = {
    
    "run": {
        command: "electron .",
        description: 'Run Nota.'
    },

    "_run": {
        command: "electron . --- --log=trace --open-devtools",
        description: 'Run Nota in develop mode.'
    },

    "build": {
        command: "node ./scripts/build.js",
        description: 'Build the Nota.'
    },

    "watch": {
        command: "npm run build --- --watch=true --circular=false",
        description: 'Build the Nota and wait to rebuild by watching the change of the source directory.'
    },

    "start": {
        command: "npm run build && electron .",
        description: 'Build nota and run Nota.'
    },

    "_start": {
        command: "npm start --- --log=trace --open-devtools",
        description: 'Build nota and run Nota in develop mode.'
    },

    "test": {
        command: "mocha --ui tdd -r jsdom-global/register --config '.mocharc.jsonc' --timeout 10000",
        description: 'Run all the unit test files that end with .test.ts which lies in the ./test directory.'
    },

    "_test": {
        command: "mocha --ui tdd -r jsdom-global/register --config 'test/.mocharc.jsonc'",
        description: 'Run all the unit test files that end with .dev.test.ts which lies in the ./test directory. Useful when completing a unfinished unit test file.'
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