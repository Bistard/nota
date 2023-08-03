import * as eslint from 'eslint';

export = new class CodeInterfaceCheck implements eslint.Rule.RuleModule {
    
    public readonly meta: eslint.Rule.RuleMetaData = {
        type: 'suggestion',
        docs: {
            description: 'Interface name must start with a capital "I", followed by another uppercase letter.',
            category: 'Stylistic Issues',
            recommended: true,
        },
        schema: [],  // no options
        messages: {
            incorrectInterfaceName: 'Interface name must start with a capital "I", followed by another uppercase letter.',
        },
    };

    public create(context: eslint.Rule.RuleContext) {
        return {
            ['TSInterfaceDeclaration']: (node: any) => {
                if (!/^I[A-Z]/.test(node.id.name)) {
                    context.report({
                        node,
                        messageId: 'incorrectInterfaceName',
                    });
                }
            },
        };
    }
};
