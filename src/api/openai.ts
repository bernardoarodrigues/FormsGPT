
import OpenAI from "openai";
const openai = new OpenAI({apiKey: import.meta.env.VITE_OPENAI_API_KEY, dangerouslyAllowBrowser: true});

export const sendPrompt = async (history: any[], messageText: string, messageImage: string|null = null) => {
    const userContent = [
        { type: "text", text: messageText }
    ];
    
    if (messageImage) {
        userContent.push({
            type: "image_url",
            image_url: {
                url: messageImage
            }
        });
    }

    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            ...history,
            {
                role: "user",
                content: userContent
            }
        ],
        store: true
    });
    
    return completion.choices[0].message;
}