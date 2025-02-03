import OpenAI from "openai";
import { AI } from "src/platform/ai/common/ai";
import { Disposable } from "src/base/common/dispose";
import { AsyncResult, Result } from "src/base/common/result";
import { panic } from "src/base/common/utilities/panic";
import { nullable } from "src/base/common/utilities/type";
import { ChatCompletionCreateParamsNonStreaming } from "openai/resources";

/**
 * @description Abstract base class for OpenAI-compatible text generation models.
 */
export abstract class TextSharedOpenAIModel extends Disposable implements AI.Text.Model {
    
    // [field]

    public readonly abstract type: AI.Text.ModelType;

    // [constructor]

    constructor(
        protected readonly client: OpenAI,
    ) {
        super();
    }

    // [getter]

    get apiKey() { return this.client.apiKey; }

    // [abstract methods]

    protected abstract __createNonStreamingSingleMessage(choice: OpenAI.Chat.Completions.ChatCompletion.Choice): AI.Text.SingleMessage;
    protected abstract __createStreamingSingleMessage(choice: OpenAI.Chat.Completions.ChatCompletionChunk.Choice): AI.Text.SingleMessage;

    // [public methods]

    public sendTextRequest(options: ChatCompletionCreateParamsNonStreaming): AsyncResult<AI.Text.Response, Error> {
        return Result.fromPromise(async () => {
            const completion = await this.client.chat.completions.create(options);

            const textResponse = this.__createResponse(
                completion.id,
                completion.model,
                () => completion.choices,
                choice => this.__createNonStreamingSingleMessage(choice),
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
        return Result.fromPromise(async() => {
            const stream = await this.client.chat.completions.create(options);

            for await (const chunk of stream) {
                const textResponse = this.__createResponse(
                    chunk.id,
                    chunk.model,
                    () => chunk.choices,
                    choice => this.__createStreamingSingleMessage(choice),
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

    private __createResponse<TChoice>(
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