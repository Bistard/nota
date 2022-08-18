import * as assert from 'assert';
import { createRegistrant, Registrants, RegistrantType } from 'src/code/platform/registrant/common/registrant';

const INullRegistrant = createRegistrant<INullRegistrant>(RegistrantType.Test, true);

interface INullRegistrant {
    foo(): boolean;
}

@INullRegistrant
class NullRegistrant implements INullRegistrant {
    
    private readonly _value: boolean;

    constructor(value: boolean) {
        this._value = value;
    }

    public foo(): boolean {
        return this._value;
    }
}

suite('registrant-test', () => {

    test('basic', () => {
        const nullRegistrant = Registrants.get(INullRegistrant);
        assert.ok(nullRegistrant.foo());
    });
});