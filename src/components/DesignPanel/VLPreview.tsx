import VegaLite from "@/components/VegaLite";
import {useAppSelector} from "@/store";
import {selectVegaString} from "@/store/features/DataSlice";

const VLPreview = () => {
  const vegaString = useAppSelector(selectVegaString);
  return (<>
      <div className="h-[160px] w-full overflow-auto no-scrollbar">
        <div className="flex items-center justify-center h-full min-w-max pt-2">
          <VegaLite vegaString={vegaString}/>
        </div>
      </div>
    </>
  );
}

export default VLPreview;