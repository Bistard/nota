import * as assert from 'assert';
import { IReviverRegistrant } from 'src/code/platform/ipc/common/revive';
import { Registrants } from 'src/code/platform/registrant/common/registrant';

class BasePrototype1 {
    constructor(public readonly baseField1: number) {}
    public getValue(): number {
        return this.baseField1;
    }
}

class BasePrototype2 {
    constructor(public readonly baseField2: string) {}
    public getValue(): string {
        return this.baseField2;
    }
}

suite('reviver-registrant-test', () => {

    const registrant = Registrants.get(IReviverRegistrant);
    
    test('registerPrototype', () => {
        registrant.registerPrototype(BasePrototype1, (obj: Object) => {
            if (obj.hasOwnProperty('baseField1')) {
                return true;
            }
            return false;
        });
    
        registrant.registerPrototype(BasePrototype2, (obj: Object) => {
            if (obj.hasOwnProperty('baseField2')) {
                return true;
            }
            return false;
        });
    });

    test('revive', () => {
        let o1 = JSON.parse(JSON.stringify(new BasePrototype1(10)));
        try {
            o1.getValue();
        } catch {}
        o1 = registrant.revive<BasePrototype1>(o1);
        assert.strictEqual(o1.getValue(), 10);
        
        let o2 = JSON.parse(JSON.stringify(new BasePrototype2('hello world')));
        try {
            o2.getValue();
        } catch {}
        o2 = registrant.revive<BasePrototype2>(o2);
        assert.strictEqual(o2.getValue(), 'hello world');
    });
});