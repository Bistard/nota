import * as assert from 'assert';
import { URI } from 'src/base/common/file/uri';
import { CreateTernarySearchTree, ITernarySearchTree, StringIterator, TernarySearchTree, TernarySearchTreeNode, UriIterator } from 'src/base/common/util/ternarySearchTree';
import { isString } from 'src/base/common/util/type';

type PossibleKey = string | URI;

suite('ternarySearchTree-test', () => {
    
    function isbalanced(tree: ITernarySearchTree<any, any>): boolean {
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
    function assertTstDfs<Key extends PossibleKey, E>(tree: ITernarySearchTree<Key, E>, ...items: [Key, E][]) {
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

        const map = new Map<Key, E>();

        for (const [key, value] of items) {
            map.set(key, value);
        }

        // get
        map.forEach((value: E, key: Key): void => {
            assert.strictEqual(value, tree.get(key));
        })

        // foreach and iterator
        let count = 0;
        tree.forEach((value: E, key: Key): void => {
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

    test('URI-iterator', () => {
        // TODO
        const iter = new UriIterator(false);
		iter.reset(URI.parse('file:///usr/bin/file.txt'));

		assert.strictEqual(iter.currItem(), 'file');
		// assert.strictEqual(iter.cmp('FILE'), 0);
		assert.strictEqual(iter.cmp('file'), 0);
		assert.strictEqual(iter.hasNext(), true);
		iter.next();

		assert.strictEqual(iter.currItem(), 'usr');
		assert.strictEqual(iter.hasNext(), true);
		iter.next();

		assert.strictEqual(iter.currItem(), 'bin');
		assert.strictEqual(iter.hasNext(), true);
		iter.next();

		assert.strictEqual(iter.currItem(), 'file.txt');
		assert.strictEqual(iter.hasNext(), false);


		iter.reset(URI.parse('file://share/usr/bin/file.txt?foo'));

		// scheme
		assert.strictEqual(iter.currItem(), 'file');
		// assert.strictEqual(iter.cmp('FILE'), 0);
		assert.strictEqual(iter.cmp('file'), 0);
		assert.strictEqual(iter.hasNext(), true);
		iter.next();

		// authority
		assert.strictEqual(iter.currItem(), 'share');
		assert.strictEqual(iter.cmp('SHARe'), 0);
		assert.strictEqual(iter.hasNext(), true);
		iter.next();

		// path
		assert.strictEqual(iter.currItem(), 'usr');
		assert.strictEqual(iter.hasNext(), true);
		iter.next();

		// path
		assert.strictEqual(iter.currItem(), 'bin');
		assert.strictEqual(iter.hasNext(), true);
		iter.next();

		// path
		assert.strictEqual(iter.currItem(), 'file.txt');
		assert.strictEqual(iter.hasNext(), true);
		iter.next();

		// query
		assert.strictEqual(iter.currItem(), 'foo');
		assert.strictEqual(iter.cmp('z') > 0, true);
		assert.strictEqual(iter.cmp('a') < 0, true);
		assert.strictEqual(iter.hasNext(), false);
    })

    function generateTree(value: PossibleKey): ITernarySearchTree<PossibleKey, number> {
        let tree: ITernarySearchTree<PossibleKey, number>;
        if (URI.isURI(value)) {
            tree = CreateTernarySearchTree.forUriKeys<number, URI>();
        } else if (isString(value)) {
            tree = CreateTernarySearchTree.forStringKeys<number, string>();
        } else {
            throw new Error();
        }
        return tree;
    }

    test('set & get & has', () => {

        // TODO: `has` is not tested yet

        const testGeneric = function <Key extends PossibleKey>(foobar: Key, foobaz: Key, fooba: Key, foo: Key, bar: Key, foob: Key, bazz: Key): void {
            let tree = generateTree(foo);

            tree.set(foobar, 0);
            tree.set(foobaz, 1);
            assertTstDfs(tree, [foobar, 0], [foobaz, 1]); // same length

            tree = generateTree(foo);
            tree.set(foobar, 1);
            tree.set(fooba, 2);
            assertTstDfs(tree, [fooba, 2], [foobar, 1]); // shorter

            tree = generateTree(foo);
            tree.set(foo, 1);
            tree.set(foo, 2);
            assertTstDfs(tree, [foo, 2]);

            tree = generateTree(foo);
            tree.set(foo, 1);
            tree.set(foobar, 2);
            tree.set(bar, 3);
            tree.set(foob, 4);
            tree.set(bazz, 5);

            assertTstDfs(tree,
                [bar, 3],
                [bazz, 5],
                [foo, 1],
                [foob, 4],
                [foobar, 2],
            );
        };

        testGeneric('foobar', 'foobaz', 'fooba', 'foo', 'bar', 'foob', 'bazz');
        testGeneric(URI.fromFile('foobar'), URI.fromFile('foobaz'), URI.fromFile('fooba'), URI.fromFile('foo'), URI.fromFile('bar'), URI.fromFile('foob'), URI.fromFile('bazz'));
    });

    // TODO: findSubtr

    // TODO: size

    test('delete & cleanup', () => {

        const testGeneric = function <Key extends PossibleKey>(foo: Key, foobar: Key, bar: Key, foobarbaz: Key, fo: Key): void {
            // normal delete
            let tree = generateTree(foo);
            tree.set(foo, 1);
            tree.set(foobar, 2);
            tree.set(bar, 3);
            assertTstDfs(tree, [bar, 3], [foo, 1], [foobar, 2]);
            tree.delete(foo);
            assertTstDfs(tree, [bar, 3], [foobar, 2]);
            tree.delete(foobar);
            assertTstDfs(tree, [bar, 3]);

            // superstr-delete
            tree = generateTree(foo);
            tree.set(foo, 1);
            tree.set(foobar, 2);
            tree.set(bar, 3);
            tree.set(foobarbaz, 4);
            tree.deleteSuperStrOf(foo);
            assertTstDfs(tree, [bar, 3], [foo, 1]);

            tree = generateTree(foo);
            tree.set(foo, 1);
            tree.set(foobar, 2);
            tree.set(bar, 3);
            tree.set(foobarbaz, 4);
            tree.deleteSuperStrOf(fo);
            assertTstDfs(tree, [bar, 3]);
        };

		testGeneric('foo', 'foobar', 'bar', 'foobarbaz', 'fo');
        // FIX
        testGeneric(URI.fromFile('foo'), URI.fromFile('foobar'), URI.fromFile('bar'), URI.fromFile('foobarbaz'), URI.fromFile('fo'));
	});

    test('fill and clear', () => {

        const fillAndClearGeneric = function (fillData: readonly [PossibleKey, number][]): void {
            if (!fillData.length) {
                return;
            }
            
            let tree = generateTree(fillData[0]![0]!);
            tree.fill(fillData);

            for (const pair of fillData) {
                assert.strictEqual(tree.get(pair[0]), pair[1]);
            }

            tree.clear();
            assert.strictEqual(tree.getRoot(), undefined);
            assert.strictEqual(tree.size(), 0);
        };
        
        fillAndClearGeneric([['foo', 0], ['bar', 1], ['bang', 2], ['bazz', 3]]);
        // FIX
        fillAndClearGeneric([[URI.fromFile('foo'), 0], [URI.fromFile('bar'), 1], [URI.fromFile('bang'), 2], [URI.fromFile('bazz'), 3]]);
    });
})