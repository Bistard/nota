import type * as OpenAI from "openai";
import type { IAITextService } from "src/platform/ai/common/aiText";
import { IpcChannel, type IChannel, type IServerChannel } from "src/platform/ipc/common/channel";
import { panic } from "src/base/common/utilities/panic";
import { AI } from "src/platform/ai/common/ai";
import { Emitter, Register } from "src/base/common/event";
import { Disposable } from "src/base/common/dispose";
import { IIpcService } from "src/platform/ipc/browser/ipcService";
import { Blocker } from "src/base/common/utilities/async";
import { AIError } from "src/base/common/error";
import { AsyncResult, Result } from "src/base/common/result";

const enum AITextCommand {
    switchModel = 'switchModel',
    updateAPIKey = 'updateAPIKey',
    sendRequest = 'sendRequest',
    sendRequestStream = 'sendRequestStream',
}

export class MainAITextChannel extends Disposable implements IServerChannel {
    
    // [constructor]

    constructor(
        private readonly mainAITextService: IAITextService,
    ) {
        super();
    }

    // [public methods]
    
    public async callCommand(_id: string, command: AITextCommand, arg: any[]): Promise<any> {
        switch (command) {
            case AITextCommand.switchModel: return this.__switchModel(arg[0]);
            case AITextCommand.updateAPIKey: return this.__updateAPIKey(arg[0], arg[1], arg[2]);
            case AITextCommand.sendRequest: return this.__sendRequest(arg[0]);
            default: panic(`main-ai-text channel - unknown file command ${command}`);
        }
    }

    public registerListener(_id: string, event: never, arg: any[]): Register<any> {
        switch (event) {
            case AITextCommand.sendRequestStream: return this.__sendRequestStream(arg[0]);
        }
        panic(`Event not found: ${event}`);
    }

    // [private methods]

    private async __switchModel(options: AI.Text.IModelOptions): Promise<void> {
        return this.mainAITextService.switchModel(options);
    }

    private async __updateAPIKey(newKey: string, modelType: AI.Text.ModelType | null, persisted?: boolean): Promise<void> {
        return this.mainAITextService.updateAPIKey(newKey, modelType, persisted);
    }

    private async __sendRequest(options: OpenAI.OpenAI.ChatCompletionCreateParamsNonStreaming): Promise<AI.Text.Response> {
        return this.mainAITextService.sendRequest(options).unwrap();
    }

    private __sendRequestStream(options: OpenAI.OpenAI.ChatCompletionCreateParamsStreaming): Register<AI.Text.Response> {
        const emitter = this.__register(new Emitter<AI.Text.Response>({}));

        this.mainAITextService.sendRequestStream(options, response => {
            emitter.fire(response);
            
            // finished for some reason, clean up.
            if (response.primaryMessage.finishReason !== null) {
                this.release(emitter);
            }
        })
        .mapErr(error => {
            this.release(emitter);
            return error;
        })
        .unwrap();

        return emitter.registerListener;
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

    public async updateAPIKey(newKey: string, modelType: AI.Text.ModelType | null, persisted?: boolean): Promise<void> {
        await this._channel.callCommand(AITextCommand.updateAPIKey, [newKey, modelType, persisted]);
    }

    public sendRequest(options: OpenAI.OpenAI.ChatCompletionCreateParamsNonStreaming): AsyncResult<AI.Text.Response, AIError> {
        return Result.fromPromise(() => {
            return this._channel.callCommand(AITextCommand.sendRequest, [options]);
        });
    }

    public sendRequestStream(options: OpenAI.OpenAI.ChatCompletionCreateParamsStreaming, onChunkReceived: (chunk: AI.Text.Response) => void): AsyncResult<void, AIError> {
        const blocker = new Blocker<void>();
        
        const listener = this._channel.registerListener<AI.Text.Response>(AITextCommand.sendRequestStream, [options]);
        const disconnect = this.__register(listener(response => {
            onChunkReceived(response);

            // finished for some reason, clean up.
            if (response.primaryMessage.finishReason !== null) {
                blocker.resolve();
                this.release(disconnect);
            }
        }));

        return Result.fromPromise(() => blocker.waiting());
    }
}