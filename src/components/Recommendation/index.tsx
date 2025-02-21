'use client'

import VegaLite from "@/components/VegaLite";
import {useAppDispatch} from "@/store";
import {addVegaEmbeds} from "@/store/features/CanvasSlice";
import {exampleSpec} from "@/mocks/vegaLiteSpec";

interface RecommendationInfo {
  id: number;
  content: string;
}

const recommendations: RecommendationInfo[] = [
  {
    id: 1,
    content: 'Visualization A',
  },
  {
    id: 2,
    content: 'Visualization B',
  },
  {
    id: 3,
    content: 'Visualization C',
  },
  {
    id: 4,
    content: 'Visualization D',
  },
  {
    id: 5,
    content: 'Visualization E',
  },
];

const Recommendation = () => {
  const dispatch = useAppDispatch();

  return (
    <>
      <div className='flex flex-col p-2 min-w-0'>
        <div className='font-bold text-xl'>Recommendation</div>
        <div className='grow flex overflow-x-scroll p-2 items-center mt-2 pb-4'>
          {recommendations.map((r) => (
            <div onClick={() => dispatch(addVegaEmbeds(exampleSpec))}
              key={r.id}>
              <RecommendationCard
                title={`Recommendation ${r.id}`}
                content={r.content}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Recommendation;

const RecommendationCard = ({title, content}: {
  title: string;
  content: string;
}) => {
  return (
    <>
      <div
        className='flex items-center justify-center border-r-2 -mr-2 border-neutral-200 p-2 h-48 min-w-80 hover:bg-neutral-100 cursor-pointer'>
        <VegaLite/>
      </div>
    </>
  );
};
