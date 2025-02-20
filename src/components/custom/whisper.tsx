import { useEffect, useState, useRef } from "react";
import { MicrophoneIcon, MicrophoneOffIcon } from "./icons";
import { Button } from "../ui/button";

const IS_WEBGPU_AVAILABLE = !!navigator.gpu;
const WHISPER_SAMPLING_RATE = 16_000;
const MAX_AUDIO_LENGTH = 30; // seconds
const MAX_SAMPLES = WHISPER_SAMPLING_RATE * MAX_AUDIO_LENGTH;

const WhisperButton = ({setQuestion}) => {
    const streamRef = useRef(null);
    const worker = useRef<Worker | null>(null);
    const recorderRef = useRef(null);

    const [status, setStatus] = useState<string | null>(null);
    const [text, setText] = useState("");
    const [language, setLanguage] = useState("en");

    const [listening, setListening] = useState(false);
    const [loading, setLoading] = useState(false);

    const [recording, setRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [chunks, setChunks] = useState([]);
    const audioContextRef = useRef(null);

    if(!IS_WEBGPU_AVAILABLE) return null;

    useEffect(() => {
        if (!worker.current) {
            // Create the worker if it does not yet exist.
            worker.current = new Worker(new URL("../../workers/sttWorker.js", import.meta.url), {
                type: "module",
            });
        }
    
        // Create a callback function for messages from the worker thread.
        const onMessageReceived = (e) => {
            switch (e.data.status) {
                case "loading": {
                    setLoading(true);
                    setStatus("loading");
                    break;
                }
        
                case "ready": {
                    setLoading(false);
                    setStatus("ready");
                    recorderRef.current?.start();

                    setListening(true);
                    worker.current.postMessage({ type: "start" });
                    break;
                }
        
                case "start": {
                    setIsProcessing(true);

                    // Request new data from the recorder
                    recorderRef.current?.requestData();
                    break;
                }

                case "stop": {
                    recorderRef.current?.stop();
                    break;
                }
        
                case "complete": {
                    setIsProcessing(false);
                    setText(e.data.output);
                    break;
                }

                default: {
                    console.warn("[Whisper] Unhandled message type:", e.data);
                    break;
                }
            }
        };
    
        // Attach the callback function as an event listener.
        worker.current.addEventListener("message", onMessageReceived);
    }, []);
      
    async function loadMic() {
        if (recorderRef.current) return; // Already set
    
        if (navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices
                .getUserMedia({ audio: true })

            streamRef.current = stream;
                
            recorderRef.current = new MediaRecorder(stream);
            audioContextRef.current = new AudioContext({
                sampleRate: WHISPER_SAMPLING_RATE,
            });
    
            recorderRef.current.onstart = () => {
                setRecording(true);
                setChunks([]);
            };
            recorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    setChunks((prev) => [...prev, e.data]);
                } else {
                    // Empty chunk received, so we request new data after a short timeout
                    setTimeout(() => {
                        recorderRef.current.requestData();
                    }, 25);
                }
            };
    
            recorderRef.current.onstop = () => {
                setRecording(false);
            };
                
        } else {
            console.error("getUserMedia not supported on your browser!");
        }
    }
    
    useEffect(() => {
        if (!recorderRef.current) return;
        if (!recording) return;
        if (isProcessing) return;
        if (status !== "ready") return;
    
        if (chunks.length > 0) {
            // Generate from data
            const blob = new Blob(chunks, { type: recorderRef.current.mimeType });
        
            const fileReader = new FileReader();
        
            fileReader.onloadend = async () => {
                const arrayBuffer = fileReader.result;
                const decoded =
                await audioContextRef.current.decodeAudioData(arrayBuffer);
                let audio = decoded.getChannelData(0);
                if (audio.length > MAX_SAMPLES) {
                    // Get last MAX_SAMPLES
                    audio = audio.slice(-MAX_SAMPLES);
                }
        
                worker.current.postMessage({
                    type: "generate",
                    data: { audio, language },
                });
            };
            fileReader.readAsArrayBuffer(blob);
        } else {
            console.log("Getting user media");
            recorderRef.current?.requestData();
        }
    }, [status, recording, isProcessing, chunks, language]);

    // Add stop function
    const stopRecording = async () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            recorderRef.current = null;
        }
    };

    return (
        <div>
            <Button 
                className="rounded-full mr-2 p-1.5 h-fit border dark:border-zinc-600"
                onClick={async () => {
                    if(listening) {
                        if(text.length > 0) {
                            setQuestion(prev => prev !== '' ? prev + ' ' + text : text);
                        }

                        setListening(false);
                        worker.current.postMessage({ type: "stop" });
                        await stopRecording();
                    } else {
                        setLoading(true);
                        await loadMic()
                        worker.current.postMessage({ type: "load" });
                    }
                }}
            >
                {loading ?
                <div role="status">
                    <svg aria-hidden="true" className="w-8 h-8 text-white animate-spin dark:text-white fill-black" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                    </svg>
                </div> :
                listening ? <MicrophoneOffIcon size={14} /> : <MicrophoneIcon size={14} />}
            </Button>
        </div>
    )
}

export default WhisperButton