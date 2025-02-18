import Canvas from '@/components/Canvas';
import Chat from '@/components/Chat';
import DataTable from '@/components/DataTable';
import Recommendation from '@/components/Recommendation';

export default function Home() {
  return (
    <div className='flex flex-col w-[1920px] h-[1082px] mx-auto mt-20 border border-black bg-white font-sans'>
      <div className='flex items-center w-full h-10 px-2 bg-neutral-900 text-white text-2xl font-system'>
        VisPilot
      </div>
      <div className='flex flex-grow w-full'>
        <div className='flex flex-col w-96 border border-black'>
          <div className='h-96 border-b border-black'>
            <DataTable />
          </div>
          <div className='grow border-t border-black'>
            <Chat />
          </div>
        </div>
        <div className='flex flex-row-reverse grow border border-black min-w-0'>
          <div className='flex w-96 border-l-2 border-black p-2'>
            <div className='font-bold text-xl'>Design Panel</div>
          </div>
          <div className='flex flex-col-reverse grow min-w-0'>
            <div className='h-72 border-t border-black'>
              <Recommendation />
            </div>
            <div className='grow border-b border-black'>
              <Canvas />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
