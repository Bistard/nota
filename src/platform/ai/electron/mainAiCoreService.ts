import { Disposable, IDisposable } from "src/base/common/dispose";
import { AsyncResult } from "src/base/common/result";
import { GPTModel, IAICoreModelOpts } from "src/platform/ai/electron/gptModel";
import { IService, createService } from "src/platform/instantiation/common/decorator";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";

export const IAiCoreService = createService<IAiCoreService>('ai-core-service');

const enum ModelType {
    GPT,
}

export type MessageRequestRole = 'system' | 'user' | 'assistant';
export type MessageResponseRole = 'system' | 'user' | 'assistant' | 'tool';

export interface IAIRequestTextMessage {

    role: MessageRequestRole;

    content: string;
}

export interface IAIResponseTextMessage {

    role?: MessageResponseRole;

    content?: string | null;

    readonly finishReason: 'stop' | 'length' | 'content_filter';
}

export interface IAICoreModel extends IDisposable {
    init(opts: IAICoreModelOpts);
    sendTextRequest(message: IAIRequestTextMessage[], opts: IAiTextRequestOpts): AsyncResult<IAITextResponse, Error>;
}

export interface IAIRequestTokenUsage {
    /**
     * Number of tokens in the generated completion.
     */
    completionTokens: number;

    /**
     * Number of tokens in the prompt.
     */
    promptTokens: number;

    /**
     * Total number of tokens used in the request (prompt + completion).
     */
    totalTokens: number;
}

export interface IAITextResponse {
    
    // The primary or dominant message from the first choice
    readonly primaryMessage: IAIResponseTextMessage;

    // Messages from the other choices provided by the API
    readonly alternativeMessages?: IAIResponseTextMessage[];

    readonly id: string;

    readonly model: string;

    readonly usage?: IAIRequestTokenUsage;
}

export interface IAiCoreService extends IDisposable, IService {
    init(IAICoreModelOpts): void;

    switchModel(opts: IAiCoreServiceOpts): void;

    sendRequest(message: IAIRequestTextMessage[], opts: IAiTextRequestOpts): AsyncResult<IAITextResponse, Error>;
}

interface IAiCoreServiceOpts {
    modelType: ModelType,
}

export interface IAiTextRequestOpts {

    /**
     * ID of the model to use. See the
     * [model endpoint compatibility](https://platform.openai.com/docs/models/model-endpoint-compatibility)
     * table for details on which models work with the Chat API.
     */
    readonly model:
    | 'gpt-4-turbo-preview'
    | 'gpt-4'
    | 'gpt-4-32k'
    | 'gpt-3.5-turbo'
    | 'gpt-3.5-turbo-16k';

    /**
     * The maximum number of [tokens](/tokenizer) that can be generated in the chat
     * completion.
     *
     * The total length of input tokens and generated tokens is limited by the model's
     * context length.
     * [Example Python code](https://cookbook.openai.com/examples/how_to_count_tokens_with_tiktoken)
     * for counting tokens.
     */
    max_tokens?: number | null;


    /**
     * What sampling temperature to use, between 0 and 2. Higher values like 0.8 will
     * make the output more random, while lower values like 0.2 will make it more
     * focused and deterministic.
     *
     * We generally recommend altering this or `top_p` but not both.
     */
    temperature?: number | null;
}

export class MainAiCoreService extends Disposable implements IAiCoreService {

    declare _serviceMarker: undefined;

    private _aiModel: IAICoreModel;
    private _modelType: ModelType;

    constructor(opts: IAiCoreServiceOpts,
                @IInstantiationService private readonly instantiationService: IInstantiationService) {
        super();
        this._modelType = opts.modelType;
        this._aiModel = this.__createModelBasedOnType();
    }

    public init(opts: IAICoreModelOpts) {
        this._aiModel.init(opts);
    }


    public switchModel(opts: IAiCoreServiceOpts): void {
        if (this._modelType === opts.modelType) {
            return;
        }
        this._modelType = opts.modelType;
        this._aiModel.dispose();
        this._aiModel = this.__createModelBasedOnType();
    }

    public sendRequest(message: IAIRequestTextMessage[], opts: IAiTextRequestOpts): AsyncResult<IAITextResponse, Error> {
        return this._aiModel.sendTextRequest(message, opts);
    }

    private __createModelBasedOnType(): IAICoreModel {
        let model: IAICoreModel;
        switch (this._modelType) {
            case ModelType.GPT:
                return new GPTModel();
        }
    }
}


