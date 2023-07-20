import * as eslint from 'eslint';


export = new class TestCodeNoOnly implements eslint.Rule.RuleModule {
    
    public readonly meta: eslint.Rule.RuleMetaData = {
        docs: {
            description: 'Make sure' // TODO
        }
    };
    
    create(context: eslint.Rule.RuleContext): eslint.Rule.RuleListener {
        return {
            ['MemberExpression[object.name=/^(test|suite)$/][property.name="only"]']: (node: any) => {
                return context.report({
                    node,
                    message: '`only` is a dev-time tool and CANNOT be pushed.'
                });
            }
        };
    }
};