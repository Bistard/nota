import type { WindowInstanceIPCMessageMap } from "src/platform/window/common/window";
import { ILogService } from "src/base/common/logger";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { IBrowserLifecycleService, ILifecycleService, LifecyclePhase } from "src/platform/lifecycle/browser/browserLifecycleService";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { Disposable } from "src/base/common/dispose";
import { delayFor } from "src/base/common/utilities/async";
import { Time } from "src/base/common/date";
import { IHostService } from "src/platform/host/common/hostService";
import { StatusKey } from "src/platform/status/common/status";
import { ipcRenderer, safeIpcRendererOn, webFrame } from "src/platform/electron/browser/global";
import { IpcChannel } from "src/platform/ipc/common/channel";
import { ICommandService } from "src/platform/command/common/commandService";
import { AllCommands } from "src/workbench/services/workbench/commandList";
import { ErrorHandler } from "src/base/common/error";
import { IBrowserInspectorService } from "src/platform/inspector/common/inspector";
import { IRegistrantService } from "src/platform/registrant/common/registrantService";
import { IMenuItemRegistrationResolved, mainMenuTypes, MenuTypes } from "src/platform/menu/common/menu";
import { RegistrantType } from "src/platform/registrant/common/registrant";
import { IBrowserService } from "src/code/browser/common/renderer.common";
import { IRecentOpenService } from "src/platform/app/browser/recentOpenService";
import { IS_MAC } from "src/base/common/platform";
import { IShortcutService } from "src/workbench/services/shortcut/shortcutService";

export class BrowserInstance extends Disposable implements IBrowserService {

    declare _serviceMarker: undefined;

    // [constructor]

    constructor(
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @IShortcutService shortcutService: IShortcutService, // chris: do not remove. By 0.6.4, since no any services depends on this, we need manually depends on it.
        @ILifecycleService private readonly lifecycleService: IBrowserLifecycleService,
        @ILogService private readonly logService: ILogService,
        @IConfigurationService private readonly configurationService: IConfigurationService,
        @IHostService private readonly hostService: IHostService,
        @ICommandService private readonly commandService: ICommandService,
        @IBrowserInspectorService private readonly browserInspectorService: IBrowserInspectorService,
        @IRegistrantService private readonly registrantService: IRegistrantService,
        @IRecentOpenService private readonly recentOpenService: IRecentOpenService,
    ) {
        super();
        logService.debug('BrowserInstance', 'BrowserInstance constructed.');
    }

    // [public methods]

    public init(): void {
        this.registerListeners();
        this.setBrowserPhase();

        // notify the main process we are ready.
        this.hostService.setWindowAsRendererReady();
    }

    // [private helper methods]

    private async registerListeners(): Promise<void> {
        await this.lifecycleService.when(LifecyclePhase.Displayed);

        // save user configurations on quit
        this.__register(this.lifecycleService.onWillQuit(e =>
            e.join(this.configurationService.save())
        ));

        this.__register(this.lifecycleService.onWillQuit(e =>
            e.join(this.hostService.setApplicationStatus(StatusKey.WindowZoomLevel, webFrame.getZoomLevel()))
        ));

        // alert error from main process
        onMainProcess(IpcChannel.rendererAlertError, error => {
            this.commandService.executeCommand(AllCommands.alertError, 'MainProcess', error);
        });

        // execute command request from main process
        onMainProcess(IpcChannel.rendererRunCommand, async request => {
            try {
                await this.commandService.executeCommand(request.commandID, ...request.args);
            } catch (error) {
                this.commandService.executeCommand(AllCommands.alertError, 'BrowserInstance', error);
            }
        });

        // Handle menu data request from main process
        onMainProcess(IpcChannel.Menu, async () => {
            this.refreshMacOSMenuContent();
        });
        this.__register(this.recentOpenService.onRecentOpenedChange(() => {
            this.refreshMacOSMenuContent();
        }));

        // inspector listener
        this.browserInspectorService.startListening();
    }

    private setBrowserPhase(): void {
        this.lifecycleService.setPhase(LifecyclePhase.Displayed);
        const workbenchWhenReady = Promise.resolve(); // TODO: should wait for the editor restores to the original state

       /**
         * Initiates the `Restored` phase once the layout is restored, using
         * `Promise.race` to balance performance between fast and slow editor
         * restorations. The workbench remains functional, allowing `Restored`
         * phase extensions to proceed even if the editor is not yet visible.
         */
        Promise.race([
            workbenchWhenReady,
            delayFor(Time.sec(2)),
        ])
        .finally(() => {
            this.lifecycleService.setPhase(LifecyclePhase.Restored);
            delayFor(Time.sec(2.5), () => {
                this.lifecycleService.setPhase(LifecyclePhase.Idle);
            });
        });
    }

    private async refreshMacOSMenuContent(): Promise<void> {
        if (!IS_MAC) {
            return;
        }
        
        const menuRegistrant = this.registrantService.getRegistrant(RegistrantType.Menu);
        const result: [MenuTypes, IMenuItemRegistrationResolved[]][] = [];
        for (const {type} of mainMenuTypes) {
            const menuItems = menuRegistrant.getMenuItemsResolved(type);
            result.push([type, menuItems]);
        }

        // send the data to the main process
        ipcRenderer.send(IpcChannel.Menu, result);
    }
}

/**
 * Listens IPC message from the main process. Default avoiding the first 
 * parameter from the callback, if you need the first parameter, invoke
 * `safeIpcRendererOn` directly.
 */
function onMainProcess<TChannel extends string>(channel: TChannel, callback: (...args: WindowInstanceIPCMessageMap[TChannel]) => void): void {
    safeIpcRendererOn(channel, (e, ...args) => {
        callback(...args);
    });
}