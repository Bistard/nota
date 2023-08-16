import * as eslint from 'eslint';

const SERVICE_MARKER_PROPERTY = '_serviceMarker';

export = new class CodeServiceMarker implements eslint.Rule.RuleModule {

	public readonly meta: eslint.Rule.RuleMetaData = {
		type: 'problem',
        docs: {
            description: `Ensure the ${SERVICE_MARKER_PROPERTY} property is of type undefined.`,
            category: 'Best Practices',
            recommended: true,
        },
        fixable: 'code',
        schema: []  // No configuration options
	};

	public create(context: eslint.Rule.RuleContext): eslint.Rule.RuleListener {
		return {
			PropertyDefinition(node: any) {
                if (node.key.type === 'Identifier' && 
                    node.key.name === SERVICE_MARKER_PROPERTY && 
                    (node.value || !node.declare)
				) {
                    return context.report({
                        node,
                        message: `The '${SERVICE_MARKER_PROPERTY}' property must be declared using the 'declare' keyword and be of type 'undefined'.`,
                        fix: (fixer) => {
                            return fixer.replaceText(node, `declare ${SERVICE_MARKER_PROPERTY}: undefined;`);
                        }
                    });
                }
            }
		};
	}
};
