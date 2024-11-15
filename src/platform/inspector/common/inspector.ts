import type { IWindowInstance } from "src/platform/window/electron/windowInstance";
import type { IConfigurationChangeEvent } from "src/platform/configuration/common/abstractConfigurationService";
import type { IContextChangeEvent } from "src/platform/context/common/contextService";
import { createService, IService } from "src/platform/instantiation/common/decorator";

export const IMainInspectorService = createService<IMainInspectorService>('main-inspector-service');
export const IBrowserInspectorService = createService<IBrowserInspectorService>('browser-inspector-service');

/**
 * An interface only for {@link MainInspectorService}.
 */
export interface IMainInspectorService extends IService {
    start(window: IWindowInstance): void;
    stop(window: IWindowInstance): void;
}

export interface IBrowserInspectorService extends IService {
    startListening(): void;
    
    start(): void;
    stop(): void;
}

export const enum InspectorDataType {
    Configuration = 'configuration',
    ContextKey = 'contextKey',
}

export type InspectorDataEvent = 
    InspectorConfigurationChange 
    | InspectorContextKeyChange;

type InspectorConfigurationChange = {
    readonly type: InspectorDataType.Configuration;
    readonly changes: Exclude<IConfigurationChangeEvent, 'affect' | 'match'>[];
};

type InspectorContextKeyChange = {
    readonly type: InspectorDataType.ContextKey;
    readonly changes: IContextChangeEvent[];
};