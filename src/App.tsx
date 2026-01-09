import { useState, useRef, useEffect } from "react";
import Header from "./components/Header.tsx";
import FileDisplay from "./components/FileDisplay.tsx";
import HomePage from "./components/HomePage.tsx";
import Information from "./components/Information.tsx";
import Transcribing from "./components/Transcribing.tsx";
import { MessageTypes } from "./utils/preset.ts";

function App() {
    const [file, setFile] = useState<File | null>(null);
    const [audioStream, setAudioStream] = useState<File | null>(null);
    const [output, setOutput] = useState<any>(null);
    const [downloading, setDownloading] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [finished, setFinished] = useState<boolean>(false);

    const isAudioAvailable = file || audioStream;

    function handleAudioReset() {
        setFile(null);
        setAudioStream(null);
    }

    const worker = useRef<Worker | null>(null);

    useEffect(() => {
        if (!worker.current) {
            worker.current = new Worker(
                new URL('./workers/whisper.worker.js', import.meta.url),
                { type: 'module' }
            );
        }

        const onMessageReceived = async (e: MessageEvent) => {
            switch (e.data.type) {
                case 'DOWNLOADING':
                    setDownloading(true);
                    console.log('DOWNLOADING');
                    break;
                case 'LOADING':
                    setLoading(true);
                    console.log('LOADING');
                    break;
                case 'RESULT':
                    setOutput(e.data.results);
                    console.log(e.data.results);
                    break;
                case 'INFERENCE_DONE':
                    setFinished(true);
                    console.log("DONE");
                    break;
            }
        };

        worker.current?.addEventListener('message', onMessageReceived);

        return () => worker.current?.removeEventListener('message', onMessageReceived);
    }, []);

    async function readAudioFrom(file: File) {
        const sampling_rate = 16000;
        const audioCTX = new AudioContext({ sampleRate: sampling_rate });
        const response = await file.arrayBuffer();
        const decoded = await audioCTX.decodeAudioData(response);
        const audio = decoded.getChannelData(0);
        return audio;
    }

    async function handleFormSubmission() {
        if (!file && !audioStream) return;

        const audio = await readAudioFrom(file ? file : audioStream!);
        const model_name = `openai/whisper-tiny.en`;

        worker.current?.postMessage({
            type: MessageTypes.INFERENCE_REQUEST,
            audio,
            model_name
        });
    }

    return (
        <div className="flex flex-col max-w-[1000px] mx-auto w-full">
            <section className="min-h-screen flex flex-col">
                <Header />
                {output ? (
                    <Information output={output} finished={finished} />
                ) : loading ? (
                    <Transcribing />
                ) : isAudioAvailable ? (
                    <FileDisplay
                        handleFormSubmission={handleFormSubmission}
                        handleAudioReset={handleAudioReset}
                        file={file}
                        audioStream={audioStream}
                    />
                ) : (
                    <HomePage setFile={setFile} setAudioStream={setAudioStream} />
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

export default App;
