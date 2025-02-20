import { KokoroTTS } from "kokoro-js";

self.onmessage = async function (e) {
    const { text, options } = e.data;

    const model_id = "onnx-community/Kokoro-82M-ONNX";
    const tts = await KokoroTTS.from_pretrained(model_id, {
        dtype: "q8"
    });

    const audio = await tts.generate(text, options);
    const blob = await audio.toBlob();
    const url = URL.createObjectURL(blob);
    self.postMessage(url);
};