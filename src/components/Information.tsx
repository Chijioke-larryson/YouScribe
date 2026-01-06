import {useState} from "react";
import Transcription from "./Transcription.tsx";
import Translation from "./Translation.tsx";


const Information = () => {
    const [tab, setTab] = useState('transcription')
    return (


            <main className="flex-1  p-4 flex flex-col gap-3 text-center
             sm:gap-4 justify-center pb-10
              max-w-prose w-full mx-auto">

                <h1 className="font-semibold text-6xl sm:text-5xl whitespace-nowrap">
                    Your<span className="text-blue-400 bold">Transcription</span></h1>

                <div className="grid grid-cols-2  mx-auto bg-white  border-blue-300 shadow
                rounded-full overflow-hidden
                items-center ">
                    <button onClick={() => setTab('transcription')

                    }
                        className={`px-4 py-1  duration-200font-medium ${
                            tab === 'transcription'
                                ? 'bg-blue-400 text-white'
                                : 'text-blue-400 hover:text-blue-600'
                        }`}
                    >
                        Transcription
                    </button>


                    <button  onClick={() => setTab('translation')} className={`px-4 py-1 duration-200 font-medium ${
                        tab === 'translation'
                            ? 'bg-blue-400 text-white'
                            : 'text-blue-400 hover:text-blue-600'
                    }`}>
                        Translation
                    </button>




                </div>
                {tab == 'transcription' ? (
                    <Transcription />
                ): (
                    <Translation />
                )}

            </main>

    )
}
export default Information
