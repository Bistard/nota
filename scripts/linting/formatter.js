module.exports = function (results) {

    // sort results by the presence of errors (files with errors stay at the bottom)
    const sortedResults = results.sort((a, b) => {
        if (a.errorCount > 0 && b.errorCount === 0) {
            return 1;
        }

        if (a.errorCount === 0 && b.errorCount > 0) {
            return -1;
        }

        return 0;
    });

    // generate output message
    let output = '';
    let totalErrors = 0;
    let totalWarnings = 0;
    let totalFixableErrors = 0;
    let totalFixableWarnings = 0;

    sortedResults.forEach(result => {
        const filePath = result.filePath;
        const messages = result.messages;

        if (messages.length > 0) {
            output += `\n\u001b[4m${filePath}\u001b[0m\n`;

            messages.forEach(message => {
                const { line, column, ruleId, message: description, severity, fix } = message;
                const messageType = severity === 1 ? '\x1b[33mWarning\x1b[0m' : '\x1b[31mError\x1b[0m';

                if (severity === 1) {
                    totalWarnings++;
                    if (fix) {
                        totalFixableWarnings++;
                    }
                } else if (severity === 2) {
                    totalErrors++;
                    if (fix) {
                        totalFixableErrors++;
                    }
                }

                const lineColumn = `${line}:${column}`;
                const formattedMessage = `${messageType.padEnd(18)} ${description}`;
                const formattedRuleId = ruleId;

                output += `\x1b[2m${lineColumn.padEnd(10)}\x1b[0m`;
                output += `\x1b[1m${formattedMessage.padEnd(80)}\x1b[0m`;
                output += `\x1b[2m${formattedRuleId}\x1b[0m`;
                output += '\n';
            });
        }
    });

    output += `\n\u001b[4m\u001b[1mTotal:\u001b[0m\u001b[0m \x1b[31m${totalErrors} errors\x1b[0m, \x1b[33m${totalWarnings} warnings\x1b[0m`;
    output += `\n\u001b[4m\u001b[1mPotentially fixable with the '--fix' option:\u001b[0m\u001b[0m \x1b[32m${totalFixableErrors} errors\x1b[0m, \x1b[32m${totalFixableWarnings} warnings\x1b[0m\n`;

    return output;
};
