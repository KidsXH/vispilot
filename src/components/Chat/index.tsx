'use client'

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useAppDispatch, useAppSelector} from "@/store";
import {addMessage, selectMessages, selectModel, selectState, setState} from "@/store/features/ChatSlice";
import {Message} from "@/types";
import Image from "next/image";

const Chat = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector(selectState);
  const model = useAppSelector(selectModel);
  const messages = useAppSelector(selectMessages);
  const messageDivRef = useRef<HTMLDivElement>(null);

  const [inputText, setInputText] = useState('')

  const handleSendMessage = useCallback((inputText: string) => {
    // Add message to the chat
    const lastMessageID = messages[messages.length - 1].id
    const newMessage: Message = {
      id: lastMessageID + 1,
      role: 'user',
      sender: 'user',
      content: [{type: 'text', text: inputText}],
    }
    dispatch(setState('waiting'))
    dispatch(addMessage(newMessage))
    setTimeout(() => {
      const responseMessage: Message = {
        id: lastMessageID + 2,
        role: 'model',
        sender: 'model',
        content: [{type: 'text', text: 'I am a model!'}],
      }
      dispatch(addMessage(responseMessage))
      dispatch(setState('idle'))
    }, 1000)
  }, [dispatch, messages])

  useEffect(() => {
    if (messageDivRef.current) {
      messageDivRef.current.scrollTop = messageDivRef.current.scrollHeight;
    }
  }, [state])

  return (
    <div className='flex flex-col p-2'>
      <div className='font-bold text-xl'>Chat</div>
      <div className='flex flex-col h-[530px] overflow-y-scroll no-scrollbar' ref={messageDivRef}>
        {messages.map((message) => {
          return (
            <div
              key={message.id}
              className={`flex my-2
                ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <MessageBox message={message}/>
            </div>
          );
        })}
        {
          state === 'waiting' &&
            <div className='flex justify-center mb-2'>
            <span className='animate-spin rounded-full material-symbols-outlined'>
              progress_activity
            </span>
            </div>
        }
      </div>
      <div className='flex flex-col space-y-2'>
        <input
          type='text'
          className='w-full p-2 border border-gray-300 rounded'
          placeholder='Type your message...'
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage(inputText);
              setInputText('');
            }
          }}
        />
        <div className='flex flex-row-reverse space-x-1 items-center'>
          <div
            className='material-symbols-outlined cursor-pointer select-none rounded hover:bg-neutral-200 p-1 text-neutral-600'>
            upload_file
          </div>
          <div
            className='material-symbols-outlined cursor-pointer select-none rounded hover:bg-neutral-200 p-1 text-neutral-600'>
            export_notes
          </div>
          <div
            className='mr-auto py-0.5 px-2 bg-gray-200 text-sm rounded-sm cursor-pointer select-none hover:bg-gray-100 text-neutral-600'>To: {model}</div>
        </div>
      </div>
    </div>
  );
};

export default Chat;

const MessageBox = ({message}: { message: Message }) => {
  return (
    <div
      className={`flex flex-col rounded p-2 max-w-60
        ${message.sender === 'user' ? 'bg-blue-200' : 'bg-gray-200 w-60'}`}
    >
      {message.content.map((content, index) =>
        <div key={index} className={`break-words hyphens-auto`}>
          {
            content.type === "text" ?
              content.text :
              <Image className='w-[250px] h-[140px] mt-2' src={content.image_url!.url} width={250} height={140} alt={'sketch'}/>
          }
        </div>
      )}
    </div>
  );
};
