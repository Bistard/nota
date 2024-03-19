import OpenAI from "openai";
import { Disposable } from "src/base/common/dispose";
import { AsyncResult, Result } from "src/base/common/result";
import { Agent } from "http";
import { panic } from "src/base/common/utilities/panic";
import { ArrayToUnion } from "src/base/common/utilities/type";
import { IAICoreModel, IAICoreModelOpts, IAIRequestTextMessage, IAIRequestTokenUsage, IAIResponseTextMessage, IAITextResponse, IAiTextRequestOpts, MessageResponseRole } from "src/platform/ai/electron/ai";

export class GPTModel extends Disposable implements IAICoreModel {
    
    private _openAi?: OpenAI;
    private readonly _textValidFinishReasons = ['stop', 'length', 'content_filter'] as const;

    constructor(
    ){
        super();
    }

    public init(opts: IAICoreModelOpts): void {
        this._openAi = new OpenAI({ ...opts });
    }

    public sendTextRequest(messages: IAIRequestTextMessage[], opts: IAiTextRequestOpts): AsyncResult<IAITextResponse, Error> {
        const client = this.__assertModel();
        return Result.fromPromise<IAITextResponse, Error>(async () => {
            const completion = await client.chat.completions.create({
                messages: messages,
                stream: false,
                ...opts
            });
            
            // const firstChoice = completion.choices[0];
            // if (firstChoice === undefined) {
            //     panic (new Error("No choices returned in the completion."));
            // }
            // const firstMessage = firstChoice.message;

            // const alternativeMessages: IAIResponseTextMessage[] = 
            // completion.choices.slice(1).map(choice => ({
            //     content: choice.message.content,
            //     role: choice.message.role,
            //     finishReason: this.__assertFinishReasonValidity(choice.finish_reason, this._textValidFinishReasons)
            // }));

            // const tokenUsage = this.__processTokenUsage(completion.usage);

            // const textResponse: IAITextResponse = {
            //     primaryMessage: {
            //         content: firstMessage.content, 
            //         role: firstMessage.role, 
            //         finishReason: this.__assertFinishReasonValidity(firstChoice.finish_reason, this._textValidFinishReasons)},
            //     alternativeMessages: alternativeMessages,
            //     usage: tokenUsage,
            //     id: completion.id,
            //     model: completion.model,
            // };
            const textResponse = this.__constructTextResponse(
                completion.id,
                completion.model,
                () => completion.choices,
                choice => this.__createTextMessage(
                    choice,
                    choice => choice.message.content,
                    choice => choice.message.role,
                    choice => choice.finish_reason,
                )
            );
            return textResponse;
        });
    }

    //TODO
    public sendTextRequestStream(
        messages: IAIRequestTextMessage[], 
        opts: IAiTextRequestOpts, 
        onChunkReceived: (chunk: IAITextResponse) => void) 
    {
        const client = this.__assertModel();

        return Result.fromPromise<void, Error>(async() => {
            const stream = await client.chat.completions.create({
                messages: messages,
                stream: true,
                ...opts
            });

            for await (const chunk of stream) {
                // const firstChoice = chunk.choices[0];
                // if (firstChoice === undefined) {
                //     panic(new Error("No choices returned in the chunk."));
                // }

                // const firstMessage = this.__createCompletionChunkTextMessage(firstChoice);
                // const alternativeMessages = 
                //     chunk.choices.slice(1).map(choice => this.__createCompletionChunkTextMessage(choice));

                // const textResponse: IAITextResponse = {
                //     primaryMessage: firstMessage,
                //     alternativeMessages: alternativeMessages,
                //     id: chunk.id,
                //     model: chunk.model,
                // };
                const textResponse = this.__constructTextResponse(
                    chunk.id,
                    chunk.model,
                    () => chunk.choices,
                    choice => this.__createTextMessage(
                        choice,
                        choice => choice.delta.content,
                        choice => choice.delta.role,
                        choice => choice.finish_reason,
                    ),
                );

                onChunkReceived(textResponse);
            }
        });
    }

    private __assertFinishReasonValidity<TValidReasons extends readonly string[]>(finishReason: string | null, validReasons: TValidReasons): ArrayToUnion<TValidReasons>{
        if (finishReason === null || !validReasons.includes(finishReason)) {
            panic(new Error(`Text request finished with invalid reason: ${finishReason}`));
        }
        return finishReason;
    }

    private __assertModel(): OpenAI {
        if (!this._openAi) {
            panic(new Error('Try to send request without ai model'));
        }
        return this._openAi;
    }

    private __processTokenUsage(usage?: OpenAI.Completions.CompletionUsage): IAIRequestTokenUsage | undefined {
        if (!usage) return undefined;
        return {
            completionTokens: usage.completion_tokens,
            promptTokens: usage.prompt_tokens,
            totalTokens: usage.total_tokens
        };
    }

    private __createTextMessage<TChoice>(
        choice: TChoice, 
        getContent: (choice: TChoice) => string | null | undefined,
        getRole: (choice: TChoice) => MessageResponseRole | undefined,
        getFinishReason: (choice: TChoice) => string | null,
    ): IAIResponseTextMessage {
        return {
            content: getContent(choice),
            role: getRole(choice),
            finishReason: this.__assertFinishReasonValidity(getFinishReason(choice), this._textValidFinishReasons)
        };
    }

    private __constructTextResponse<TChoice>(
        id: string,
        model: string,
        getChoices: () => TChoice[],
        createTextMessage: (choice: TChoice) => IAIResponseTextMessage,
    ): IAITextResponse {
        const choices = getChoices();

        const firstChoice = choices[0];
        if (firstChoice === undefined) {
            panic(new Error("No choices returned in the chunk."));
        }

        const firstMessage = createTextMessage(firstChoice);

        const alternativeMessages: IAIResponseTextMessage[] = [];
        for (const choice of choices) {
            alternativeMessages.push(createTextMessage(choice));
        }

        return {
            primaryMessage: firstMessage,
            alternativeMessages: alternativeMessages,
            id: id,
            model: model,
        };
    }
}