interface TranscriptionProps {
    textElement: string;
}

export default function Transcription({ textElement }: TranscriptionProps) {
    return (
        <div className="bg-white p-4 rounded shadow text-left">
            <p>{textElement}</p>
        </div>
    );
}
