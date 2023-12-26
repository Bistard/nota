import * as eslint from 'eslint';
import * as estree from 'estree';
import { TypeChecker } from 'typescript';
import { unionTypeParts } from './utils/typeScriptUtility';
import { AST_NODE_TYPES } from './utils/astNodeType';
import { TSESTree } from '@typescript-eslint/experimental-utils';

/**
 * Evaluate within the expression to see if it's a result.
 * If it's a result, check that it's handled within the expression.
 * If it's not handled, check if it's assigned or used as a function argument.
 * If it's assigned without being handled, review the entire variable block for handling.
 * Otherwise, it was handled appropriately.
 */

export = new class CodeMustHandleResult implements eslint.Rule.RuleModule {

    public readonly meta: eslint.Rule.RuleMetaData = {
		docs: {
			description:
				'Not handling `Result` is a possible error because errors could remain unhandled.',
			category: 'Possible Errors',
			url: '',
			recommended: true,
		},
		messages: {
			[MESSAGE_ID]: '`Result` must be handled with either of `match`, `unwrap` or `unwrapOr`.',
		},
		schema: [],
		type: 'problem',
	};

    public create(context: eslint.Rule.RuleContext): eslint.Rule.RuleListener {
		const parserServices = context.parserServices;
		const checker = parserServices?.program?.getTypeChecker();

		if (!checker || !parserServices) {
			// eslint-disable-next-line local/code-no-throw
			throw new Error('types not available, maybe you need set the parser to @typescript-eslint/parser');
		}

		return {
			CallExpression(node: estree.CallExpression & eslint.Rule.NodeParentExtension) {
				return checkIfNodeIsHandled(context, checker, parserServices, node);
			},

			NewExpression(node: estree.NewExpression & eslint.Rule.NodeParentExtension) {
				return checkIfNodeIsHandled(context, checker, parserServices, node);
			},
		};
	}
};

const resultObjectProperties = ['unwrapOr'];
const handledMethods = ['match', 'unwrap', 'unwrapOr', 'isOk', 'isErr', 'expect'];
const MESSAGE_ID = 'mustUseResult';

function isResultLike(checker: TypeChecker, parserServices: any, node?: eslint.Rule.Node | null): boolean {
	if (!node) {
		return false;
	}

	const tsNodeMap = parserServices.esTreeNodeToTSNodeMap.get(node);
	const type = checker.getTypeAtLocation(tsNodeMap);

	for (const ty of unionTypeParts(checker.getApparentType(type))) {
		if (
			resultObjectProperties
				.map((p) => ty.getProperty(p))
				.every((p) => p !== undefined)
		) {
			return true;
		}
	}
	return false;
}

function findMemberName(node?: any): string | null {
	if (!node) {
		return null;
	}

	if (node.property.type !== AST_NODE_TYPES.Identifier) {
		return null;
	}

	return node.property.name;
}

function isMemberCalledFn(node?: any): boolean {
	if (node?.parent?.type !== AST_NODE_TYPES.CallExpression) {
		return false;
	}
	return node.parent.callee === node;
}

function isHandledResult(node: eslint.Rule.Node): boolean {
	const memberExpresion = node.parent;
	if (memberExpresion?.type === AST_NODE_TYPES.MemberExpression) {
		
		const methodName = findMemberName(memberExpresion);
		const methodIsCalled = isMemberCalledFn(memberExpresion);
		if (methodName && handledMethods.includes(methodName) && methodIsCalled) {
			return true;
		}

		const parent = node.parent?.parent; // search for chain method .map().handler
		if (parent && parent?.type !== AST_NODE_TYPES.ExpressionStatement) {
			return isHandledResult(parent);
		}
	}
	
	return false;
}

const endTransverse = [AST_NODE_TYPES.BlockStatement, AST_NODE_TYPES.Program];
function getAssignation(checker: TypeChecker, parserServices: any, node: any): any | undefined {
	if (
		node.type === AST_NODE_TYPES.VariableDeclarator &&
		node.id.type === AST_NODE_TYPES.Identifier &&
		isResultLike(checker, parserServices, node.init)
	) {
		return node.id;
	}
	
	if (endTransverse.includes(node.type) || !node.parent) {
		return undefined;
	}

	return getAssignation(checker, parserServices, node.parent);
}

function isReturned(checker: TypeChecker, parserServices: any, node: eslint.Rule.Node): boolean {
	if (node.type === AST_NODE_TYPES.ArrowFunctionExpression) {
		return true;
	}
	if (node.type === AST_NODE_TYPES.ReturnStatement) {
		return true;
	}
	if (node.type === AST_NODE_TYPES.BlockStatement) {
		return false;
	}
	if (node.type === AST_NODE_TYPES.Program) {
		return false;
	}
	if (!node.parent) {
		return false;
	}
	return isReturned(checker, parserServices, node.parent);
}

const ignoreParents = [
	AST_NODE_TYPES.ClassDeclaration,
	AST_NODE_TYPES.FunctionDeclaration,
	AST_NODE_TYPES.MethodDefinition,
	'ClassProperty'
];

function checkIfNodeIsHandled(
	context: eslint.Rule.RuleContext,
	checker: TypeChecker,
	parserServices: any,
	node: any,
	reportAs = node,
): boolean {
	if (node.parent?.type.startsWith('TS')) {
		return false;
	}
	
	if (node.parent && ignoreParents.includes(node.parent.type)) {
		return false;
	}

	if (!isResultLike(checker, parserServices, node)) {
		return false;
	}

	if (isHandledResult(node)) {
		return false;
	}

	// eg. `return getResult();`
	if (isReturned(checker, parserServices, node)) {
		return false;
	}

	const assignedTo = getAssignation(checker, parserServices, node);
	const currentScope = context.getScope();

	// Check if is assigned to variables
	if (assignedTo) {
		const variable = currentScope.set.get(assignedTo.name);
		const references = variable?.references.filter(ref => ref.identifier !== assignedTo) ?? [];

		/**
		 * Try to mark the first assigned variable to be assigned, if not, keep 
		 * the original one.
		 */
		reportAs = variable?.references[0].identifier ?? reportAs;

		// check if any reference is handled by recursive calling
		const anyHandled = references.some(ref =>
			!checkIfNodeIsHandled(
				context,
				checker,
				parserServices,
				ref.identifier,
				reportAs
			)
		);

		// since the result is handled at least once, we should mark it as handled.
		if (anyHandled) {
			return false;
		}
	}

	context.report({
		node: reportAs,
		messageId: MESSAGE_ID,
	});

	return true;
}
