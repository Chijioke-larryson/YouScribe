import { useState, useRef, useEffect, ChangeEvent } from 'react';

interface HomePageProps {
    setAudioStream: (audio: Blob) => void;
    setFile: (file: File) => void;
}

export default function HomePage({ setAudioStream, setFile }: HomePageProps) {
    const [recordingStatus, setRecordingStatus] = useState<'inactive' | 'recording'>('inactive');
    const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
    const [duration, setDuration] = useState<number>(0);
    const mediaRecorder = useRef<MediaRecorder | null>(null);

    const mimeType = 'audio/webm';

    async function startRecording() {
        let tempStream: MediaStream;

        try {
            tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (err) {
            console.error((err as Error).message);
            return;
        }

        setRecordingStatus('recording');
        const media = new MediaRecorder(tempStream, { mimeType } as MediaRecorderOptions);
        mediaRecorder.current = media;

        const localChunks: Blob[] = [];
        media.ondataavailable = (event: BlobEvent) => {
            if (event.data && event.data.size > 0) localChunks.push(event.data);
        };

        media.start();
        setAudioChunks(localChunks);
    }

    function stopRecording() {
        setRecordingStatus('inactive');
        if (!mediaRecorder.current) return;

        mediaRecorder.current.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: mimeType });
            setAudioStream(audioBlob);
            setAudioChunks([]);
            setDuration(0);
        };
        mediaRecorder.current.stop();
    }

    useEffect(() => {
        if (recordingStatus !== 'recording') return;
        const interval = setInterval(() => setDuration((d) => d + 1), 1000);
        return () => clearInterval(interval);
    }, [recordingStatus]);

    function handleFileUpload(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) setFile(file);
    }

    return (
        <main className="flex-1 p-4 flex flex-col gap-3 text-center sm:gap-4 justify-center pb-10">
            <h1 className="font-semibold text-5xl sm:text-4xl">
                You<span className="text-blue-400 bold">Scribe</span>
            </h1>

            <button
                onClick={recordingStatus === 'recording' ? stopRecording : startRecording}
                className="flex specialBtn px-4 py-2 rounded-xl items-center text-base justify-between gap-4 mx-auto w-72 max-w-full my-4"
            >
                <p className="text-blue-400">{recordingStatus === 'inactive' ? 'Record' : 'Stop recording'}</p>
                <div className="flex items-center gap-2">
                    {duration !== 0 && <p className="text-sm">{duration}s</p>}
                    <i
                        className={
                            'fa-solid fa-microphone duration-200 ' + (recordingStatus === 'recording' ? 'text-rose-200' : '')
                        }
                    ></i>
                </div>
            </button>

            <p className="text-base">
                Or{' '}
                <label className="text-blue-400 cursor-pointer hover:text-blue-600 duration-200">
                    upload
                    <input
                        type="file"
                        accept=".mp3,.wav"
                        className="hidden"
                        onChange={handleFileUpload}
                    />
                </label>{' '}
                a mp3/wav file
            </p>

            <p className="italic text-slate-400">YouScribe, free now free forever</p>
        </main>
    );
}
