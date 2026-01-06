// try {
//     // inference logic
// } catch (err) {
//     self.postMessage({
//         type: "INFERENCE_ERROR",
//         error: err instanceof Error ? err.message : String(err),
//     });
// }

import { pipeline } from "@xenova/transformers"
import {MessageTypes} from "./preset";
import transcribing from "../src/components/Transcribing";

class MyTranscriptionPipeline {
    static task = 'automatic-speech-recognition'
    static model = 'openai/whisper-tiny.en'
    static instance = null

    static async getInstance(progress_callback = null){

         if (this.instance === null ) {
             this.instance = await pipeline(this.task, null, {
                 progress_callback
             })
        }
         return this.instance
    }
}

self.addEventListener('message', async(event) => {
    const { type, audio } = event.data
    if (type === MessageTypes.INFERENCE_REQUEST){
        await transcribe(audio)
    }
})
async function  transcribe(audio) {
    sendLoadingMessage('Loading..')

    let pipeline

    try{
        pipeline = await MyTranscriptionPipeline.getInstance(load_model_callback)
    }catch (e) {
        console.log(e.message)
    }

    sendLoadingMessage('Success..')

    const stride_length_s = 5
    const generationTracker = new GenerationTracker(pipeline, stride_length_s)
    await pipeline(audio,{
        top_k: 0,
        do_sample: false,
        chunk_length = 30,
        stride_length_s,
        return_timestamps: true,
        callBck_function = generationTracker.callbackFunction.bind(generationTracker),
        chunk_callback: generationTracker.chunkCallback.bind(generationTracker)
    })

    generationTracker.sendFinalResult()
}


async function load_model_callback(data) {
    const { status } = data
    if ( status === 'progress' ) {
        const { file, progress, loaded, total } = data
        sednDownloadingMessage(file, progress, loaded, total )
    }
}

function  sendLoadingMessage(status){
    self.postMessage({
        types: MessageTypes.LOADING,
        status
    })
}

async function  sednDownloadingMessage(file, progress, loaded, total ){
    self.postMessage({
        type:MessageTypes.DOWNLOADING,
        file,
        progress,
        loaded,
        total
    })
}

