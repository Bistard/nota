import { BuiltInConfigScope, IConfigRegistrant } from "src/code/platform/configuration/common/configRegistrant";
import { DefaultConfigStorage } from "src/code/platform/configuration/common/configStorage";
import { Registrants } from "src/code/platform/registrant/common/registrant";

class DefaultUserConfiguration extends DefaultConfigStorage {
    protected createDefaultModel(): Record<PropertyKey, any> {
        return {
            'workbench': {
                language: 'en',
                keyboardScreenCast: false,
            },
            // old
            'workspace': {
                'notebook': {
                    exclude: ['^\\..*'] as string[],
                    include: [] as string[],
                    previousOpenedDirctory: '', // REVIEW: should be decide in the main process
                }
            },
            'notebookManager': {
                notebookManagerExclude: [
                    '^\\..*',
                ] as string[],
                notebookManagerInclude: [

                ] as string[],
                previousOpenedNotebook: '',
            },
        };
    }
}

(function registerBrowserDefaultConfiguration() {
    const Registrant = Registrants.get(IConfigRegistrant);
    Registrant.registerDefaultBuiltIn(BuiltInConfigScope.User, new DefaultUserConfiguration());
})();