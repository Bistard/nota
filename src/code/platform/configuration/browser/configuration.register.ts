import { TreeMode } from "src/code/browser/service/explorerTree/treeService";
import { ColorThemeType } from "src/code/browser/service/theme/themeConfiguration";
import { BuiltInConfigScope, IConfigRegistrant } from "src/code/platform/configuration/common/configRegistrant";
import { DefaultConfigStorage } from "src/code/platform/configuration/common/configStorage";
import { LanguageType } from "src/code/platform/i18n/i18n";
import { REGISTRANTS } from "src/code/platform/registrant/common/registrant";

class DefaultUserConfiguration extends DefaultConfigStorage {
    protected createDefaultModel(): Record<PropertyKey, any> {
        return {
            'workbench': {
                language: LanguageType.en,
                colorTheme: ColorThemeType.Light,
                keyboardScreenCast: false,
            },
            'sideView': {
                default: 'explorer',
                'explorer': {
                    mode: TreeMode.Classic,
                    exclude: ['^\\..*'] as string[],
                    include: [''] as string[],
                },
                'outline': {},
                'search': {},
            },
            'editor': {}, // the editor configuration is defined in `editorConfiguration.ts`
        };
    }
}

export function registerBrowserDefaultConfiguration(): void {
    const Registrant = REGISTRANTS.get(IConfigRegistrant);
    Registrant.registerDefaultBuiltIn(BuiltInConfigScope.User, new DefaultUserConfiguration());
}