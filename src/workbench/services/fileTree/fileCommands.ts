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
import { FileOperationError, FileOperationErrorType } from "src/base/common/files/file";
import { parse } from "src/base/common/files/path";
import { ICommandService } from "src/platform/command/common/commandService";
import { Arrays } from "src/base/common/utilities/array";
import { IBatchResult } from "src/base/common/undoRedo";
import { OrderChangeType } from "src/workbench/services/fileTree/fileTreeCustomSorter";
import { noop } from "src/base/common/performance";

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
    
        private fileTreeService!: IFileTreeService;
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
            this.fileTreeService     = provider.getOrCreateService(IFileTreeService);
            this.clipboardService    = provider.getOrCreateService(IClipboardService);
            const contextService     = provider.getOrCreateService(IContextService);
            this.notificationService = provider.getOrCreateService(INotificationService);
            this.fileService         = provider.getOrCreateService(IFileService);
            this.commandService      = provider.getOrCreateService(ICommandService);

            if (destination.isFile()) {
                await this.commandService.executeCommand(AllCommands.alertError, 'FilePaste', new Error('Cannot paste on a file.'));
                return false;
            }

            const toPaste  = await this.__getResourcesToPaste(resources);
            const isCut    = contextService.getContextValue<boolean>(WorkbenchContextKey.fileTreeOnCutKey)!;
            const isInsert = contextService.getContextValue<boolean>(WorkbenchContextKey.fileTreeOnInsertKey)!;

            // nothing to paste, nothing happens.
            if (toPaste.length === 0) {
                return false;
            }
            
            // [normal paste]
            if (!isInsert) {
                await this.__doPasteNormal(toPaste, destination, isCut);
                return true;
            }
            
            /**
             * [paste under custom sorting]
             * 
             * Reduces the disk reading when updating custom sorting metadata, 
             * because we are pasting resources grouped by the same parent 
             * at each time.
             */
            // const groups = Arrays.group(toPaste, uri => URI.toString(URI.dirname(uri)));
            // const dragItems = (await this.clipboardService.read<FileItem[]>(ClipboardType.Arbitrary, 'insertItems'))!; // TODO: falsy check
            // const groups = Arrays.group(dragItems, item => item.parent);
            // for (const group of groups.values()) {
            //     const result = await this.__doPasteInsert(group, destination, isCut);
                
            //     if (!result) {
            //         // TODO: even if failed, the partial of 'toPaste' are successed, we need to update that as well.
            //         continue;
            //     }
            // }
            
            return true;
        }

        private async __doPasteNormal(toPaste: URI[], destination: FileItem, isCut: boolean): Promise<void> {
            const batch = isCut 
                    ? await this.__doMove(toPaste, destination) 
                    : await this.__doCopy(toPaste, destination);
            
            if (batch.failed.length === 0) {
                return;
            }

            Arrays.parallelEach([batch.failed, batch.failedError], (failed, error) => {
                const operation = isCut ? 'move' : 'copy';
                const targetName = URI.basename(failed);
                const destinName = URI.basename(destination.uri);

                this.notificationService.notify({ 
                    title: 'FilePaste Fails',
                    message: `Cannot ${operation} ${targetName} to ${destinName}.`,
                    actions: [
                        { label: 'Ok', run: noop },
                        { label: 'Retry', run: () => this.commandService.executeAnyCommand(AllCommands.filePaste, destination, [batch.failed]) }
                    ]
                });
            });
        }

        private async __doPasteInsert(toPaste: FileItem[], destination: FileItem, isCut: boolean): Promise<IBatchResult<URI, FileOperationError>> {
            
            /**
             * [update custom sorting metadata]
             * 
             * Update custom sorting metadata only for successfully processed 
             * resources. 
             *  - e.g, in an operation involving 10 files where 7 succeed and 3 
             *    fail, metadata will only be updated for the 7 successful files, 
             *    leaving the others unchanged.
             */
            const toPasteURI = toPaste.map(item => item.uri);
            const batch = isCut 
                    ? await this.__doMove(toPasteURI, destination) 
                    : await this.__doCopy(toPasteURI, destination);
            
            return batch;

            /**
             * // TODO
             * Use 'ResourceSet' to quick check, which 'toPaste' are passed and 
             * which are not. 
             * 
             * To those who fails, we do nothing to its metadata.
             * 
             * To those who successes, since we are moving them, we find its 
             * current index relative to its parent, we build an array of indice
             * for removing.
             * 
             * We also keep 
             */

            // const passed = batch.passed;
            // if (isCut) {
            //     // todo: client may provide are they ensure these are in the tree?
            //     // const passedItems = 
                

            //     // await this.fileTreeService.updateCustomSortingMetadata(OrderChangeType.Remove, ).unwrap();
            // }
            

            
            // try {
            //     return true;
            // } 
            // // weird error
            // catch (error: any) {
            //     this.commandService.executeCommand(AllCommands.alertError, 'FilePaste', error);
            //     return false;
            // }
            // finally {
            //     // TODO: update onInsert context to false
            //     this.fileTreeService.simulateSelectionCutOrCopy(false);
            // }
        }

        private async __getResourcesToPaste(resources?: URI[]): Promise<URI[]> {
            
            // paste the provided resources for higher priority
            let toPaste: URI[] = resources ?? [];

            /**
             * If no provided resources, fallback to read the sources from the
             * clipboard.
             */
            if (toPaste.length === 0) {
                toPaste = await this.clipboardService.read(ClipboardType.Resources);
            }

            // check parent-child relationship
            const resolvedToPaste = URI.distinctParents(toPaste);
            return resolvedToPaste;
        }

        private async __doMove(toPaste: URI[], destination: FileItem): Promise<IBatchResult<URI, FileOperationError>> {
            const result: IBatchResult<URI, FileOperationError> = {
                passed: [],
                failed: [],
                failedError: [],
            };

            // TODO: seems like if move fails, file or folders got deleted?

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
                    result.passed.push(resource);
                    continue;
                }
                const error = success.unwrapErr();

                // only expect `FILE_EXISTS` error
                if (error.code !== FileOperationErrorType.FILE_EXISTS) {
                    await this.commandService.executeCommand(AllCommands.alertError, 'FilePaste', error);
                    continue;
                }

                // duplicate item found, ask permission from the user.
                const shouldOverwrite = await this.notificationService.confirm(
                    'Overwrite Warning',
                    `An item named ${resourceName} already exists in this location. Do you want to replace it with the one you're moving?`
                );

                if (!shouldOverwrite) {
                    result.failed.push(resource);
                    continue;
                }

                // re-move to overwrite
                const move = await this.fileService.moveTo(resource, newDestination, true);
                if (move.isOk()) {
                    result.passed.push(resource);
                    continue;
                }

                /**
                 * Error happens, we mark it as not completed, let the client to
                 * handle.
                 */
                result.failed.push(resource);
                result.failedError?.push(move.unwrapErr());
            }

            return result;
        }

        private async __doCopy(toPaste: URI[], destination: FileItem): Promise<IBatchResult<URI, FileOperationError>> {
            const result: IBatchResult<URI, FileOperationError> = {
                passed: [],
                failed: [],
                failedError: [],
            };

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
                
                const copy = await this.fileService.copyTo(resource, newDestination);
                
                // complete
                if (copy.isOk()) {
                    result.passed.push(resource);
                    continue;
                }

                /**
                 * Error happens, we mark it as not completed, let the client to
                 * handle.
                 */
                result.failed.push(resource);
                result.failedError?.push(copy.unwrapErr());
            }

            return result;
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