import * as assert from 'assert';
import { URI } from 'src/base/common/file/uri';
import { CreateTernarySearchTree, ITernarySearchTree, StringIterator, TernarySearchTree, TernarySearchTreeNode } from 'src/base/common/util/ternarySearchTree';
import { isString } from 'src/base/common/util/type';

type PossibleKey = string | URI;

suite('ternarySearchTree-test', () => {
    
    function isbalanced(tree: TernarySearchTree<any, any>): boolean {
        const nodeBalanced = (node: TernarySearchTreeNode<any, any> | undefined): boolean => {
            if (!node) {
                return true;
            }
            const bf = node.balanceFactor();
            if (bf < -1 || bf > 1) {
                return false;
            }
            return nodeBalanced(node.left) && nodeBalanced(node.right);
        }
        return nodeBalanced(tree.getRoot());
    }

    // Note: items must be in order. 
    function assertTstDfs<E>(tree: TernarySearchTree<string, E>, ...items: [string, E][]) {
        assert.ok(isbalanced(tree), 'TST is not balanced');

        let i = 0;

    	// iterator not tested yet, just confirming input
        for (const [key, value] of items) {
            const expected = items[i++];
            assert.ok(expected);
            assert.strictEqual(key, expected[0]);
            assert.strictEqual(value, expected[1]);
        }

        assert.strictEqual(i, items.length);

        const map = new Map<string, E>();

        for (const [key, value] of items) {
            map.set(key, value);
        }

        // get
        map.forEach((value: E, key: string): void => {
            assert.strictEqual(value, tree.get(key));
        })

        // foreach and iterator
        let count = 0;
        tree.forEach((value: E, key: string): void => {
            assert.strictEqual(value, map.get(key));
            count++;
        });

        assert.strictEqual(map.size, count);

        count = 0;
        for (const [key, value] of tree) {
			assert.strictEqual(value, map.get(key));
			count++;
		}
		assert.strictEqual(map.size, count);
    }

    test('string-iterator', () => {
        const iter = new StringIterator();
        iter.reset('this');
        
        assert.strictEqual(iter.currItem(), 't');
        assert.strictEqual(iter.hasNext(), true);
        assert.strictEqual(iter.cmp('t'), 0);

        assert.ok(iter.cmp('a') < 0);
        assert.ok(iter.cmp('z') > 0);
        assert.strictEqual(iter.cmp('t'), 0);

        iter.next();
        assert.strictEqual(iter.currItem(), 'h');
        assert.strictEqual(iter.hasNext(), true);
        
        iter.next();
        assert.strictEqual(iter.hasNext(), true);
        iter.next();
        assert.strictEqual(iter.currItem(), 's');
        assert.strictEqual(iter.hasNext(), false);
        
        iter.next()
        assert.strictEqual(iter.currItem(), undefined);

        iter.reset('hello');
        assert.strictEqual(iter.currItem(), 'h');
        assert.strictEqual(iter.hasNext(), true);
    });

    test('set & get', () => {
        let tree = CreateTernarySearchTree.forStrings<number>();

        tree.set('foobar', 0);
        tree.set('foobaz', 1);
        assertTstDfs(tree, ['foobar', 0], ['foobaz', 1]); // same length

		tree = CreateTernarySearchTree.forStrings<number>();
		tree.set('foobar', 1);
		tree.set('fooba', 2);
		assertTstDfs(tree, ['fooba', 2], ['foobar', 1]); // shorter

		tree = CreateTernarySearchTree.forStrings<number>();
		tree.set('foo', 1);
		tree.set('foo', 2);
		assertTstDfs(tree, ['foo', 2]);

		tree = CreateTernarySearchTree.forStrings<number>();
		tree.set('foo', 1);
		tree.set('foobar', 2);
		tree.set('bar', 3);
		tree.set('foob', 4);
		tree.set('bazz', 5);

		assertTstDfs(tree,
			['bar', 3],
			['bazz', 5],
			['foo', 1],
			['foob', 4],
			['foobar', 2],
		);
    });

    test('delete & cleanup', () => {

		// normal delete
		let tree = new TernarySearchTree<string, number>(new StringIterator());
		tree.set('foo', 1);
		tree.set('foobar', 2);
		tree.set('bar', 3);
		assertTstDfs(tree, ['bar', 3], ['foo', 1], ['foobar', 2]);
		tree.delete('foo');
		assertTstDfs(tree, ['bar', 3], ['foobar', 2]);
		tree.delete('foobar');
		assertTstDfs(tree, ['bar', 3]);

		// superstr-delete
		tree = new TernarySearchTree<string, number>(new StringIterator());
		tree.set('foo', 1);
		tree.set('foobar', 2);
		tree.set('bar', 3);
		tree.set('foobarbaz', 4);
		tree.deleteSuperStr('foo');
		assertTstDfs(tree, ['bar', 3], ['foo', 1]);

		tree = new TernarySearchTree<string, number>(new StringIterator());
		tree.set('foo', 1);
		tree.set('foobar', 2);
		tree.set('bar', 3);
		tree.set('foobarbaz', 4);
		tree.deleteSuperStr('fo');
		assertTstDfs(tree, ['bar', 3]);
	});

    test('fill and clear', () => {

        const fillAndClearGeneric = function(fillData: readonly [PossibleKey, number][]): void {
            if (!fillData.length) {
                return;
            }
            
            let tree: ITernarySearchTree<PossibleKey, number>;
            {
                const firstData = fillData[0]![0]!;
                if (URI.isURI(firstData)) {
                    tree = CreateTernarySearchTree.forURIs<number, URI>();
                } else if (isString(firstData)) {
                    tree = CreateTernarySearchTree.forStrings<number, string>();
                } else {
                    throw new Error();
                }
            }

            tree.fill(fillData);

            // FIX: DELETE once it got fixed
            for (const node of tree) {
                console.log(node);
            }

            for (const pair of fillData) {
                assert.strictEqual(tree.get(pair[0]), pair[1]);
            }

            tree.clear();
            assert.strictEqual(tree.getRoot(), undefined);
            // assert.strictEqual(tree.size(), 0); // TODO
        };

        // FIX
        // string
        fillAndClearGeneric([['foo', 0], ['bar', 1], ['bang', 2], ['bazz', 3]]);

        // URI
        // TODO
    });
})