import { AST_NODE_TYPES } from "./astNodeType";
import * as ts from 'typescript';

export type Mutable<Immutable> = {
    -readonly [P in keyof Immutable]: Immutable[P]
};

const enum MemberNameType {
    Private = 1,
    Quoted = 2,
    Normal = 3,
    Expression = 4,
}

export function getNameFromMember(member: any, sourceCode: any): { type: MemberNameType; name: string; } {
    if (member.key.type === AST_NODE_TYPES.Identifier) {
        return {
            type: MemberNameType.Normal,
            name: member.key.name,
        };
    }
    if (member.key.type === AST_NODE_TYPES.PrivateIdentifier) {
        return {
            type: MemberNameType.Private,
            name: `#${member.key.name}`,
        };
    }
    if (member.key.type === AST_NODE_TYPES.Literal) {
        const name = `${member.key.value}`;
        if (__requiresQuoting(name)) {
            return {
                type: MemberNameType.Quoted,
                name: `"${name}"`,
            };
        }
        return {
            type: MemberNameType.Normal,
            name,
        };
    }

    return {
        type: MemberNameType.Expression,
        name: sourceCode.text.slice(...member.key.range),
    };
}

function __requiresQuoting(name: string, target: ts.ScriptTarget = ts.ScriptTarget.ESNext): boolean {
    if (name.length === 0) {
        return true;
    }

    if (!ts.isIdentifierStart(name.charCodeAt(0), target)) {
        return true;
    }

    for (let i = 1; i < name.length; i += 1) {
        if (!ts.isIdentifierPart(name.charCodeAt(i), target)) {
            return true;
        }
    }

    return false;
}