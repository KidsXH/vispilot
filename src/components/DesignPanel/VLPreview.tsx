import VegaLite from "@/components/VegaLite";
import {useAppDispatch, useAppSelector} from "@/store";
import {selectVegaString} from "@/store/features/DataSlice";
import {setDesignIdea} from "@/store/features/CanvasSlice";
import {selectVegaLiteSize} from "@/store/features/AppSlice";

const VLPreview = () => {
  const dispatch = useAppDispatch();
  const vegaString = useAppSelector(selectVegaString);
  const vegaLiteSize = useAppSelector(selectVegaLiteSize);

  const renderCallback = (svg: string | null) => {
    dispatch(setDesignIdea(svg));
  }

  return (<>
      <div className="h-[220px] w-full overflow-auto no-scrollbar">
        <div className="flex items-center justify-center h-[210px] min-w-max mt-1 vl-preview">
          <VegaLite vegaString={vegaString}
                    width={vegaLiteSize[0] === 'auto' ? undefined : vegaLiteSize[0]}
                    height={vegaLiteSize[1] === 'auto' ? undefined : vegaLiteSize[1]}
                    renderCallback={renderCallback} />
        </div>
      </div>
    </>
  );
}

export default VLPreview;
