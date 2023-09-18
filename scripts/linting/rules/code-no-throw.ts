import * as eslint from 'eslint';

export = new class CodeNoThrow implements eslint.Rule.RuleModule {

    public readonly meta: eslint.Rule.RuleMetaData = {
        type: 'problem',
        docs: {
            description: 'Prevent the use of the throw keyword',
            category: 'Possible Errors',
            recommended: true,
        },
        messages: {
            noThrow: 'Throwing exceptions is not allowed. Use `Result` or `panic` instead.',
        },
    };

    public create(context: eslint.Rule.RuleContext): eslint.Rule.RuleListener {
        return {
            ThrowStatement(node: any) {
                context.report({
                    node,
                    messageId: 'noThrow',
                });
            },
        };
    }
};
