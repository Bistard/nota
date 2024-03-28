const path = require('path');
const fs = require('fs');
const currPath = __dirname;

/*******************************************************************************
 * This is a file that runs every `benchmark.js` from the child directories. 
 * This file will be executed through the script in the `package.json`.
 ******************************************************************************/

// Reads all the name of sub-directories.
const allBenchmarkDirName = (fs.readdirSync(currPath, { withFileTypes: true })
    .filter(source => source.isDirectory())
    .map(source => source.name)
);

// Requires all the `benchmark.js` from these sub-directories.
for (const dirName of allBenchmarkDirName) {
    const filePath = path.join(currPath, dirName, 'benchmark.js');
    require(filePath);
}
