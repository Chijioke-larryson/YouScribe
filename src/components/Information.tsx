import { useState, useEffect, useRef } from 'react';
import Transcription from './Transcription';
import Translation from './Translation';
import { MessageTypes } from '../utils/preset';

interface OutputItem {
    text: string;
}

interface InformationProps {
    output: OutputItem[];
    finished: boolean;
}

export default function Information({ output, finished }: InformationProps) {
    const [tab, setTab] = useState<'transcription' | 'translation'>('transcription');
    const [translation, setTranslation] = useState<string | null>(null);
    const [toLanguage, setToLanguage] = useState<string>('Select language');
    const [translating, setTranslating] = useState<boolean>(false);

    const worker = useRef<Worker | null>(null);

    useEffect(() => {
        if (!worker.current) {
            worker.current = new Worker(new URL('../utils/translate.worker.ts', import.meta.url), {
                type: 'module',
            });
        }

        const handleMessage = (e: MessageEvent) => {
            const data = e.data;
            switch (data.status) {
                case 'initiate':
                case 'progress':
                    break;
                case 'update':
                    setTranslation(data.output);
                    break;
                case 'complete':
                    setTranslating(false);
                    break;
            }
        };

        worker.current.addEventListener('message', handleMessage);
        return () => worker.current?.removeEventListener('message', handleMessage);
    }, []);

    const textElement = tab === 'transcription' ? output.map((val) => val.text).join('\n') : translation || '';

    function handleCopy() {
        navigator.clipboard.writeText(textElement);
    }

    function handleDownload() {
        const file = new Blob([textElement], { type: 'text/plain' });
        const element = document.createElement('a');
        element.href = URL.createObjectURL(file);
        element.download = `Freescribe_${Date.now()}.txt`;
        document.body.appendChild(element);
        element.click();
        element.remove();
    }

    function generateTranslation() {
        if (translating || toLanguage === 'Select language' || !worker.current) return;
        setTranslating(true);

        worker.current.postMessage({
            type: MessageTypes.INFERENCE_REQUEST,
            text: output.map((val) => val.text),
            src_lang: 'eng_Latn',
            tgt_lang: toLanguage,
        });
    }

    return (
        <main className="flex-1 p-4 flex flex-col gap-3 text-center sm:gap-4 justify-center pb-20 max-w-prose w-full mx-auto">
            <h1 className="font-semibold text-4xl sm:text-5xl md:text-6xl whitespace-nowrap">
                Your <span className="text-blue-400 bold">Transcription</span>
            </h1>

            <div className="grid grid-cols-2 sm:mx-auto bg-white rounded overflow-hidden items-center p-1 blueShadow border-[2px] border-solid border-blue-300">
                <button
                    onClick={() => setTab('transcription')}
                    className={`px-4 py-1 rounded duration-200 ${tab === 'transcription' ? 'bg-blue-300 text-white' : 'text-blue-400 hover:text-blue-600'}`}
                >
                    Transcription
                </button>
                <button
                    onClick={() => setTab('translation')}
                    className={`px-4 py-1 rounded duration-200 ${tab === 'translation' ? 'bg-blue-300 text-white' : 'text-blue-400 hover:text-blue-600'}`}
                >
                    Translation
                </button>
            </div>

            <div className="my-8 flex flex-col-reverse max-w-prose w-full mx-auto gap-4">
                {(!finished || translating) && (
                    <div className="grid place-items-center">
                        <i className="fa-solid fa-spinner animate-spin"></i>
                    </div>
                )}
                {tab === 'transcription' ? (
                    <Transcription textElement={textElement} />
                ) : (
                    <Translation
                        textElement={textElement}
                        toLanguage={toLanguage}
                        translating={translating}
                        setToLanguage={setToLanguage}
                        generateTranslation={generateTranslation}
                    />
                )}
            </div>

            <div className="flex items-center gap-4 mx-auto">
                <button onClick={handleCopy} title="Copy" className="bg-white hover:text-blue-500 duration-200 text-blue-300 px-2 aspect-square grid place-items-center rounded">
                    <i className="fa-solid fa-copy"></i>
                </button>
                <button onClick={handleDownload} title="Download" className="bg-white hover:text-blue-500 duration-200 text-blue-300 px-2 aspect-square grid place-items-center rounded">
                    <i className="fa-solid fa-download"></i>
                </button>
            </div>
        </main>
    );
}
