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
    sortedResults.forEach(result => {
        const filePath = result.filePath;
        const messages = result.messages;

        if (messages.length > 0) {
            output += `\n\u001b[4m${filePath}\u001b[0m\n`;

            messages.forEach(message => {
                const { line, column, ruleId, message: description } = message;
                const messageType = message.severity === 1 ? '\x1b[33mWarning\x1b[0m' : '\x1b[31mError\x1b[0m';

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

    return output;
};