import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "../../workers/pdf.worker.min.mjs?url";
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export const FileUpload = ({imageUrl, setImageUrl, pdf, setPdf, setPdfText, setImage, setFormsMode}) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadPdf() {
      if (pdf) {
        const pdfData = await pdf.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument(pdfData).promise;
        const page = await pdfDoc.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        const imgData = canvas.toDataURL("image/png");
        setImageUrl(imgData);
        const textContent = await page.getTextContent();
        const text = textContent.items.map((item) => item.str).join(" ");
        setPdfText(text);
      }
    }
    loadPdf();
  }, [pdf]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    setPdf(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target.files && e.target.files[0]) {
      setPdf(e.target.files[0]);
    }
  };

  return (
    <div
      className={`rounded-3xl ${imageUrl ? 'p-5' : 'py-[80px] px-[150px]'} text-center 
        ${dragActive ? 'border-2 border-dashed border-blue-500 bg-blue-50 dark:bg-gray-800' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={handleChange}
        className="hidden"
      />
      {imageUrl ? (
        <div>
          <img
            src={imageUrl}
            alt="Preview"
            className="max-w-xs max-h-[400px] mx-auto mb-4 rounded-2xl"
          />
          <button
            onClick={() => {
              setImage(imageUrl);
              setFormsMode(true)
            }}
            className="text-blue-500 hover:text-blue-700 mr-5"
          >
            Accept
          </button>
          <button
            onClick={() => {setImage(null); setImageUrl(null); setPdf(null); setPdfText('')}}
            className="text-red-500 hover:text-red-700"
          >
            Remove
          </button>
        </div>
      ) : (
        <div>
          <button
            onClick={() => inputRef.current?.click()}
            className="bg-blue-500 rounded-3xl py-2 px-5 mb-3 text-white hover:bg-blue-400"
          >
            Upload pdf form
          </button>
          <p>or drop a file</p>
        </div>
      )}
    </div>
  );
};