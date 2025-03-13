import { ChatInput } from "@/components/custom/chatinput";
import { PreviewMessage, ThinkingMessage } from "../../components/custom/message";
import { useScrollToBottom } from '@/components/custom/use-scroll-to-bottom';
import { useEffect, useState } from "react";
import { message } from "../../interfaces/interfaces"
import { Overview } from "@/components/custom/overview";
import { Header } from "@/components/custom/header";
import { v4 as uuidv4 } from 'uuid';
import { sendPrompt } from "@/api/openai";
import { JSON_PROMPT, DIALOG_PROMPT, FINAL_TOKEN, SYSTEM_PROMPT } from "@/prompts";

export function Chat() {
  const [messagesContainerRef, messagesEndRef] = useScrollToBottom<HTMLDivElement>();
  const [messages, setMessages] = useState<message[]>([]);
  const [question, setQuestion] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [finalJSON, setFinalJSON] = useState(null);
  const [history, setHistory] = useState([{ role: "system", content: SYSTEM_PROMPT }]);
  const [formsMode, setFormsMode] = useState<boolean>(false);
  const [pdfText, setPdfText] = useState(null);
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState<File | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const [pdf, setPdf] = useState<File | null>(null);
  const [finalPdf, setFinalPdf] = useState<File | null>(null);

  useEffect(() => {
    async function send() {
      if(image && pdfText) {
        if(isLoading) return;
        const messageText = JSON_PROMPT + "///// FORM TEXT: " + pdfText;
        setIsLoading(true);

        const traceId = uuidv4();
        setMessages([]);

        let firstResponse = await sendPrompt([], messageText, image);

        let firstMsgs = [{ content: [
          { type: "text", text: messageText },
          {
            type: "image_url",
            image_url: {
                url: image
            }
          }], role: "user"}, { content: firstResponse.content, role: "assistant"}];
        setHistory(firstMsgs);

        const messageText2 = DIALOG_PROMPT;
        let secondResponse = await sendPrompt(firstMsgs, messageText2, image);

        setHistory(prev => [...prev, { content: messageText2, role: "user"}, { content: secondResponse.content, role: "assistant"}]);

        setMessages(prev => {
          const lastMessage = prev[prev.length - 1];
          const newContent = lastMessage?.role === "assistant" 
            ? lastMessage.content + secondResponse.content ? secondResponse.content : ''
            : secondResponse.content ? secondResponse.content : '';
          
          const newMessage = { content: newContent, role: "assistant", id: traceId };
          return lastMessage?.role === "assistant"
            ? [...prev.slice(0, -1), newMessage]
            : [...prev, newMessage];
        });

        setIsLoading(false);
      }
    }
    send()
  }, [image, pdfText]);

  async function handleSubmit(text?: string) {
    if (isLoading) return;

    const messageText = text || question;
    setQuestion("");
    setIsLoading(true);
    
    const traceId = uuidv4();
    setMessages(prev => [...prev, { content: messageText, role: "user", id: traceId }]);

    try {
      const response = await sendPrompt(history, messageText);
      setIsLoading(false);

      if(formsMode && response.content?.includes(FINAL_TOKEN)) {
        const jsonMatches = response.content.match(/```json[\s\S]*?```/g);
        const finalJson = jsonMatches ? jsonMatches[0] : '';
        setFinalJSON(finalJson.substring(8, finalJson.length-4));
        setIsOpen(true);

        setHistory(prev => [...prev, { content: messageText, role: "user"}, { content: "Information collected successfully!\n" + finalJson, role: "assistant"}]);
        setMessages(prev => [...prev, {content: "Information collected successfully!\n" + finalJson, role: "assistant", id: traceId }]);

        return;
      }

      setHistory(prev => [...prev, { content: messageText, role: "user"}, { content: response.content, role: "assistant"}]);

      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        const newContent = lastMessage?.role === "assistant" 
          ? lastMessage.content + response.content ? response.content : ''
          : response.content ? response.content : '';
        
        const newMessage = { content: newContent, role: "assistant", id: traceId };
        return lastMessage?.role === "assistant"
          ? [...prev.slice(0, -1), newMessage]
          : [...prev, newMessage];
      });
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="flex flex-col min-w-0 h-dvh bg-background">
      <Header title={messages.length > 0}/>
      <div className="flex flex-col min-w-0 gap-6 flex-1 overflow-y-scroll pt-4" ref={messagesContainerRef}>
        {messages.length == 0 && <Overview pdf={pdf} setPdf={setPdf} image={image} setImage={setImage} formsMode={formsMode} setFormsMode={setFormsMode} setPdfText={setPdfText} imageUrl={imageUrl} setImageUrl={setImageUrl}/>}

        {messages.map((message, index) => (
          <PreviewMessage key={index} message={message} />
        ))}
        {isLoading && <ThinkingMessage first={messages.length==0}/>}
        <div ref={messagesEndRef} className="shrink-0 min-w-[24px] min-h-[24px]"/>
      </div>

      {formsMode && <div className="flex mx-auto px-4 bg-background pb-4 md:pb-6 gap-2 w-full md:max-w-3xl rounded-3xl">
        <ChatInput  
          question={question}
          setQuestion={setQuestion}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          finalJSON={finalJSON}
          pdf={pdf}
          setFinalPdf={setFinalPdf}
          image={image}
          messages={messages}
          setIsOpen={setIsOpen}
        />
      </div>}
    </div>
  );
};