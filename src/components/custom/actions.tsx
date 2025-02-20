import { Button } from "@/components/ui/button"
import { Copy, Check, Volume2, CircleStop, CirclePlay } from 'lucide-react'
import { useEffect, useState } from "react"
import { message } from "../../interfaces/interfaces"
import * as PiperTTS from '@mintplex-labs/piper-tts-web';

interface MessageActionsProps {
  message: message
}

const TTS_MODEL = 2;

export function MessageActions({ message, json }: MessageActionsProps) {
  const [copied, setCopied] = useState(false)
  const [tts, setTTS] = useState(false)
  const [audio, setAudio] = useState(null)
  const [utterance, setUtterance] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null);
  const [loadingAudio, setLoadingAudio] = useState(false);

  useEffect(() => {
    if (audioUrl) {
      const audioElement = document.createElement('audio');
      audioElement.controls = true;
      audioElement.autoplay = true;
      audioElement.hidden = true;

      const sourceElement = document.createElement('source');
      sourceElement.src = audioUrl;
      sourceElement.type = 'audio/wav';

      audioElement.addEventListener('ended', () => {
        setTTS(false);
        setAudio(null);
        if (document.body.contains(audioElement)) {
          document.body.removeChild(audioElement);
        }      
      });
      setLoadingAudio(false);
      setAudio(audioElement);

      audioElement.appendChild(sourceElement);
      document.body.appendChild(audioElement);

      return () => {
        if (document.body.contains(audioElement)) {
          document.body.removeChild(audioElement);
        }     
      };
    }
  }, [audioUrl]);

  const generateSpeech = async (text: string) => {
    setLoadingAudio(true);
    try {
      // Create a new Web Worker
      const ttsWorker = new Worker(new URL('../../workers/ttsWorker.js', import.meta.url), { type: 'module' });

      ttsWorker.onmessage = function (e) {
        setAudioUrl(e.data);
      };

      async function generateAudio(msg: string) {
        ttsWorker.postMessage({
            text: msg,
            options: {
                voice: "af_bella",
            },
        });
      }
      generateAudio(text);
      
    } catch (error) {
      setLoadingAudio(false);
      console.error('Error generating speech:', error);
    } 
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content + json)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTTS = async () => {
    if(TTS_MODEL === 0) {
      if ('speechSynthesis' in window == false) {
        console.log('Web Speech API not supported on this browser');
        return;
      }

      const synth = window.speechSynthesis;

      if(!tts) {
        if(utterance) {
          synth.resume()
        } else {
          let utteranceSound = new SpeechSynthesisUtterance(message.content);
          utteranceSound.addEventListener('end', () => {
            setTTS(false)
            setUtterance(null)
          })
          synth.cancel()
          synth.speak(utteranceSound);
          setUtterance(utteranceSound)
        }
      } else {
        synth.pause();
      }
    } else if(TTS_MODEL === 1) {
      if(!tts) 
        if(!audio)
          generateSpeech(message.content);
        else
          audio.play();
      else if(audio)
        audio.pause();
    } else if(TTS_MODEL === 2) {
      if(!tts) 
        if(!audio) {
          try {
            let text = message.content;

            const wav = await PiperTTS.predict({
              text: text,
              voiceId: 'en_US-hfc_female-medium',
            });

            const audio = new Audio();
            audio.src = URL.createObjectURL(wav);
            setAudio(audio);
            audio.play();
            audio.addEventListener('ended', () => {
              setTTS(false);
              setAudio(null);
              if (document.body.contains(audio)) {
                document.body.removeChild(audio);
              }     
            })
          } catch (error) {
              console.error("Error during TTS prediction:", error);
          }
        } else
          audio.play();
      else if(audio)
        audio.pause();
    }
   
    setTTS(!tts)
  }

  return (
    <div className="flex items-center space-x-1">
      <Button variant="ghost" size="icon" onClick={handleCopy}>
        {copied ? (
            <Check className="text-black dark:text-white" size={16} />
        ) : (
            <Copy className="text-gray-500" size={16} />
        )}
      </Button>
      {loadingAudio ? (
        <div role="status" className="pl-1.5">
            <svg aria-hidden="true" className="w-4 h-4 text-white animate-spin dark:text-white fill-black" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
            </svg>
        </div>
      ) : (
        <Button variant="ghost" size="icon" onClick={handleTTS}>
          {tts ? (
              <CircleStop className="text-gray-500" size={16} />
          ) : (utterance || audio) ? (
              <CirclePlay className="text-gray-500" size={16} />
          ) : (
              <Volume2 className="text-gray-500" size={16} />
          )}
        </Button>
      )}
    </div>
  )
}