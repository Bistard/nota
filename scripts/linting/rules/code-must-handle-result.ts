import * as eslint from 'eslint';
import * as estree from 'estree';
import { TypeChecker } from 'typescript';
import { unionTypeParts } from './utils/typeScriptUtility';
import { AST_NODE_TYPES } from './utils/astNodeType';

/**
 * Evaluate within the expression to see if it's a result. Specifically:
 *   - Check if the expression is a `Result`.
 *   - If it is a `Result`, ensure it is handled within the expression:
 *     - Handling can occur through specific methods (e.g., `match`, `unwrap`).
 *     - Alternatively, handling is assumed if the `Result` is passed as a function argument.
 *   - If the `Result` is not directly handled, check if it is assigned to a variable:
 *     - Review the entire variable block to confirm if the `Result` is subsequently handled.
 *   - A `Result` passed as a function argument is considered handled, assuming function takes ownership.
 *   - If none of these conditions are met, the `Result` is considered not handled appropriately.
 */

const RESULT_OBJ_PROP = ['match', 'unwrapOr'];
const HANDLED_METHODS = [
	'match', 
	'unwrap', 
	'unwrapOr', 
	'unwrapErr',
	'isOk', 
	'isErr', 
	'expect',
	'then', // only available for AsyncResult
];
const MESSAGE_ID = 'ResultNotHandled';

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
			[MESSAGE_ID]: '`Result` must be handled with either of `match`, `unwrap`, `unwrapOr`, `unwrapErr`, `isOk`, `isErr`, `expect` or `then`.',
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
				checkIfNodeIsNotHandled(context, checker, parserServices, node, node, false);
			},

			NewExpression(node: estree.NewExpression & eslint.Rule.NodeParentExtension) {
				checkIfNodeIsNotHandled(context, checker, parserServices, node, node, false);
			},

			AwaitExpression(node: estree.AwaitExpression & eslint.Rule.NodeParentExtension) {
				checkIfNodeIsNotHandled(context, checker, parserServices, node, node, false);
			}
		};
	}
};

const ignoreParents = [
	AST_NODE_TYPES.ClassDeclaration,
	AST_NODE_TYPES.FunctionDeclaration,
	AST_NODE_TYPES.MethodDefinition,
	'ClassProperty'
];

function checkIfNodeIsNotHandled(
	context: eslint.Rule.RuleContext,
	checker: TypeChecker,
	parserServices: any,
	node: any,
	reportNode: any = node,
	isReference: boolean = false,
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
		 * Try to mark the first assigned variable to be reported, if not, keep 
		 * the original one.
		 */
		reportNode = variable?.references[0].identifier ?? reportNode;

		// check if any reference is handled by recursive calling
		const anyHandled = references.some(ref =>
			!checkIfNodeIsNotHandled(
				context,
				checker,
				parserServices,
				ref.identifier,
				reportNode,
				true,
			) 
		);

		// since the result is handled at least once, we should mark it as handled.
		if (anyHandled) {
			return false;
		}
	}

	if (!isReference) {
		context.report({
			node: reportNode,
			messageId: MESSAGE_ID,
		});
	}

	return true;
}

function isResultLike(checker: TypeChecker, parserServices: any, node?: eslint.Rule.Node | null): boolean {
	if (!node) {
		return false;
	}

	const tsNodeMap = parserServices.esTreeNodeToTSNodeMap.get(node);
	const type = checker.getTypeAtLocation(tsNodeMap);

	for (const ty of unionTypeParts(checker.getApparentType(type))) {
		if (
			RESULT_OBJ_PROP
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
	if (isHandledMemberExpression(node) || isHandledInChainMethod(node)) {
        return true;
    }

	if (isPassedAsFunctionArgument(node)) {
        return true;
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

function isHandledMemberExpression(node: eslint.Rule.Node): boolean {
    const memberExpression = node.parent;
    if (memberExpression?.type === AST_NODE_TYPES.MemberExpression) {
        const methodName = findMemberName(memberExpression);
        const methodIsCalled = isMemberCalledFn(memberExpression);
        return Boolean(methodName && HANDLED_METHODS.includes(methodName) && methodIsCalled);
    }
    return false;
}

function isHandledInChainMethod(node: eslint.Rule.Node): boolean {
    // search for chain method .map().handler
    const parent = node.parent?.parent;
    if (parent && parent?.type !== AST_NODE_TYPES.ExpressionStatement) {
        return isHandledResult(parent);
    }
    return false;
}

function isPassedAsFunctionArgument(node: any): boolean {
    let parentNode = node.parent;
    while (parentNode) {
        if (parentNode.type === AST_NODE_TYPES.CallExpression) {
            return parentNode.arguments.includes(node);
        }
        parentNode = parentNode.parent;
    }
    return false;
}