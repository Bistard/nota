import * as eslint from 'eslint';

export = new class CodeNoPlainEnum implements eslint.Rule.RuleModule {

    public readonly meta: eslint.Rule.RuleMetaData = {
        type: "suggestion",
        docs: {
            description: 'Enforce usage of `const enum` instead of `enum`',
            category: "Best Practices",
            recommended: true,
        },
        messages: {
            noPlainEnum: 'Please use `const enum` instead of plain `enum`.',
        },
    };

    public create(context: eslint.Rule.RuleContext): eslint.Rule.RuleListener {
        return {
            ['TSEnumDeclaration']: (node: any): void => {
                if (!node.const) {
                    context.report({
                        node,
                        messageId: 'noPlainEnum',
                    });
                }
            }
        };
    }
};