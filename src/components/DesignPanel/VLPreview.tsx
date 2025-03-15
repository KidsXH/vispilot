import VegaLite from "@/components/VegaLite";
import {useAppDispatch, useAppSelector} from "@/store";
import {selectVegaString} from "@/store/features/DataSlice";
import {setDesignIdea} from "@/store/features/CanvasSlice";

const VLPreview = () => {
  const vegaString = useAppSelector(selectVegaString);
  const dispatch = useAppDispatch();

  const renderCallback = (svg: string | null) => {
    dispatch(setDesignIdea(svg));
  }

  return (<>
      <div className="h-[160px] w-full overflow-auto no-scrollbar">
        <div className="flex items-center justify-center h-full min-w-max pt-2 vl-preview">
          <VegaLite vegaString={vegaString} renderCallback={renderCallback} />
        </div>
      </div>
    </>
  );
}

export default VLPreview;
