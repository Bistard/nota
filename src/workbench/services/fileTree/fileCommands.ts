import { ClipboardType, IClipboardService } from "src/platform/clipboard/common/clipboard";
import { Command } from "src/platform/command/common/command";
import { AllCommands } from "src/workbench/services/workbench/commandList";
import { IServiceProvider } from "src/platform/instantiation/common/instantiation";
import { IFileTreeService } from "src/workbench/services/fileTree/treeService";
import { WorkbenchContextKey } from "src/workbench/services/workbench/workbenchContextKeys";
import { URI } from "src/base/common/files/uri";
import { FileItem } from "src/workbench/services/fileTree/fileItem";
import { IContextService } from "src/platform/context/common/contextService";
import { INotificationService } from "src/workbench/services/notification/notificationService";
import { IFileService } from "src/platform/files/common/fileService";
import { noop } from "src/base/common/performance";
import { FileOperationErrorType } from "src/base/common/files/file";
import { parse } from "src/base/common/files/path";
import { ICommandService } from "src/platform/command/common/commandService";

/**
 * @namespace FileCommands Contains a list of useful {@link Command}s that will
 * be registered into the command service.
 */
export namespace FileCommands {
    
    export class FileCut extends Command {

        constructor() {
            super({
                id: AllCommands.fileCut,
                when: WorkbenchContextKey.focusedFileTree,
            });
        }
    
        public override run(provider: IServiceProvider): boolean | Promise<boolean> {
            return __handleCutOrCopy(provider, 'cut');
        }
    }

    export class FileCopy extends Command {
    
        constructor() {
            super({
                id: AllCommands.fileCopy,
                when: WorkbenchContextKey.focusedFileTree,
            });
        }
    
        public override run(provider: IServiceProvider): boolean | Promise<boolean> {
            return __handleCutOrCopy(provider, 'copy');
        }
    }
    
    export class FilePaste extends Command {
    
        private clipboardService!: IClipboardService;
        private fileService!: IFileService;
        private notificationService!: INotificationService;
        private commandService!: ICommandService;

        constructor() {
            super({
                id: AllCommands.filePaste,
                when: WorkbenchContextKey.focusedFileTree,
            });
        }
    
        public override async run(provider: IServiceProvider, destination: FileItem, resources?: URI[]): Promise<boolean> {
            const treeService        = provider.getOrCreateService(IFileTreeService);
            this.clipboardService    = provider.getOrCreateService(IClipboardService);
            const contextService     = provider.getOrCreateService(IContextService);
            this.notificationService = provider.getOrCreateService(INotificationService);
            this.fileService         = provider.getOrCreateService(IFileService);
            this.commandService     = provider.getOrCreateService(ICommandService);

            if (destination.isFile()) {
                this.commandService.executeCommand(AllCommands.alertError, new Error('[FilePaste] Cannot paste resiources to a file.'));
                return false;
            }

            const toPaste = await this.__getResourcesToPaste(resources);
            const isCut = contextService.getContextValue<boolean>(WorkbenchContextKey.fileTreeCutEnabledKey);

            // TODO: metadata updation

            // nothing to paste, nothing happens.
            if (toPaste.length === 0) {
                return false;
            }
            
            try {
                // moving
                if (isCut) {
                    console.log('[filePaster] __doMove');
                    await this.__doMove(toPaste, destination);
                } 
                
                // copying
                else {
                    console.log('[filePaste] __copy');
                    await this.__doCopy(toPaste, destination);
                }
            } 
            catch (error: any) {
                this.commandService.executeCommand(AllCommands.alertError, error);
            }
            finally {
                treeService.simulateSelectionCut(false);
            }
            
            return true;
        }

        private async __getResourcesToPaste(resources?: URI[]): Promise<URI[]> {
            
            /**
             * If no provided resources, fallback to read the sources from the
             * clipboard.
             */
            if (!resources?.length) {
                return await this.clipboardService.read(ClipboardType.Resources);
            }

            // paste the input resources for priority
            return resources;
        }

        private async __doMove(toPaste: URI[], destination: FileItem): Promise<void> {
            
            /**
             * Iterate every pasting items and try to move to the destination. 
             * If any existing files or folders found at the destination, a 
             * window will pop up and ask for user permission if to overwrite.
             */
            for (const resource of toPaste) {
                const resourceName = URI.basename(resource);
                const newDestination = URI.join(destination.uri, resourceName);
                const success = await this.fileService.moveTo(resource, newDestination);

                // complete
                if (success.isOk()) {
                    continue;
                }
                const error = success.unwrapErr();

                // only expect `FILE_EXISTS` error
                if (error.code !== FileOperationErrorType.FILE_EXISTS) {
                    this.commandService.executeCommand(AllCommands.alertError, error);
                }

                // duplicate item found, ask permission from the user.
                const shouldOverwrite = await this.notificationService.confirm(
                    'Overwrite Warning',
                    `An item named ${resourceName} already exists in this location. Do you want to replace it with the one you're moving?`
                );

                if (!shouldOverwrite) {
                    continue;
                }

                await this.fileService.moveTo(resource, newDestination, true).match(
                    noop, 
                    error => this.commandService.executeCommand(AllCommands.alertError, error),
                );
            }
        }

        private async __doCopy(toPaste: URI[], destination: FileItem): Promise<void> {
            
            /**
             * Iterate every selecting items and try to copy to the destination. 
             * If a duplicate item name is encountered, append '_copy' as a 
             * postfix to the name of the copied item.
             */
            for (const resource of toPaste) {
                const resourceName = URI.basename(resource);
                const { name: baseName, ext: extName } = parse(resourceName);

                let newDestination = URI.join(destination.uri, resourceName);
                if (URI.equals(resource, newDestination)) {
                    newDestination = URI.join(destination.uri, `${baseName}_copy${extName}`);
                }
                
                await this.fileService.copyTo(resource, newDestination).match(
                    noop,
                    error => this.commandService.executeCommand(AllCommands.alertError, error),
                );
            }
        }
    }
}

function __handleCutOrCopy(provider: IServiceProvider, type: 'cut' | 'copy'): boolean {
    const service = provider.getOrCreateService(IFileTreeService);
    const clipboard = provider.getOrCreateService(IClipboardService);

    const selections = service.getSelections();
    if (selections.length === 0) {
        return false;
    }

    if (type === 'copy') {
        service.highlightSelectionAsCopy(selections);
    } else {
        service.highlightSelectionAsCut(selections);
    }

    const resources = selections.map(item => item.uri);
    clipboard.write(ClipboardType.Resources, resources);

    return true;
}