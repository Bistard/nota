import type { WindowInstanceIPCMessageMap } from "src/platform/window/common/window";
import { ILogService } from "src/base/common/logger";
import { IShortcutService } from "src/workbench/services/shortcut/shortcutService";
import { IFileService } from "src/platform/files/common/fileService";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";
import { IBrowserLifecycleService, ILifecycleService, LifecyclePhase } from "src/platform/lifecycle/browser/browserLifecycleService";
import { IConfigurationService } from "src/platform/configuration/common/configuration";
import { Disposable } from "src/base/common/dispose";
import { IWorkbenchService } from "src/workbench/services/workbench/workbenchService";
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
import { IFileTreeService } from "src/workbench/services/fileTree/treeService";
import { IBrowserService } from "src/code/browser/common/renderer.common";

export class BrowserInstance extends Disposable implements IBrowserService {

    declare _serviceMarker: undefined;

    // [constructor]

    constructor(
        @IInstantiationService private readonly instantiationService: IInstantiationService,
        @ILifecycleService private readonly lifecycleService: IBrowserLifecycleService,
        @IFileService private readonly fileService: IFileService,
        @ILogService private readonly logService: ILogService,
        @IShortcutService private readonly shortcutService: IShortcutService,
        @IConfigurationService private readonly configurationService: IConfigurationService,
        @IWorkbenchService private readonly workbenchService: IWorkbenchService,
        @IHostService private readonly hostService: IHostService,
        @ICommandService private readonly commandService: ICommandService,
        @IBrowserInspectorService private readonly browserInspectorService: IBrowserInspectorService,
        @IRegistrantService private readonly registrantService: IRegistrantService
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

    public async updateMacOSMenu(): Promise<void> {
        // Update recent paths menu items each time main requests them
        await this.updateRecentPathsMenu(this.registrantService);

        const menuRegistrant = this.registrantService.getRegistrant(RegistrantType.Menu);
        const result: [MenuTypes, IMenuItemRegistrationResolved[]][] = [];
        for (const {type} of mainMenuTypes) {
            const menuItems = menuRegistrant.getMenuItemsResolved(type);
            result.push([type, menuItems]);
        }
        ipcRenderer.send(IpcChannel.Menu, result);
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
            ErrorHandler.onUnexpectedError(error);
        });

        // execute command request from main process
        onMainProcess(IpcChannel.rendererRunCommand, async request => {
            console.log("Command execution request:", request.commandID, "with args:", request.args); // Add this
            try {
                await this.commandService.executeCommand(request.commandID, ...request.args);
            } catch (error) {
                console.error("Error executing command:", error);
                this.commandService.executeCommand(AllCommands.alertError, 'BrowserInstance', error);
            }
        });

        // Handle menu requests from main process
        onMainProcess(IpcChannel.Menu, async () => {
            this.updateMacOSMenu();
        });
        
        // inspector listener
        this.browserInspectorService.startListening();
    }

    private async updateRecentPathsMenu(menuRegistrant: IRegistrantService) {
        const reg = menuRegistrant.getRegistrant(RegistrantType.Menu);
        reg.clearMenuItems(MenuTypes.FileOpenRecent);

        const fileTreeService = this.instantiationService.getOrCreateService(IFileTreeService);
        const recentPaths: string[] = await fileTreeService.getRecentPaths();

        if (recentPaths.length === 0) {
            reg.registerMenuItem(MenuTypes.FileOpenRecent, {
                group: '1_recent',
                title: 'No Recent Files',
                command: { commandID: "" },
            });
        } else {
            for (const p of recentPaths) {
                reg.registerMenuItem(MenuTypes.FileOpenRecent, {
                    group: '1_recent',
                    title: p,
                    command: {
                        commandID: AllCommands.fileTreeOpenFolder,
                        args: [p],
                    },
                });
            }
        }

        // Add the "Clear Recent Files" option
        reg.registerMenuItem(MenuTypes.FileOpenRecent, {
            group: '2_clear',
            title: 'Clear Recent Files',
            command: {
                commandID: AllCommands.fileTreeClearRecentOpened,
            },
        });
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