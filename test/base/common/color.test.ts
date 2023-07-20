import * as assert from 'assert';
import { HexColor, RGBA } from 'src/base/common/color';
import { AreEqual } from 'src/base/common/util/type';

suite('color-test', () => {

    function checkColor(color: RGBA, r: number, g: number, b: number, a: number = 1): boolean {
        return color.r === r && color.g === g && color.b === b && color.a === a;
    }

    test('HexColor - type infer', () => {
        let res: boolean;

        // Valid HexColor tests
        res = true satisfies AreEqual<HexColor<'#abc'>, '#abc'>;
        res = true satisfies AreEqual<HexColor<'#abcdef'>, '#abcdef'>;

        // Invalid HexColor tests
        res = true satisfies AreEqual<HexColor<''>, never>;
        res = true satisfies AreEqual<HexColor<'#'>, never>;
        res = true satisfies AreEqual<HexColor<'#a'>, never>;
        res = true satisfies AreEqual<HexColor<'#ab'>, never>;
        res = true satisfies AreEqual<HexColor<'#abcdefg'>, never>;
        res = true satisfies AreEqual<HexColor<'#abcdeg'>, never>;
    });

    test('RGBA - ctor', () => {
        let color = new RGBA(255, 255, 255);
        assert.ok(checkColor(color, 255, 255, 255, 1));
        
        color = new RGBA(255, 255, 257);
        assert.ok(checkColor(color, 255, 255, 255, 1));

        color = new RGBA(255, 255, -2);
        assert.ok(checkColor(color, 255, 255, 0, 1));
    });

    test('RGBA - equal', () => {
        assert.ok(RGBA.equals(new RGBA(0, 0, 0, 1), new RGBA(0, 0, 0, 1)));
        assert.strictEqual(RGBA.equals(new RGBA(0, 0, 0, 0.99), new RGBA(0, 0, 0, 1)), false);
    });

    test('RGBA - toString', () => {
        const color = new RGBA(255, 125, 30, 0.5);
        assert.strictEqual(color.toString(), 'rgb(255,125,30,0.5)');
    });

    test('RGBA - parse', () => {
        let color = RGBA.parse('#5A564D');
        assert.strictEqual(color!.toString(), 'rgb(90,86,77,1)');

        color = RGBA.parse('5A564D');
        assert.strictEqual(color, null);

        color = RGBA.parse('#5A564');
        assert.strictEqual(color, null);

        color = RGBA.parse('#5A56');
        assert.strictEqual(color!.toString(), 'rgb(85,170,85,0.4)');
    });
});