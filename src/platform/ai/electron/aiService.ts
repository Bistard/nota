import { log } from "console";
import { promises } from "dns";
import { Agent } from "http";
import OpenAI from "openai";
import { ReplOptions } from "repl";
import { Disposable, IDisposable } from "src/base/common/dispose";
import { FileOperationError } from "src/base/common/files/file";
import { URI } from "src/base/common/files/uri";
import { jsonSafeParse } from "src/base/common/json";
import { ILogService } from "src/base/common/logger";
import { noop } from "src/base/common/performance";
import { AsyncResult } from "src/base/common/result";
import { StringIterator } from "src/base/common/structures/ternarySearchTree";
import { IFileService } from "src/platform/files/common/fileService";
import { IService } from "src/platform/instantiation/common/decorator";
import { IInstantiationService } from "src/platform/instantiation/common/instantiation";

const enum ModelType {
    GPT,
}

interface IAiCoreService extends IDisposable, IService{

    switchModel(opts: IAiCoreServiceOpts): void;

    sendRequest(message: Array<{role: string; content: string}>, opts: IAiRequestOpts);
}

interface IAiCoreServiceOpts {
    modelType: ModelType,

    apiKey: string
}

export class AICoreService extends Disposable implements IAiCoreService{

    declare _serviceMarker: undefined;

    private _aiModel: IAICoreModel;
    private _modelType: ModelType;

    constructor(opts: IAiCoreServiceOpts,
                @IInstantiationService private readonly instantiationService: IInstantiationService) {
        super();
        this._modelType = opts.modelType;
        this._aiModel = this.__createModelBasedOnType(opts.apiKey);
    }

    public switchModel(opts: IAiCoreServiceOpts): void {
        if (this._modelType === opts.modelType) {
            return;
        }
        this._modelType = opts.modelType;
        this._aiModel = this.__createModelBasedOnType(opts.apiKey);
    }

    public sendRequest(message: Array<{role: string; content: string}>, opts: IAiRequestOpts) {
        this._aiModel.sendRequest(message, opts);
    }

    private __createModelBasedOnType( key: string): IAICoreModel {
        switch (this._modelType) {
            case ModelType.GPT:
                return new GPTModel({apiKey: key})
        }
    }
}

interface IAiRequestOpts {

    /**
     * ID of the model to use. See the
     * [model endpoint compatibility](https://platform.openai.com/docs/models/model-endpoint-compatibility)
     * table for details on which models work with the Chat API.
     */
    model:
    | (string & {})
    | 'gpt-4-0125-preview'
    | 'gpt-4-turbo-preview'
    | 'gpt-4-1106-preview'
    | 'gpt-4-vision-preview'
    | 'gpt-4'
    | 'gpt-4-0314'
    | 'gpt-4-0613'
    | 'gpt-4-32k'
    | 'gpt-4-32k-0314'
    | 'gpt-4-32k-0613'
    | 'gpt-3.5-turbo'
    | 'gpt-3.5-turbo-16k'
    | 'gpt-3.5-turbo-0301'
    | 'gpt-3.5-turbo-0613'
    | 'gpt-3.5-turbo-1106'
    | 'gpt-3.5-turbo-0125'
    | 'gpt-3.5-turbo-16k-0613';


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
     * If set, partial message deltas will be sent, like in ChatGPT. Tokens will be
     * sent as data-only
     * [server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#Event_stream_format)
     * as they become available, with the stream terminated by a `data: [DONE]`
     * message.
     * [Example Python code](https://cookbook.openai.com/examples/how_to_stream_completions).
     */
    stream?: boolean | null;

    /**
     * What sampling temperature to use, between 0 and 2. Higher values like 0.8 will
     * make the output more random, while lower values like 0.2 will make it more
     * focused and deterministic.
     *
     * We generally recommend altering this or `top_p` but not both.
     */
    temperature?: number | null;
}

interface IAICoreModelOpts {

    apiKey: string;

    /**
     * The maximum number of times that the client will retry a request in case of a
     * temporary failure, like a network error or a 5XX error from the server.
     *
     * @default 2
     */
    maxRetries?: number;

    /**
     * The maximum amount of time (in milliseconds) that the client should wait for a response
     * from the server before timing out a single request.
     *
     * Note that request timeouts are retried by default, so in a worst-case scenario you may wait
     * much longer than this timeout before the promise succeeds or fails.
     */
    timeout?: number;

    /**
     * An HTTP agent used to manage HTTP(S) connections.
     *
     * If not provided, an agent will be constructed by default in the Node.js environment,
     * otherwise no agent is used.
     */
    httpAgent?: Agent;
}


interface IAICoreModel extends IDisposable{
    sendRequest(message: Array<{role: string; content: string}>, opts: IAiRequestOpts);
    
}

export class GPTModel extends Disposable implements IAICoreModel {
    
    private _openAi: OpenAI;

    constructor(opts: IAICoreModelOpts,
    ){
        super();
        this._openAi = new OpenAI({ apiKey: opts.apiKey, maxRetries: opts.maxRetries, timeout: opts.timeout, httpAgent: opts.httpAgent});
    }

    public async sendRequest(message: Array<{role: string; content: string}>, opts: IAiRequestOpts) {

    }

    
}