import { pipeline, Pipeline } from '@xenova/transformers';
import { MessageTypes } from '../utils/preset';

class MyTranslationPipeline {
    static task = 'translation';
    static model = 'Helsinki-NLP/opus-mt-en-de';
    static instance: Pipeline | null = null;

    static async getInstance(progress_callback?: (data: any) => void): Promise<Pipeline> {
        if (!this.instance) {
            this.instance = (await pipeline(this.task as any, this.model, { progress_callback })) as Pipeline;
        }
        return this.instance;
    }
}

// Worker scope
const workerScope = self as unknown as DedicatedWorkerGlobalScope;

workerScope.addEventListener('message', async (event: MessageEvent) => {
    const { type, text, src_lang, tgt_lang } = event.data;
    if (type === MessageTypes.INFERENCE_REQUEST) {
        await translateText(text, src_lang, tgt_lang);
    }
});

async function translateText(text: string[], src_lang: string, tgt_lang: string) {
    let translator: Pipeline | null = null;
    try {
        translator = await MyTranslationPipeline.getInstance();
    } catch (err: unknown) {
        if (err instanceof Error) console.error(err.message);
    }

    if (!translator) return;

    const output = await translator(text, {
        src_lang,
        tgt_lang,
        callback_function: (x: any) => {
            workerScope.postMessage({
                type: MessageTypes.RESULT_PARTIAL,
                output: translator ? translator.tokenizer.decode(x[0].output_token_ids, { skip_special_tokens: true }) : '',
            });
        },
    });

    workerScope.postMessage({ type: MessageTypes.RESULT, output });
}
