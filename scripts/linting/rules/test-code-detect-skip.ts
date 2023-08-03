import * as eslint from 'eslint';


export = new class TestCodeDetectSkip implements eslint.Rule.RuleModule {
    
    public readonly meta: eslint.Rule.RuleMetaData = {
        docs: {
            description: 'The purpose of this rule is to detect the use of `skip` methods in test or suite blocks, which is used in testing frameworks Mocha.'
        }
    };
    
    public create(context: eslint.Rule.RuleContext): eslint.Rule.RuleListener {
        return {
            ['MemberExpression[object.name=/^(test|suite)$/][property.name="skip"]']: (node: any) => {
                return context.report({
                    node,
                    message: 'A `skip` has been detected and needs attention for correction'
                });
            }
        };
    }
};