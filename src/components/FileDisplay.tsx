

export default function FileDisplay(props) {

    const {handleAudioReset, file, audioStream, handleFormSubmission} = props

    return (
        <main className="flex-1  p-4 flex flex-col gap-3 text-center sm:gap-4 justify-center pb-10 sm:w-96 w-fit w-72 max-w-full mx-auto">

            <h1 className="font-semibold text-6xl sm:text-5xl">Your<span className="text-blue-400 bold">File</span></h1>
            <div className="  flex flex-col text-left my-4">
            <h3 className="font-semibold">Name</h3>
            <p>{ file ? file?.name : 'Custom audio'}</p>
            </div>
            <div className=" flex items-center justify-between gap-4">
                <button onClick={handleAudioReset} className="text-slate-400 hover:text-blue-600 duration-200">Reset
                </button>
                <button onClick={handleFormSubmission} className="specialBtn  px-3 p-2 rounded-lg text-blue-400 flex items-center gap-2 font-medium ">
                    <p>Transcribe</p>
                    <i className="fa-solid fa-microphone-lines text-sm"></i>


                </button>


            </div>

        </main>
    )
}
