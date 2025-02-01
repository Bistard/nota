import OpenAI from "openai";
import { AI } from "src/platform/ai/common/ai";
import { Disposable } from "src/base/common/dispose";
import { AsyncResult, Result } from "src/base/common/result";
import { panic } from "src/base/common/utilities/panic";
import { nullable } from "src/base/common/utilities/type";
import { ChatCompletionCreateParamsNonStreaming } from "openai/resources";

export class GPTModel extends Disposable implements AI.Text.Model {
    
    // [field]

    public readonly type = AI.Text.ModelType.GPT;
    private _client?: OpenAI;

    // [constructor]

    constructor() {
        super();
    }

    // [public methods]

    public init(opts: AI.Text.IModelOptions): void {
        if (this._client) {
            return;
        }
        this._client = new OpenAI({ ...opts });
    }

    public sendTextRequest(options: ChatCompletionCreateParamsNonStreaming): AsyncResult<AI.Text.Response, Error> {
        const client = this.__assertModel();
        return Result.fromPromise(async () => {
            const completion = await client.chat.completions.create(options);

            const textResponse = this.__constructTextResponse(
                completion.id,
                completion.model,
                () => completion.choices,
                choice => this.__createTextMessage(
                    choice,
                    choice => choice.message.content,
                    choice => choice.message.role,
                    choice => choice.finish_reason,
                ),
                () => completion.usage,
            );

            return textResponse;
        });
    }

    public sendTextRequestStream(
        options: OpenAI.ChatCompletionCreateParamsStreaming,
        onChunkReceived: (chunk: AI.Text.Response) => void,
    ): AsyncResult<void, Error>
    {
        const client = this.__assertModel();

        return Result.fromPromise(async() => {
            const stream = await client.chat.completions.create(options);

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
                    () => chunk.usage,
                );

                onChunkReceived(textResponse);
            }
        });
    }

    public override dispose(): void {
        super.dispose();
    }

    // [private helper methods]

    private __assertModel(): OpenAI {
        if (!this._client) {
            panic(new Error('Try to send request without ai model'));
        }
        return this._client;
    }

    private __createTextMessage<TChoice>(
        choice: TChoice, 
        getContent: (choice: TChoice) => string | nullable,
        getRole: (choice: TChoice) => AI.Text.SingleMessageRole | undefined,
        getFinishReason: (choice: TChoice) => AI.Text.SingleMessageFinishReason | null,
    ): AI.Text.SingleMessage {
        return {
            content: getContent(choice),
            role: getRole(choice),
            finishReason: getFinishReason(choice),
        };
    }

    private __constructTextResponse<TChoice>(
        id: string,
        model: string,
        getChoices: () => TChoice[],
        createTextMessage: (choice: TChoice) => AI.Text.SingleMessage,
        getUsage: () => OpenAI.CompletionUsage | nullable,
    ): AI.Text.Response {
        const choices = getChoices();

        const firstChoice = choices[0];
        if (firstChoice === undefined) {
            panic(new Error("No choices returned in the chunk."));
        }

        const firstMessage = createTextMessage(firstChoice);

        const alternativeMessages: AI.Text.SingleMessage[] = [];
        for (const choice of choices) {
            alternativeMessages.push(createTextMessage(choice));
        }

        return {
            primaryMessage: firstMessage,
            alternativeMessages: alternativeMessages,
            id: id,
            model: model,
            usage: getUsage() ?? undefined,
        };
    }
}