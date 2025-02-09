'use client';

import { useChat } from 'ai/react';
import { UserCard } from '@/components/ui/userCard';
import { BotCard } from '@/components/ui/botCard';
import { FaPaperPlane, FaRobot } from 'react-icons/fa';
import Image from 'next/image';
import { motion } from "motion/react"
import { useEffect, useState } from 'react';
import { TbFaceIdError } from "react-icons/tb";

const ExampleQuestions = [
  'What are design files?',
  'How to use the toolbar?',
  'How to use the properties panel with edit access'
]

export default function Chat() {

  const [error, setError] = useState(false);
  const { messages, input, handleInputChange, handleSubmit, append } = useChat({ maxSteps: 5, onError: () => setError(true) });

  // useEffect(() => {
  //   if (messages.length > 0) {
  //     setError(false);
  //   }
  // }, [messages]);

  return (
    <div className="flex flex-col w-screen h-screen stretch overflow-hidden bg-[url('/background_full.jpg')] bg-cover bg-center relative">
      <div className='flex flex-col justify-center items-start bg-white bg-opacity-30 h-full'>
        <div className="flex flex-col justify-center items-center w-full p-4 space-y-1 shadow-lg z-2 relative bg-[#74859744]">
          <h1 className="font-gabarito text-2xl md:text-3xl font-bold text-black">Figma AI Assistant</h1>
          <p className="font-afacad text-[#232323] text-center">Ask Figma documentation and get answers in seconds.</p>
        </div>
        <div className="space-y-4 overflow-y-auto px-3 md:px-2 pt-4 pb-24 w-full flex-1 z-2">
          <div className='bg-gray-200 rounded-md p-4 border border-gray-300 overflow-x-auto opacity-90'>
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full mr-2 flex items-center justify-center"><Image src='/bot_icon.png' alt='logo' width={32} height={32} /></div>
              <div className="font-bold">AI</div>
            </div>
            <p className="font-afacad text-lg">Hello, I&apos;m your Figma AI Assistant. How can I help you today?</p>
          </div>
          {messages.map(m => (
            <motion.div key={m.id} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }}>
              <div className="whitespace-pre-wrap z-2">
                {m.role === 'user' ? <UserCard message={m} /> : <BotCard message={m} />}
              </div>
            </motion.div>
          ))}
          {messages.length === 0 && ExampleQuestions.map(q => (
            <motion.div key={q} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }}>
              <div className="whitespace-pre-wrap z-2 bg-[#474d5dcc] rounded-md p-[10px] text-[#ababab] text-center shadow-md cursor-pointer" onClick={() => append({ role: 'user', content: q })}>
                {q}
              </div>
            </motion.div>
          ))}
          {error && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }}>
            <div className="whitespace-pre-wrap z-2 bg-red-400/90 rounded-md p-[10px] text-red-950 text-center shadow-md cursor-pointer flex flex-col items-center justify-center">
              <div className="flex items-center justify-center space-x-2">
                <TbFaceIdError size={32} />
                <div className="text-2xl font-bold">Oops!</div>
              </div>
              <div className="text-lg">I'm sorry, something went wrong. Please try again.</div>
            </div>
          </motion.div>}
        </div>
        <form onSubmit={(event) => { handleSubmit(event); }} className="fixed bottom-0 right-2 left-2 md:mx-auto md:max-w-screen-sm lg:max-w-screen-md p-2 mb-4 md:mb-8 border border-gray-300 bg-white rounded-md shadow-xl flex items-center">
          <input
            className="w-full p-2"
            value={input}
            placeholder="Type your question here..."
            onChange={handleInputChange}
          />
          <button type="submit" className="ml-2 p-2 bg-black text-white rounded hover:bg-gray-800">
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );
}
