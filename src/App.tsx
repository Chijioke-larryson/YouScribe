import { useState } from 'react'
import HomePage from "./components/HomePage.tsx";
import Header from "./components/Header.tsx";
import FileDisplay from "./components/FileDisplay.tsx";

function App() {
  const [file, setFile] = useState(null)
    const [audioStream, setAudioStream] = useState(null)

    const isAudioAvailable = file || audioStream

    const boolCheck = !!file;


    function handleAudioReset() {
      setFile(null)
        setAudioStream(null)
    }

  return (
      <div className="flex flex-col p-4 max-v-[1000px] mx-auto w-full">
          <section className="min-h-screen flex-col">
           <Header />
              { boolCheck ? (
                  <FileDisplay file={file} audioStream={setAudioStream}/>

              ) :(
                  <HomePage  setFile={setFile}
                  setAudioStream={setAudioStream}
                  /> )
              }
          </section>
          <h1 className="text-green-600"> Hello</h1>
          <footer></footer>
      </div>


  )
}

export default App
