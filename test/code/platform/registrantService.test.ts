import * as assert from 'assert';
import { IRegistrant, RegistrantType } from 'src/platform/registrant/common/registrant';
import { RegistrantService } from 'src/platform/registrant/common/registrantService';
import { NullLogger } from 'test/utils/testService';

suite('registrant-service', () => {

    class TestRegistrant implements IRegistrant<RegistrantType.Command> {
        public init = false;
        public readonly type = RegistrantType.Command;
        public initRegistrations(): void {
            this.init = true;
        }
    }

    test('register registrations', () => {
        const service = new RegistrantService(new NullLogger());
        const registrant = new TestRegistrant();
        
        // register
        service.registerRegistrant(<any>registrant);

        // get
        assert.strictEqual(registrant, service.getRegistrant(RegistrantType.Command));
    });

    test('cannot register after init', () => {
        const service = new RegistrantService(new NullLogger());
        const registrant = new TestRegistrant();

        // init
        service.init();

        // register
        assert.throws(() => service.registerRegistrant(<any>registrant));
    });

    test('init registrants', () => {
        const service = new RegistrantService(new NullLogger());

        const registrant = new TestRegistrant();
        service.registerRegistrant(<any>registrant);

        service.init();

        assert.ok(service.isInit());
        assert.ok(registrant.init);
    });
});