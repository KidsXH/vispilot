'use client'

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {useAppDispatch, useAppSelector} from "@/store";
import {
  addMessage,
  clearMessages, removeLastQA,
  selectMessages,
  selectModel,
  selectState,
  setState
} from "@/store/features/ChatSlice";
import {Message} from "@/types";
import Image from "next/image";
import {sendRequest} from "@/model";
import {resetDataSource, selectDataSource, setVegaString} from "@/store/features/DataSlice";
import {parseResponseTextAsJson} from "@/model/Gemini";
import {addHistory, clearHistory} from "@/store/features/HistorySlice";
import ConfigModal from "@/components/Chat/ConfigModal";

const Chat = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector(selectState);
  const model = useAppSelector(selectModel);
  const messages = useAppSelector(selectMessages);
  const messageDivRef = useRef<HTMLDivElement>(null);
  const dataSource = useAppSelector(selectDataSource);

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(true);
  const [inputText, setInputText] = useState('')

  const handleSendMessage = useCallback((inputText: string) => {
    // Add message to the chat
    // const lastMessageID = messages[messages.length - 1]?.id || 0;
    const newMessage: Message = {
      id: Date.now(),
      role: 'user',
      sender: 'user',
      content: [{type: 'text', text: inputText}],
    }
    dispatch(setState('waiting'))
    dispatch(addMessage(newMessage))

    sendRequest([...messages, newMessage], model).then((response) => {
      dispatch(addMessage(response))
      dispatch(setState('idle'))
    })
  }, [dispatch, messages, model])

  const handleExportChat = useCallback(() => {
    // Export chat messages to a json file
    const blob = new Blob([JSON.stringify(messages)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'chat.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [messages])

  useEffect(() => {
    if (messageDivRef.current) {
      messageDivRef.current.scrollTop = messageDivRef.current.scrollHeight;
    }
  }, [state])

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'assistant') {
      const parsedText = parseResponseTextAsJson(lastMessage.content[0].text!);
      if (parsedText && parsedText.vega) {
        const vegaString = JSON.stringify(parsedText.vega);
        dispatch(setVegaString(vegaString));

        if (vegaString.length > 2) {
          dispatch(addHistory({type: 'model', content: vegaString}))
        }
      }
    }
    if (lastMessage && lastMessage.sender === 'user' && lastMessage.content[0].type === 'text') {
      const textContent = lastMessage.content[0].text || '';
      dispatch(addHistory({type: 'chat', content: textContent}));
    }
    if (lastMessage && messages.length === 2) {
      dispatch(addHistory({type: 'chat', content: 'Start'}));
    }
  }, [dispatch, messages])

  return (
    <div className='flex flex-col p-2 pt-1 h-full'>
      <div className='flex items-center'>
        <div className='font-bold text-xl'>Chat</div>

        <div
          className='flex items-center gap-0.5 px-2 cursor-pointer select-none rounded hover:bg-neutral-200 p-0.5 text-neutral-400 hover:text-neutral-600 ml-auto'
          title='New Chat'
          onClick={() => {
            dispatch(clearHistory());
            dispatch(clearMessages());
            dispatch(resetDataSource());
            dispatch(setVegaString(''));
          }}
        >
          {/*<span className='material-symbols-outlined' style={{fontSize: 18}}>delete</span>*/}
          <span className='text-sm font-bold'>Clear</span>
        </div>
      </div>
      <div className='2k:h-[530px] grow min-h-0'>
      {
        dataSource.filename === '-' ?
          <div className='flex items-center justify-center h-full gap-2  text-gray-400 text-sm font-bold'>
            <span className='material-symbols-outlined'>smart_toy</span>
            <div className=''>: Please upload a data table to start.</div>
          </div> :
          <div className='flex flex-col h-full overflow-y-scroll no-scrollbar' ref={messageDivRef}>
            {messages.filter((message) => message.sender !== 'system')
              .map((message) => {
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
            <span className='animate-spin rounded-full material-symbols-outlined select-none'>
              progress_activity
            </span>
                </div>
            }
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
            className='material-symbols-outlined cursor-pointer select-none rounded hover:bg-neutral-200 p-1 text-neutral-600'
            title={'Withdraw'}
            onClick={() => {
              dispatch(removeLastQA())
            }}
          >
            fast_rewind
          </div>
          <div
            className='material-symbols-outlined cursor-pointer select-none rounded hover:bg-neutral-200 p-1 text-neutral-600'
            title={'Export Chat'}
            onClick={handleExportChat}
          >
            export_notes
          </div>
          <div
            className='mr-auto py-0.5 px-2 bg-gray-200 text-sm rounded-sm cursor-pointer select-none hover:bg-gray-100 text-neutral-600'
            onClick={() => setIsConfigModalOpen(true)}
          >
            To: {model.name}
          </div>

          <ConfigModal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)}/>
        </div>
      </div>
    </div>
  );
};

export default Chat;

const MessageBox = ({message}: { message: Message }) => {
  const dispatch = useAppDispatch();
  return (<>
    <div className='flex flex-col max-w-72'>
      <div
        className={`flex flex-col rounded p-2 max-w-72
        ${message.sender === 'user' ? 'bg-blue-200' : 'bg-gray-200 w-72'}`}
      >
        {message.content.map((content, index) =>
          <div key={index} className={`break-words hyphens-auto whitespace-break-spaces`}>
            {
              content.type === "text" ?
                (message.role === 'assistant' ? parseResponseTextAsJson(content.text!)?.chat : content.text) :
                <Image className='w-[270px] h-[150px]' src={content.image!} width={270} height={150}
                       alt={'sketch'}/>
            }
          </div>
        )}
      </div>
      {message.sender === 'assistant' &&
          <div className='flex items-center justify-end gap-1 max-w-72 mt-0.5 text-xs text-neutral-400'>
            {parseResponseTextAsJson(message.content[0].text!)?.vega && <>
                <button className='hover:underline cursor-pointer'
                        title={'View Visualization'}
                        onClick={() => {
                          const parsedText = parseResponseTextAsJson(message.content[0].text!);
                          if (parsedText) {
                            const vegaString = JSON.stringify(parsedText.vega);
                            dispatch(setVegaString(vegaString));
                          }
                        }}
                  >
                    <span className=''>View</span>
                </button>
                <div className='border-l-2 h-3'></div>
            </>
            }
            {new Date(message.id).toLocaleString()}
          </div>
      }
    </div>
  </>);
};

