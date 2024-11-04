import * as eslint from 'eslint';

export = new class CodeNoJsonStringify implements eslint.Rule.RuleModule {

    public readonly meta: eslint.Rule.RuleMetaData = {
        type: 'problem',
        docs: {
            description: 'Prevent the use of JSON.stringify',
            category: 'Possible Errors',
            recommended: true,
        },
        messages: {
            noJsonStringify: 'Using "JSON.stringify" might lead to overlooked error handling. Consider using "Strings.stringifySafe".',
        },
    };

    public create(context: eslint.Rule.RuleContext): eslint.Rule.RuleListener {
        return {
            CallExpression(node: any) {
                const callee = node.callee;
                if (callee.type === 'MemberExpression' &&
                    callee.object.name === 'JSON' &&
                    callee.property.name === 'stringify') {
                    context.report({
                        node,
                        messageId: 'noJsonStringify',
                    });
                }
            },
        };
    }
};
