import { Agent } from "openai/_shims";
import { Disposable } from "src/base/common/dispose";
import { AsyncResult } from "src/base/common/result";
import { createService, IService } from "src/platform/instantiation/common/decorator";

export const enum TextModelType {
    GPT = 'GPT',
    DeepSeek = 'DeepSeek',
}

export type MessageRequestRole  = 'system' | 'user' | 'assistant';
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

export interface IAITextModel extends Disposable {
    init(opts: IAITextModelOpts): void;
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

export const IAITextService = createService<IAITextService>('ai-text-service');

export interface IAITextService extends Disposable, IService {
    init(IAITextModelOpts: IAITextModelOpts): void;

    switchModel(opts: IAITextServiceOpts): void;

    sendRequest(message: IAIRequestTextMessage[], opts: IAiTextRequestOpts): AsyncResult<IAITextResponse, Error>;
}

export interface IAITextServiceOpts {
    readonly type: TextModelType;
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

export interface IAITextModelOpts {

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