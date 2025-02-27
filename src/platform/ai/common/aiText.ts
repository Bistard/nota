/* eslint-disable local/code-interface-check */
import type * as OpenAI from "openai";
import type { AI } from "src/platform/ai/common/ai";
import { Disposable } from "src/base/common/dispose";
import { createService, IService } from "src/platform/instantiation/common/decorator";
import { nullable } from "src/base/common/utilities/type";
import { AsyncResult } from "src/base/common/result";
import { AIError } from "src/base/common/error";

/**
 * // TODO: doc
 */
export namespace AIText {

    /**
     * // TODO
     */
    export type ModelIDs = 
        | OpenAI.OpenAI.ChatModel 
        | 'deepseek-chat' 
        | 'deepseek-reasoner';

    /**
     * An option for constructing a {@link AI.Text.Model}.
     */
    export interface IModelOptions extends OpenAI.ClientOptions {
        /**
         * Indicates the name of constructing text model.
         */
        readonly name: AI.ModelName;
    
        /**
         * The private key to connect to the server.
         */
        readonly apiKey: string;
    
        /**
         * The maximum number of times that the client will retry a request in case of a
         * temporary failure, like a network error or a 5XX error from the server.
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
    }

    /**
     * The actual data model for handling text communication with LLM.
     */
    export interface Model extends AI.ILLMModel {
        readonly modality: AI.Modality.Text;
        sendRequest(options: OpenAI.OpenAI.ChatCompletionCreateParamsNonStreaming): AsyncResult<AI.Text.Response, AIError>;
        sendRequestStream(options: OpenAI.OpenAI.ChatCompletionCreateParamsStreaming, onChunkReceived: (chunk: AI.Text.Response) => void): AsyncResult<void, AIError>;
    }

    /**
     * A standardized object of text response from LLM.
     */
    export interface Response {
        /**
         * The primary or dominant message from the first choice.
         */
        readonly primaryMessage: AI.Text.SingleMessage;

        /**
         * Messages from the other choices provided by the API.
         */
        readonly alternativeMessages?: AI.Text.SingleMessage[];
        readonly id: string;
        readonly model: string;
        readonly usage?: OpenAI.OpenAI.CompletionUsage;
    }

    export type SingleMessageRole = 'system' | 'user' | 'assistant' | 'tool';
    export type SingleMessageFinishReason = 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'function_call' | null;
    export interface SingleMessage {
        readonly role?: AI.Text.SingleMessageRole;
        readonly finishReason: AI.Text.SingleMessageFinishReason;
        readonly content: string | nullable;
        
        /**
         * Supported in DeepSeek-reasoner.
         */
        readonly reasoning_content: string | nullable;
    }
}

export const IAITextService = createService<IAITextService>('ai-text-service');
export interface IAITextService extends Disposable, IService {
    init(): Promise<void>;
    switchModel(options: AI.Text.IModelOptions): Promise<void>;
    updateAPIKey(newKey: string, name: AI.ModelName | null, persisted?: boolean): Promise<void>;
    sendRequest(options: OpenAI.OpenAI.ChatCompletionCreateParamsNonStreaming): AsyncResult<AI.Text.Response, AIError>;
    sendRequestStream(options: OpenAI.OpenAI.ChatCompletionCreateParamsStreaming, onChunkReceived: (chunk: AI.Text.Response) => void): AsyncResult<void, AIError>;
}
