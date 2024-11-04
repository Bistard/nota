const glob = require('glob');
const path = require('path');
require('ts-node').register({ experimentalResolver: true, transpileOnly: true });

// Re-export all `.ts` files as rules recursively
const rules = {};
glob.sync(`${__dirname}/**/*.ts`) // Adjusted the glob pattern to include subdirectories
	.forEach((file) => {
		rules[path.basename(file, '.ts')] = require(file);
	});

exports.rules = rules;