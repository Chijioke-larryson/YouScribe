import {useState, useRef, useEffect} from "react";
import Header from "./components/Header.tsx";
import FileDisplay from "./components/FileDisplay.tsx";
import HomePage from "./components/HomePage.tsx";
import Information from "./components/Information.tsx";
import Transcribing from "./components/Transcribing.tsx";
import { MessageTypes } from "../utils/preset.ts";



function App() {
    const [file, setFile] = useState(null);
    const [audioStream, setAudioStream] = useState(null);
    const [output, setOutput] = useState(null)
    const [loading, setLoading] = useState(false)
    const [finished , setFinished ] = useState(false)
    const [downloading, setDownloading] = useState(false)
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState(null);



    const isAudioAvailable = !!(file || audioStream);

    function handleAudioReset() {
        setFile(null);
        setAudioStream(null);
    }

    const worker  = useRef(null)

    useEffect(() => {
        if (!worker.current){
            worker.current = new Worker(new URL('./utils/whisper.worker.ts', import.meta.url),{
                type: 'module'
            })
        }
        const onMessageReceived = async (e) => {
            switch (e.data.type) {
                case 'DOWNLOADING' :
                    setDownloading(true)
                    console.log('Downloading')
                    break;
                case 'LOADING' :
                    setLoading(true)
                    console.log('Loading')
                    break;
                case 'RESULT' :

                    setOutput(e.data.results)

                    break;
                case 'INFERENCE_DONE' :
                    setFinished(true)
                    console.log("DONE")
                    break;

                case "INFERENCE_ERROR":
                    setFinished(true);
                    setStatus("error");

                    const errorMsg =
                        message?.error ?? "Something went wrong during inference";

                    setError(errorMsg);
                    console.error(errorMsg);
                    break;


                case "IDLE":
                    setStatus("idle");
                    setFinished(false);
                    setError(null);
                    break;
            }

        }
        worker.current.addEventListener('message', onMessageReceived)

        return () => worker.current.removeEventListener('message', onMessageReceived)


    }, []);


    async function readAudioFrom(file){
        const sampling_rate = 1600
        const audioCTX = new AudioContext({sampleRate: sampling_rate})
        const response = await file.arrayBuffer()
        const decoded = await audioCTX.decodeAudioData(response)
        const audio = decoded.getChannelData(0)
        return audio
    }

    async function  handleFormSubmission() {
        if(!file && !audioStream) {return}

        let audio = await readAudioFrom(file ? file : audioStream)
        const model_name  = `openai/whisper-tiny.en`

        worker.current.postMessage({
            type: MessageTypes.INFERENCE_REQUEST,
            audio,
            model_name
        })
    }
    return (
        <div className="flex flex-col p-4 max-v-[1000px] mx-auto w-full">
            <section className="min-h-screen flex-col">
                <Header />
                { output ? (
                    <Information />
                ): loading ? (
                    <Transcribing/>
                ): isAudioAvailable ? (
                    <FileDisplay
                        file={file}
                        audioStream={audioStream}
                        handleAudioReset={handleAudioReset}
                    />

                ): (
                    <HomePage
                        setFile={setFile}
                        setAudioStream={setAudioStream}
                    />

                )}


            </section>

            <footer>
                <p className="flex mx-auto items-center justify-center gap-2">
                    Built By{" "}
                    <span className="text-blue-400">
            <a
                href="https://github.com/Chijioke-larryson"
                target="_blank"
                rel="noopener noreferrer"
            >
              <b>Larryson Chijioke</b>
            </a>
          </span>
                </p>
            </footer>
        </div>
    );
}
 export default App