import OpenAI from "openai";
import { Disposable } from "src/base/common/dispose";
import { InitProtector } from "src/base/common/error";
import { AsyncResult, Result } from "src/base/common/result";
import { panic } from "src/base/common/utilities/panic";
import { ArrayToUnion } from "src/base/common/utilities/type";
import { IAITextModel, IAITextModelOpts, IAIRequestTextMessage, IAIResponseTextMessage, IAITextResponse, IAiTextRequestOpts, MessageResponseRole } from "src/platform/ai/electron/textAI";

export class GPTModel extends Disposable implements IAITextModel {
    
    // [field]

    private _model?: OpenAI;
    private _initProtector: InitProtector;
    private readonly _textValidFinishReasons = ['stop', 'length', 'content_filter'] as const;

    // [constructor]

    constructor() {
        super();
        this._initProtector = new InitProtector();
    }

    // [public methods]

    public init(opts: IAITextModelOpts): void {
        this._initProtector.init('GPTModel cannot initialize twice').unwrap();
        this._model = new OpenAI({ ...opts });
    }

    public sendTextRequest(messages: IAIRequestTextMessage[], opts: IAiTextRequestOpts): AsyncResult<IAITextResponse, Error> {
        const client = this.__assertModel();
        return Result.fromPromise(async () => {
            const completion = await client.chat.completions.create({
                messages: messages,
                stream: false,
                ...opts
            });

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

    public sendTextRequestStream(
        messages: IAIRequestTextMessage[], 
        opts: IAiTextRequestOpts, 
        onChunkReceived: (chunk: IAITextResponse) => void,
    ): AsyncResult<void, Error>
    {
        const client = this.__assertModel();

        return Result.fromPromise(async() => {
            const stream = await client.chat.completions.create({
                messages: messages,
                stream: true,
                ...opts
            });

            for await (const chunk of stream) {
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

    // [private helper methods]

    private __assertFinishReasonValidity<TValidReasons extends readonly string[]>(finishReason: string | null, validReasons: TValidReasons): ArrayToUnion<TValidReasons>{
        if (finishReason === null || !validReasons.includes(finishReason)) {
            panic(new Error(`Text request finished with invalid reason: ${finishReason}`));
        }
        return finishReason;
    }

    private __assertModel(): OpenAI {
        if (!this._model) {
            panic(new Error('Try to send request without ai model'));
        }
        return this._model;
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