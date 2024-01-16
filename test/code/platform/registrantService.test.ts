import * as assert from 'assert';
import { CommandRegistrant, ICommandRegistrant } from 'src/platform/command/common/commandRegistrant';
import { ConfigurationRegistrant, IConfigurationRegistrant } from 'src/platform/configuration/common/configurationRegistrant';
import { IReviverRegistrant, ReviverRegistrant } from 'src/platform/ipc/common/revive';
import { IRegistrant, RegistrantType } from 'src/platform/registrant/common/registrant';
import { RegistrantService } from 'src/platform/registrant/common/registrantService';
import { IShortcutRegistrant, ShortcutRegistrant } from 'src/workbench/services/shortcut/shortcutRegistrant';
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
    
    test('getRegistrant type-check', () => {
        const service = new RegistrantService(new NullLogger());
        service.registerRegistrant(new ConfigurationRegistrant());
        service.registerRegistrant(new CommandRegistrant(new NullLogger()));
        service.registerRegistrant(new ShortcutRegistrant(new CommandRegistrant(new NullLogger())));
        service.registerRegistrant(new ReviverRegistrant());

        // type check
        service.getRegistrant(RegistrantType.Configuration) satisfies IConfigurationRegistrant;
        service.getRegistrant(RegistrantType.Command) satisfies ICommandRegistrant;
        service.getRegistrant(RegistrantType.Shortcut) satisfies IShortcutRegistrant;
        service.getRegistrant(RegistrantType.Reviver) satisfies IReviverRegistrant;
    });
});