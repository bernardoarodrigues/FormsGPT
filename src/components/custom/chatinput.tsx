import { Button } from "../ui/button";
import { ArrowUpIcon, MicrophoneIcon, MicrophoneOffIcon } from "./icons"
import { toast } from 'sonner';
import { ChangeEvent, useEffect, useRef, useState } from "react";
import 'regenerator-runtime/runtime';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { NotepadText, Copy, Check, LoaderCircle } from "lucide-react";
import { motion } from 'framer-motion';
import { sendPrompt } from "../../api/openai";
import { FILL_FORM_PROMPT } from "../../prompts";
import { pdfform } from './pdfform.js';

interface ChatInputProps {
    question: string;
    setQuestion: (question: string) => void;
    onSubmit: (text?: string) => void;
    isLoading: boolean;
    finalJSON: string | null;
    pdf: any;
    image: any;
    messages: any[];
}

export const ChatInput = ({ question, setQuestion, onSubmit, isLoading, finalJSON, pdf, image, messages, setFinalPdf, setIsOpen }: ChatInputProps) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();

    const handleInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 7 * 24)}px`;
    };
    
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if(question.length === 0) 
            resetTranscript();
    }, [question]);

    async function fillOut(json: string) {
        setLoading(true);
        if (pdfform) {
            const pdfData = await pdf?.arrayBuffer();
            const fieldsPdf = await pdfform().list_fields(pdfData);
            const messageText = FILL_FORM_PROMPT + JSON.stringify(fieldsPdf) + ' \nUSE VALUES FROM:\n' + json;

            let response = await sendPrompt([], messageText, image);
            let formData = JSON.parse(response.content); 
 
            const filledPdf = pdfform().transform(pdfData, formData);
            filledPdf.name = pdf.name;
            const blob = new Blob([filledPdf], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            window.open(url, "_blank");
            setLoading(false);
        } else {
            console.error('pdfform.js is not loaded');
        }
      }

    return(
        <motion.div 
        className="relative w-full flex flex-col gap-4 rounded-3xl"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}>
            <input
            type="file"
            className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
            multiple
            tabIndex={-1}
            />
            
            <div className="flex flex-col min-h-[80px] w-full rounded-3xl shadow-2xl dark:shadow-muted bg-muted px-3 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50">
                <textarea
                    ref={textareaRef}
                    id="message"
                    rows={1}
                    className="w-full focus:outline-none bg-muted resize-none max-h-[168px] min-h-[24px] overflow-y-auto"
                    placeholder="Send a message..."
                    value={question}
                    autoFocus
                    onChange={(e) => {setQuestion(e.target.value); handleInput(e)}}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();

                            if (isLoading) {
                                toast.error('Please wait for the model to finish its response!');
                            } else {
                                onSubmit();
                            }
                        }
                    }}
                    ></textarea>
                    
                <div className="flex pt-4 w-full justify-between">
                    <div className="flex items-center gap-2 justify-center"> 
                        {finalJSON && <Button 
                            className="rounded-full py-1 px-2 h-fit text-white bg-blue-500 hover:bg-blue-600"
                            onClick={() => {
                                fillOut(finalJSON);
                            }}
                            disabled={isLoading}
                        >
                            {loading ? <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            ><LoaderCircle size={14} /></motion.div> : <NotepadText size={14} />}
                            <p>{loading ? 'Processing' : 'Fill out form'}</p>
                        </Button>}
                    </div>

                    <div className="flex items-center gap-2 justify-center">
                        <Button 
                            className="rounded-full p-1.5 h-fit"
                            onClick={() => {
                                if(listening) {
                                    SpeechRecognition.stopListening();

                                    if(transcript.length > 0) {
                                        setQuestion(prev => prev !== '' ? prev + ' ' + transcript : transcript);
                                    }

                                    resetTranscript();
                                } else {
                                    resetTranscript();
                                    SpeechRecognition.startListening({ continuous: true });
                                }
                            }}
                        >
                            {listening ? <MicrophoneOffIcon size={14} /> : <MicrophoneIcon size={14} />}
                        </Button>

                        <Button 
                            className="rounded-full p-1.5 h-fit"
                            onClick={() => onSubmit(question)}
                            disabled={question.length === 0 || isLoading}
                        >
                            <ArrowUpIcon size={14} />
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}