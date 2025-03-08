import VegaLite from "@/components/VegaLite";
import {useAppSelector} from "@/store";
import {selectVegaString} from "@/store/features/DataSlice";

const VLPreview = () => {
  const vegaString = useAppSelector(selectVegaString);
  return (
    <div className="flex items-center justify-center h-full -ml-2">
        <VegaLite vegaString={vegaString} />
    </div>
  );
}

export default VLPreview;