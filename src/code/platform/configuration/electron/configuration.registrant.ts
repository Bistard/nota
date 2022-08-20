import { BuiltInConfigScope, IConfigRegistrant } from "src/code/platform/configuration/common/configRegistrant";
import { DefaultConfigStorage } from "src/code/platform/configuration/common/configStorage";
import { Registrants } from "src/code/platform/registrant/common/registrant";

class DefaultApplicationConfiguration extends DefaultConfigStorage {
    protected override createDefaultModel(): Record<PropertyKey, any> {
        return {
            // old
            'application': {
                displayLanguage: 'en',
                keyboardScreenCast: false,
            },
            'notebookManager': {
                defaultConfigOn: false,
                startPreviousNotebookManagerDir: true,
                previousNotebookManagerDir: '',
            },
        };
    }
}

(function registerMainDefaultConfiguration() {
    const Registrant = Registrants.get(IConfigRegistrant);
    Registrant.registerDefaultBuiltIn(BuiltInConfigScope.Application, new DefaultApplicationConfiguration());
})();