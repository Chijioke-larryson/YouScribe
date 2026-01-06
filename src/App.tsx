import {useState} from "react";
import Header from "./components/Header.tsx";
import FileDisplay from "./components/FileDisplay.tsx";
import HomePage from "./components/HomePage.tsx";
import Information from "./components/Information.tsx";
import Transcribing from "./components/Transcribing.tsx";

function App() {
    const [file, setFile] = useState(null);
    const [audioStream, setAudioStream] = useState(null);
    const [output, setOutput] = useState(true)
    const [loading, setLoading] = useState(true)

    const isAudioAvailable = !!(file || audioStream);

    function handleAudioReset() {
        setFile(null);
        setAudioStream(null);
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