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
];

const Recommendation = () => {
  return (
    <>
      <div className='flex flex-col p-2 min-w-0'>
        <div className='font-bold text-xl'>Recommendation</div>
        <div className='grow flex space-x-3 overflow-x-scroll p-2 items-center mt-2 pb-4'>
          {recommendations.map((r) => (
            <RecommendationCard
              key={r.id}
              title={`Recommendation ${r.id}`}
              content={r.content}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default Recommendation;

const RecommendationCard = ({
  title,
  content,
}: {
  title: string;
  content: string;
}) => {
  return (
    <>
      <div className='flex flex-col rounded border border-black p-2 h-48 min-w-80'>
        <div>{title}</div>
        <div>{content}</div>
      </div>
    </>
  );
};
