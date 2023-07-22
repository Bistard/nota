import * as eslint from 'eslint';


export = new class TestCodeNoOnly implements eslint.Rule.RuleModule {
    
    public readonly meta: eslint.Rule.RuleMetaData = {
        docs: {
            description: 'The purpose of this rule is to prevent the use of `only` methods in test or suite blocks, which is used in testing frameworks Mocha.'
        }
    };
    
    create(context: eslint.Rule.RuleContext): eslint.Rule.RuleListener {
        return {
            ['MemberExpression[object.name=/^(test|suite)$/][property.name="only"]']: (node: any) => {
                return context.report({
                    node,
                    message: '`only` is a dev-time tool and CANNOT be pushed'
                });
            }
        };
    }
};