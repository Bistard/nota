import type * as OpenAI from "openai";
import type { IAITextService } from "src/platform/ai/common/aiText";
import { IpcChannel, type IChannel, type IServerChannel } from "src/platform/ipc/common/channel";
import { panic } from "src/base/common/utilities/panic";
import { AI } from "src/platform/ai/common/ai";
import { Register } from "src/base/common/event";
import { Disposable } from "src/base/common/dispose";
import { IIpcService } from "src/platform/ipc/browser/ipcService";
import { ChatCompletionCreateParamsNonStreaming, ChatCompletionCreateParamsStreaming } from "openai/resources";

const enum AITextCommand {
    switchModel = 'switchModel',
    updateAPIKey = 'updateAPIKey',
    sendRequest = 'sendRequest',
    sendRequestStream = 'sendRequestStream',
}

export class MainAITextChannel implements IServerChannel {
    
    // [constructor]

    constructor(
        private readonly mainAITextService: IAITextService,
    ) {}

    // [public methods]
    
    public async callCommand(_id: string, command: AITextCommand, arg: any[]): Promise<any> {
        switch (command) {
            case AITextCommand.switchModel: return this.__switchModel(arg[0]);
            case AITextCommand.updateAPIKey: return this.__updateAPIKey(arg[0], arg[1], arg[2]);
            case AITextCommand.sendRequest: return this.__sendRequest(arg[0]);
            case AITextCommand.sendRequestStream: return this.__sendRequestStream(arg[0], arg[1]);
            default: panic(`main-ai-text channel - unknown file command ${command}`);
        }
    }

    public registerListener<T>(_id: string, event: never, arg?: any[]): Register<T> {
        panic(`Event not found: ${event}`);
    }

    // [private methods]

    private async __switchModel(options: AI.Text.IModelOptions): Promise<void> {
        return this.mainAITextService.switchModel(options);
    }

    private async __updateAPIKey(newKey: string, modelType: AI.Text.ModelType | null, presisted?: boolean): Promise<void> {
        return this.mainAITextService.updateAPIKey(newKey, modelType, presisted);
    }

    private async __sendRequest(options: OpenAI.OpenAI.ChatCompletionCreateParamsNonStreaming): Promise<AI.Text.Response> {
        return this.mainAITextService.sendRequest(options);
    }

    private async __sendRequestStream(options: OpenAI.OpenAI.ChatCompletionCreateParamsStreaming, onChunkReceived: (chunk: AI.Text.Response) => void): Promise<void> {
        // FIX
        panic('Method not implemented yet');
    }
}

export class BrowserAITextChannel extends Disposable implements IAITextService {

    declare _serviceMarker: undefined;

    // [fields]

    private readonly _channel: IChannel;

    // [constructor]

    constructor(
        @IIpcService ipcService: IIpcService,
    ) {
        super();
        this._channel = ipcService.getChannel(IpcChannel.AIText);
    }

    // [public methods]

    public async init(): Promise<void> {
        panic('Method not supported in browser.');
    }

    public async switchModel(options: AI.Text.IModelOptions): Promise<void> {
        await this._channel.callCommand(AITextCommand.switchModel, [options]);
    }

    public async updateAPIKey(newKey: string, modelType: AI.Text.ModelType | null, presisted?: boolean): Promise<void> {
        await this._channel.callCommand(AITextCommand.updateAPIKey, [newKey, modelType, presisted]);
    }

    public async sendRequest(options: ChatCompletionCreateParamsNonStreaming): Promise<AI.Text.Response> {
        return this._channel.callCommand(AITextCommand.sendRequest, [options]);
    }

    public async sendRequestStream(options: ChatCompletionCreateParamsStreaming, onChunkReceived: (chunk: AI.Text.Response) => void): Promise<void> {
        panic('Method not supported in browser.');
    }
}