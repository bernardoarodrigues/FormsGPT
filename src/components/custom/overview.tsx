import { motion } from 'framer-motion';
import { BotIcon } from 'lucide-react';
import { FileUpload } from './fileupload';

export const Overview = ({formsMode, setFormsMode, imageUrl, setImageUrl, pdf, setPdf, setPdfText, image, setImage}) => {
  return (
    <>
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-5"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.2 }}
    >
      <div className="rounded-xl p-30 flex flex-col gap-4 leading-relaxed text-center max-w-xl">
        <p className="flex flex-row justify-center items-center">
          <BotIcon size={44}/>
        </p>
        <div>
          <strong style={{fontSize: 20}}>FormsGPT</strong>
          <p>Fill out forms with the help of an AI assistant</p>
        </div>
      </div>
      {!formsMode && <div className={`flex ${imageUrl ? 'mt-10' : 'mt-[80px]'} rounded-3xl shadow-2xl dark:shadow-muted dark:bg-muted items-center justify-center`}>
        <FileUpload pdf={pdf} setPdf={setPdf} setFormsMode={setFormsMode} imageUrl={imageUrl} setImage={setImage} setImageUrl={setImageUrl} setPdfText={setPdfText} />
      </div>}
    </motion.div>
    </>
  );
};
