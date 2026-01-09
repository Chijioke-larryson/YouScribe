import { pipeline, Pipeline } from '@xenova/transformers';
import { MessageTypes } from '../utils/preset';

type AudioArray = Float32Array | Blob;

class MyTranscriptionPipeline {
    static task = 'automatic-speech-recognition';
    static model = 'openai/whisper-tiny.en';
    static instance: Pipeline | null = null;

    static async getInstance(progress_callback?: (data: any) => void): Promise<Pipeline> {
        if (!this.instance) {
            this.instance = await pipeline(this.task, this.model, { progress_callback }) as Pipeline;
        }
        return this.instance;
    }
}

// Type the Worker scope
const workerScope = self as unknown as DedicatedWorkerGlobalScope;

workerScope.addEventListener('message', async (event: MessageEvent) => {
    const { type, audio } = event.data;
    if (type === MessageTypes.INFERENCE_REQUEST) {
        await transcribe(audio);
    }
});

async function transcribe(audio: AudioArray) {
    sendLoadingMessage('loading');

    let pipelineInstance: Pipeline | null = null;
    try {
        pipelineInstance = await MyTranscriptionPipeline.getInstance(loadModelCallback);
    } catch (err: unknown) {
        if (err instanceof Error) console.error(err.message);
    }

    if (!pipelineInstance) return;

    sendLoadingMessage('success');

    const stride_length_s = 5;
    const generationTracker = new GenerationTracker(pipelineInstance, stride_length_s);

    await pipelineInstance(audio, {
        top_k: 0,
        do_sample: false,
        chunk_length: 30,
        stride_length_s,
        return_timestamps: true,
        callback_function: generationTracker.callbackFunction.bind(generationTracker),
        chunk_callback: generationTracker.chunkCallback.bind(generationTracker),
    });

    generationTracker.sendFinalResult();
}

async function loadModelCallback(data: any) {
    if (data.status === 'progress') {
        sendDownloadingMessage(data.file, data.progress, data.loaded, data.total);
    }
}

function sendLoadingMessage(status: string) {
    workerScope.postMessage({ type: MessageTypes.LOADING, status });
}

function sendDownloadingMessage(file: string, progress: number, loaded: number, total: number) {
    workerScope.postMessage({ type: MessageTypes.DOWNLOADING, file, progress, loaded, total });
}

class GenerationTracker {
    pipeline: Pipeline;
    stride_length_s: number;
    chunks: any[] = [];
    processed_chunks: any[] = [];
    time_precision: number;
    callbackFunctionCounter: number = 0;

    constructor(pipeline: Pipeline, stride_length_s: number) {
        this.pipeline = pipeline;
        this.stride_length_s = stride_length_s;
        this.time_precision =
            pipeline.processor.feature_extractor.config.chunk_length /
            pipeline.model.config.max_source_positions;
    }

    sendFinalResult() {
        workerScope.postMessage({ type: MessageTypes.INFERENCE_DONE });
    }

    callbackFunction(beams: any[]) {
        this.callbackFunctionCounter += 1;
        if (this.callbackFunctionCounter % 10 !== 0) return;

        const bestBeam = beams[0];
        const text = this.pipeline.tokenizer.decode(bestBeam.output_token_ids, { skip_special_tokens: true });
        const result = {
            text,
            start: this.getLastChunkTimestamp(),
            end: undefined,
        };
        workerScope.postMessage({ type: MessageTypes.RESULT_PARTIAL, result });
    }

    chunkCallback(data: any) {
        this.chunks.push(data);
        const [text, { chunks }] = this.pipeline.tokenizer._decode_asr(this.chunks, {
            time_precision: this.time_precision,
            return_timestamps: true,
            force_full_sequence: false,
        });

        this.processed_chunks = chunks.map((chunk: { text: string; timestamp: [number, number] }, index: number) =>
            this.processChunk(chunk, index)
        );

        workerScope.postMessage({
            type: MessageTypes.RESULT,
            results: this.processed_chunks,
            isDone: false,
            completedUntilTimestamp: this.getLastChunkTimestamp(),
        });
    }

    getLastChunkTimestamp(): number {
        if (this.processed_chunks.length === 0) return 0;
        return this.processed_chunks[this.processed_chunks.length - 1].end ?? 0;
    }

    processChunk(chunk: { text: string; timestamp: [number, number] }, index: number) {
        const [start, end] = chunk.timestamp;
        return {
            index,
            text: chunk.text.trim(),
            start: Math.round(start),
            end: Math.round(end) || Math.round(start + 0.9 * this.stride_length_s),
        };
    }
}
