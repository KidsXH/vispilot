import React from 'react';

interface Message {
  id: number;
  message: string;
  sender: 'user' | 'bot';
}

const messages: Message[] = [
  {
    id: 1,
    message: 'Hello',
    sender: 'user',
  },
  {
    id: 2,
    message: 'Hi',
    sender: 'bot',
  },
  {
    id: 3,
    message: 'How are you?',
    sender: 'user',
  },
  {
    id: 4,
    message: 'I am fine',
    sender: 'bot',
  },
];

const Chat = () => {
  return (
    <div className='flex flex-col p-2'>
      <div className='font-bold text-xl'>Chat</div>
      <div className='flex flex-col h-[530px]'>
        {messages.map((message) => {
          return (
            <div
              key={message.id}
              className={`flex my-2
                ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <MessageBox message={message} />
            </div>
          );
        })}
      </div>
      <div className='flex flex-col space-y-2'>
        <input
          type='text'
          className='w-full p-2 border border-gray-300 rounded'
          placeholder='Type your message...'
        />
        <div className='flex flex-row-reverse space-x-1 items-center'>
          <div className='material-symbols-outlined cursor-pointer select-none rounded hover:bg-neutral-200 p-1'>
            upload_file
          </div>
          <div className='material-symbols-outlined cursor-pointer select-none rounded hover:bg-neutral-200 p-1'>
            export_notes
          </div>
          <div className='mr-auto py-0.5 px-2 bg-gray-200 text-sm rounded-sm cursor-pointer select-none hover:bg-gray-100 text-neutral-600'>To: Deepseek-VL2</div>
        </div>
      </div>
    </div>
  );
};

export default Chat;

const MessageBox = ({message}: {message: Message}) => {
  return (
    <div
      className={`rounded p-2 max-w-80
        ${message.sender === 'user' ? 'bg-blue-200' : 'bg-gray-200 w-80'}`}
    >
      {message.message}
    </div>
  );
};
