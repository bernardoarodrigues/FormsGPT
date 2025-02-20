import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cx } from 'classix';
import { SparklesIcon } from './icons';
import { Markdown } from './markdown';
import { message } from "../../interfaces/interfaces"
import { MessageActions } from '@/components/custom/actions';

export const PreviewMessage = ({ message }: { message: message; }) => {
  const [json, setJson] = useState('');
  const [jsonVisible, setJsonVisible] = useState(false);

  useEffect(() => {
    if (message.role === 'assistant') {
      if(message.content?.includes('```json')) {
        const json = message.content.match(/```json([\s\S]*?)```/)[0];
        if(!json) return;

        setJson(json.substring(8, json.length-4));
        message.content = message.content.replace(json, '');
      }
    }
  }, [message])

  return (
    <motion.div
      className="w-full mx-auto max-w-3xl px-4 group/message"
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      data-role={message.role}
    >
      <div
        className={cx(
          'group-data-[role=user]/message:bg-zinc-700 dark:group-data-[role=user]/message:bg-muted group-data-[role=user]/message:text-white flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl'
        )}
      >
        {message.role === 'assistant' && (
          <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
            <SparklesIcon size={14} />
          </div>
        )}

        <div className="flex flex-col w-full">
          <div className="flex flex-col gap-2 text-left">
            <Markdown>{message.content}</Markdown>
            {json && (jsonVisible ? <>
              <p onClick={() => setJsonVisible(false)} className="cursor-pointer text-blue-500 hover:text-blue-700">Hide JSON</p>
              <Markdown>{"```json\n" + json + "\n```"}</Markdown>
            </> : <>
              <p onClick={() => setJsonVisible(true)} className="mb-2 cursor-pointer text-blue-500 hover:text-blue-700">Show JSON</p>
            </>)}
          </div>
          
          {message.role === 'assistant' && (
            <MessageActions message={message} json={json}/>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export const ThinkingMessage = ({first}) => {
  const role = 'assistant';

  return (
    <motion.div
      className="w-full mx-auto max-w-3xl px-4 group/message "
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 0.2 } }}
      data-role={role}
    >
      <div
        className={cx(
          'flex gap-4 group-data-[role=user]/message:px-3 w-full group-data-[role=user]/message:w-fit group-data-[role=user]/message:ml-auto group-data-[role=user]/message:max-w-2xl group-data-[role=user]/message:py-2 rounded-xl',
          'group-data-[role=user]/message:bg-muted'
        )}
      >
        <div className="size-8 flex items-center rounded-full justify-center ring-1 shrink-0 ring-border">
          <SparklesIcon size={14} />
        </div>
        <div className='flex space-x-0.5 justify-center items-center bg-white dark:bg-transparent'>
          {first ? <p className='text-gray-500'>Parsing document... </p> : <p className='text-gray-500'>Thinking... </p>}
        </div>
      </div>
    </motion.div>
  );
};
