import { TreeMode } from "src/code/browser/service/explorerTree/treeService";
import { BuiltInConfigScope, IConfigRegistrant } from "src/code/platform/configuration/common/configRegistrant";
import { DefaultConfigStorage } from "src/code/platform/configuration/common/configStorage";
import { LanguageType } from "src/code/platform/i18n/i18n";
import { REGISTRANTS } from "src/code/platform/registrant/common/registrant";

class DefaultUserConfiguration extends DefaultConfigStorage {
    protected createDefaultModel(): Record<PropertyKey, any> {
        return {
            'workbench': {
                language: 'en' as LanguageType,
                keyboardScreenCast: false,
            },
            'actionView': {
                'explorer': {
                    mode: 'classic' as TreeMode,
                    exclude: ['^\\..*'] as string[],
                    include: [''] as string[],
                },
                'outline': {},
                'search': {},
            },
        };
    }
}

(function registerBrowserDefaultConfiguration() {
    const Registrant = REGISTRANTS.get(IConfigRegistrant);
    Registrant.registerDefaultBuiltIn(BuiltInConfigScope.User, new DefaultUserConfiguration());
})();