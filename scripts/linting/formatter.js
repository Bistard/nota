module.exports = function (results) {

    // Sort results by message type: errors first, then warnings
    const sortedResults = results.sort((a, b) => {
        if (a.errorCount > 0 && b.warningCount > 0) {
            return -1;
        }

        if (a.warningCount > 0 && b.errorCount > 0) {
            return 1;
        }

        return 0;
    });

    // generate output message
    let output = '';
    sortedResults.forEach(result => {
        const filePath = result.filePath;
        const messages = result.messages;

        if (messages.length > 0) {
            output += `\n${filePath}\n`;

            messages.forEach(message => {
                const { line, column, ruleId, message: description } = message;
                const messageType = message.severity === 1 ? '\x1b[33mWarning\x1b[0m' : '\x1b[31mError\x1b[0m';
                const config = `\x1b[2m${ruleId}\x1b[0m`;

                output += `\x1b[2mLine ${line}, Column ${column}:\x1b[0m `;
                output += `\x1b[1m${messageType}:\x1b[0m ${description} `;
                output += `\x1b[2mConfiguration:\x1b[0m ${config}`;
                output += '\n';
            });
        }
    });

    return output;
};