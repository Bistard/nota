import * as ts from 'typescript';

/** 
 * @description Returns all types of a union type or an array containing `type` 
 * itself if it's no union type. 
 */
export function unionTypeParts(type: ts.Type): ts.Type[] {
    return isUnionType(type) ? type.types : [type];
}

export function isUnionType(type: ts.Type): type is ts.UnionType {
    return (type.flags & ts.TypeFlags.Union) !== 0;
}