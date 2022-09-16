import { loop } from "src/base/common/util/async";
import { Random } from "src/base/common/util/random";
import { NestedArray } from "src/base/common/util/type";

/**
 * @description Able to generate a random tree like structure with each tree 
 * leaf has a type TLeaf. A node represented by an array of TLeaf.
 * @param createLeaf A function to generate a leaf.
 * @param size A coefficient determines the size of the tree. Defaults to 50.
 * @returns The generated random tree.
 * 
 * @note The size of the tree may vary a lot.
 */
export function generateTreeLike<TLeaf>(createLeaf: () => TLeaf, size: number = 50
): [
    NestedArray<TLeaf>, // actual tree
    number,             // size of the tree
] {
    let nodeCount = 0;

    const __aux = (parent: NestedArray<TLeaf>, depth: number): NestedArray<TLeaf> => {
        // the deeper the node, the less likely the children can have.
        const childrenCnt = 1 + Random.getRandInt(size / depth);

        loop(childrenCnt, () => {
            // the deeper the node, the more likely the node is a leaf.
            if (Random.maybe(1 / depth)) {
                parent.push(__aux([], depth + 1));
            } else {
                parent.push(createLeaf());
            }
            nodeCount++;
        });

        return parent;
    };
    
    return [
        __aux([], 1),
        nodeCount,
    ];
}