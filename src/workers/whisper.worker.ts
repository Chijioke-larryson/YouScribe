import { pipeline } from "@xenova/transformers";
import { MessageTypes } from "../utils/preset.ts";

class MyTranscriptionPipeline {
    static task = "automatic-speech-recognition";
    static model = "openai/whisper-tiny.en";
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (!this.instance) {
            this.instance = await pipeline(this.task, this.model, {
                progress_callback,
            });
        }
        return this.instance;
    }
}

self.addEventListener("message", async (event) => {
    if (event.data.type === MessageTypes.INFERENCE_REQUEST) {
        try {
            await transcribe(event.data.audio);
        } catch (err) {
            self.postMessage({
                type: MessageTypes.ERROR,
                error: err instanceof Error ? err.message : String(err),
            });
        }
    }
});

async function transcribe(audio) {
    sendLoadingMessage("loading");

    const asr = await MyTranscriptionPipeline.getInstance(loadModelCallback);

    const tracker = new GenerationTracker(asr, 5);

    await asr(audio, {
        chunk_length_s: 30,
        stride_length_s: 5,
        return_timestamps: true,
        callback_function: tracker.callbackFunction.bind(tracker),
        chunk_callback: tracker.chunkCallback.bind(tracker),
    });

    tracker.sendFinalResult();
}

function loadModelCallback(data) {
    if (data.status === "progress") {
        self.postMessage({
            type: MessageTypes.DOWNLOADING,
            file: data.file,
            progress: data.progress,
            loaded: data.loaded,
            total: data.total,
        });
    }
}

function sendLoadingMessage(status) {
    self.postMessage({
        type: MessageTypes.LOADING,
        status,
    });
}

class GenerationTracker {
    constructor(pipeline, stride_length_s) {
        this.pipeline = pipeline;
        this.stride_length_s = stride_length_s;
        this.chunks = [];
        this.processed_chunks = [];
    }

    callbackFunction(beams) {
        if (!beams?.length) return;

        const bestBeam = beams[0];
        const text = this.pipeline.tokenizer.decode(
            bestBeam.output_token_ids,
            { skip_special_tokens: true }
        );

        self.postMessage({
            type: MessageTypes.RESULT_PARTIAL,
            result: { text },
        });
    }

    chunkCallback(data) {
        this.chunks.push(data);

        const [_, { chunks }] =
            this.pipeline.tokenizer._decode_asr(this.chunks, {
                return_timestamps: true,
            });

        this.processed_chunks = chunks.map((c, i) =>
            this.processChunk(c, i)
        );

        self.postMessage({
            type: MessageTypes.RESULT,
            results: this.processed_chunks,
            isDone: false,
        });
    }

    processChunk(chunk, index) {
        const [start, end] = chunk.timestamp;
        return {
            index,
            text: chunk.text.trim(),
            start: Math.round(start),
            end: Math.round(end ?? start + 1),
        };
    }

    sendFinalResult() {
        self.postMessage({ type: MessageTypes.INFERENCE_DONE });
    }
}
