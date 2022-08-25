import { KeyCode, Shortcut } from "src/base/common/keyboard";
import { IShortcutService } from "src/code/browser/service/shortcut/shortcutService";
import { IHostService } from "src/code/platform/host/common/hostService";
import { IServiceProvider } from "src/code/platform/instantiation/common/instantiation";
import { ILifecycleService } from "src/code/platform/lifecycle1/browser/browserLifecycleService";

export function workbenchDefaultShortcutRegistrations(provider: IServiceProvider) {
    const shortcutService = provider.getOrCreateService(IShortcutService);
    const hostService = provider.getOrCreateService(IHostService);
    const lifecycleService = provider.getOrCreateService(ILifecycleService);

    shortcutService.register({
        commandID: 'workbench.open-develop-tool',
        whenID: 'N/A',
        shortcut: new Shortcut(true, true, false, false, KeyCode.KeyI),
        when: null,
        command: () => {
            hostService.toggleDevTools();
        },
        override: false,
        activate: true
    });

    shortcutService.register({
        commandID: 'workbench.reload-window',
        whenID: 'N/A',
        shortcut: new Shortcut(true, false, false, false, KeyCode.KeyR),
        when: null,
        command: () => {
            hostService.reloadWebPage();
        },
        override: false,
        activate: true
    });

    shortcutService.register({
        commandID: 'workbench.close-window',
        whenID: 'N/A',
        shortcut: new Shortcut(true, false, false, false, KeyCode.KeyQ),
        when: null,
        command: () => {
            lifecycleService.quit();
        },
        override: false,
        activate: true
    });
}