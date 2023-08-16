import * as eslint from 'eslint';
import { AST_TOKEN_TYPES } from './utils/astTokenType';
import { AST_NODE_TYPES } from './utils/astNodeType';
import { getNameFromMember } from './utils/common';

type AccessibilityLevel =
	| 'explicit' // require an accessor (including public)
	| 'no-public' // don't require public
	| 'off'; // don't check

interface IConfig {
	accessibility?: AccessibilityLevel;
	ignoredMethodNames?: string[];
	ignoredPropertyNames?: string[];
	overrides?: {
		accessors?: AccessibilityLevel;
		constructors?: AccessibilityLevel;
		methods?: AccessibilityLevel;
		properties?: AccessibilityLevel;
		parameterProperties?: AccessibilityLevel;
	};
}

export = new class ExplicitMemberAccessibility implements eslint.Rule.RuleModule {

	public readonly meta: eslint.Rule.RuleMetaData = {
		hasSuggestions: true,
		type: 'problem',
		docs: {
			description:
				'Require explicit accessibility modifiers on class properties and methods',
			// too opinionated to be recommended
		},
		fixable: 'code',
		messages: {
			missingAccessibility:
				'Missing accessibility modifier on {{type}} {{name}}.',
			unwantedPublicAccessibility:
				'Public accessibility modifier on {{type}} {{name}}.',
			addExplicitAccessibility: "Add '{{ type }}' accessibility modifier",
		},
		schema: [
			{
				$defs: {
					accessibilityLevel: {
						oneOf: [
							{
								type: 'string',
								enum: ['explicit'],
								description: 'Always require an accessor.',
							},
							{
								type: 'string',
								enum: ['no-public'],
								description: 'Require an accessor except when public.',
							},
							{
								type: 'string',
								enum: ['off'],
								description: 'Never check whether there is an accessor.',
							},
						],
					},
				},
				type: 'object',
				properties: {
					accessibility: { $ref: '#/items/0/$defs/accessibilityLevel' },
					overrides: {
						type: 'object',
						properties: {
							accessors: { $ref: '#/items/0/$defs/accessibilityLevel' },
							constructors: { $ref: '#/items/0/$defs/accessibilityLevel' },
							methods: { $ref: '#/items/0/$defs/accessibilityLevel' },
							properties: { $ref: '#/items/0/$defs/accessibilityLevel' },
							parameterProperties: {
								$ref: '#/items/0/$defs/accessibilityLevel',
							},
						},

						additionalProperties: false,
					},
					ignoredMethodNames: {
						type: 'array',
						items: {
							type: 'string',
						},
					},
					ignoredPropertyNames: {
						type: 'array',
						items: {
							type: 'string',
						},
					},
				},
				additionalProperties: false,
			},
		],
	};

	public create(context: eslint.Rule.RuleContext): eslint.Rule.RuleListener {
		const options: IConfig = context.options[0];
		
		const sourceCode = context.getSourceCode();
		const baseCheck: AccessibilityLevel = options.accessibility ?? 'explicit';
		const overrides = options.overrides ?? {};
		const ctorCheck = overrides.constructors ?? baseCheck;
		const accessorCheck = overrides.accessors ?? baseCheck;
		const methodCheck = overrides.methods ?? baseCheck;
		const propCheck = overrides.properties ?? baseCheck;
		const paramPropCheck = overrides.parameterProperties ?? baseCheck;
		const ignoredMethodNames = new Set(options.ignoredMethodNames ?? []);
		const ignoredPropertyNames = new Set(options.ignoredPropertyNames ?? []);

		/**
		 * Checks if a method declaration has an accessibility modifier.
		 */
		const checkMethodAccessibilityModifier = (node: any): void => {
			if (node.key.type === AST_NODE_TYPES.PrivateIdentifier) {
				return;
			}

			let nodeType = 'method definition';
			let check = baseCheck;
			switch (node.kind) {
				case 'method':
					check = methodCheck;
					break;
				case 'constructor':
					check = ctorCheck;
					break;
				case 'get':
				case 'set':
					check = accessorCheck;
					nodeType = `${node.kind} property accessor`;
					break;
			}

			const { name: methodName } = getNameFromMember(
				node,
				sourceCode,
			);

			if (check === 'off' || ignoredMethodNames.has(methodName)) {
				return;
			}

			if (
				check === 'no-public' &&
				node.accessibility === 'public'
			) {
				context.report({
					node: node,
					messageId: 'unwantedPublicAccessibility',
					data: {
						type: nodeType,
						name: methodName,
					},
					fix: getUnwantedPublicAccessibilityFixer(node),
				});
			} else if (check === 'explicit' && !node.accessibility) {
				context.report({
					node: node,
					messageId: 'missingAccessibility',
					data: {
						type: nodeType,
						name: methodName,
					},
					suggest: getMissingAccessibilitySuggestions(node),
				});
			}
		};

		/**
		 * Creates a fixer that removes a "public" keyword with following spaces
		 */
		const getUnwantedPublicAccessibilityFixer = (node: any): any => {
			return function (fixer: any): any {
				const tokens = sourceCode.getTokens(node);
				let rangeToRemove: any;
				for (let i = 0; i < tokens.length; i++) {
					const token = tokens[i];
					if (
						token.type === AST_TOKEN_TYPES.Keyword &&
						token.value === 'public'
					) {
						const commensAfterPublicKeyword = sourceCode.getCommentsAfter(token);
						if (commensAfterPublicKeyword.length) {
							// public /* Hi there! */ static foo()
							// ^^^^^^^
							rangeToRemove = [
								token.range[0],
								commensAfterPublicKeyword[0].range![0],
							];
							break;
						} else {
							// public static foo()
							// ^^^^^^^
							rangeToRemove = [token.range[0], tokens[i + 1].range[0]];
							break;
						}
					}
				}
				return fixer.removeRange(rangeToRemove!);
			};
		};

		/**
		 * Creates a fixer that adds a "public" keyword with following spaces
		 */
		const getMissingAccessibilitySuggestions = (node: any): any => {
			function fix(accessibility: any, fixer: any): any | null {
				if (node?.decorators.length) {
					const lastDecorator = node.decorators[node.decorators.length - 1];
					const nextToken = sourceCode.getTokenAfter(lastDecorator)!;
					return fixer.insertTextBefore(nextToken, `${accessibility} `);
				}
				return fixer.insertTextBefore(node, `${accessibility} `);
			}

			return [
				{
					messageId: 'addExplicitAccessibility',
					data: { type: 'public' },
					fix: (fixer: any) => fix('public', fixer),
				},
				{
					messageId: 'addExplicitAccessibility',
					data: { type: 'private' },
					fix: (fixer: any) => fix('private', fixer),
				},
				{
					messageId: 'addExplicitAccessibility',
					data: { type: 'protected' },
					fix: (fixer: any) => fix('protected', fixer),
				},
			];
		};

		/**
		 * Checks if property has an accessibility modifier.
		 */
		const checkPropertyAccessibilityModifier = (node: any): void => {
			if (node.key.type === AST_NODE_TYPES.PrivateIdentifier) {
				return;
			}

			const { name: propertyName } = getNameFromMember(node, sourceCode);
			if (ignoredPropertyNames.has(propertyName)) {
				return;
			}

			const nodeType = 'class property';
			
			// no-public check
			if (
				propCheck === 'no-public' &&
				node.accessibility === 'public'
			) {
				context.report({
					node: node,
					messageId: 'unwantedPublicAccessibility',
					data: {
						type: nodeType,
						name: propertyName,
					},
					fix: getUnwantedPublicAccessibilityFixer(node),
				});
			} 
			
			// explicit check
			else if (propCheck === 'explicit' && !node.accessibility) {
				context.report({
					node: node,
					messageId: 'missingAccessibility',
					data: {
						type: nodeType,
						name: propertyName,
					},
					suggest: getMissingAccessibilitySuggestions(node),
				});
			}
		};

		/**
		 * Checks that the parameter property has the desired accessibility modifiers set.
		 * @param node The node representing a Parameter Property
		 */
		const checkParameterPropertyAccessibilityModifier = (node: any): void => {
			const nodeType = 'parameter property';
			// HAS to be an identifier or assignment or TSC will throw
			if (
				node.parameter.type !== AST_NODE_TYPES.Identifier &&
				node.parameter.type !== AST_NODE_TYPES.AssignmentPattern
			) {
				return;
			}

			const nodeName =
				node.parameter.type === AST_NODE_TYPES.Identifier
					? node.parameter.name
					: // has to be an Identifier or TSC will throw an error
					node.parameter.left.name;

			switch (paramPropCheck) {
				case 'explicit': {
					if (!node.accessibility) {
						context.report({
							node,
							messageId: 'missingAccessibility',
							data: {
								type: nodeType,
								name: nodeName,
							},
							suggest: getMissingAccessibilitySuggestions(node),
						});
					}
					break;
				}
				case 'no-public': {
					if (node.accessibility === 'public' && node.readonly) {
						context.report({
							node,
							messageId: 'unwantedPublicAccessibility',
							data: {
								type: nodeType,
								name: nodeName,
							},
							fix: getUnwantedPublicAccessibilityFixer(node),
						});
					}
					break;
				}
			}
		};

		return {
			['MethodDefinition']: checkMethodAccessibilityModifier,
			['TSAbstractMethodDefinition']: checkMethodAccessibilityModifier,
			['PropertyDefinition']: checkPropertyAccessibilityModifier,
			['TSAbstractPropertyDefinition']: checkPropertyAccessibilityModifier,
			['TSParameterProperty']: checkParameterPropertyAccessibilityModifier,
		};
	}
};
