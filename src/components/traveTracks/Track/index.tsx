import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { markers } from "../../../constant";
import { Button } from "@/components/ui/button";
import { useMapStore } from "@/app/store/mapStore";

interface Props {
  track: {
    type: string;
    lng: string;
    lat: string;
    title: string;
    description: string;
  };
  step: number;
}

const Track: React.FC<Props> = ({ step, ...props }) => {
  const { type, lng, lat, title, description } = props.track;
  const name = markers.find(({ fileName }) => fileName === type)?.name;
  const mapInstance = useMapStore((state) => state.mapboxInstance);

  const onClick = () => {
    if (mapInstance) {
      mapInstance.flyTo({
        center: [parseFloat(lng), parseFloat(lat)],
        zoom: 15
      });
    }
  };

  return (
    <Card
      className={cn("w-full h-[150px] my-3 first:mt-0 last:mb-0 cursor-pointer hover:border-2 hover:border-blue-500")}
      onClick={onClick}
    >
      <CardHeader className="p-[15px]">
        <CardTitle>
          <Button variant="link" className="px-0">
            标记点#{step + 1}
          </Button>
          【{title}】
        </CardTitle>
        <CardDescription>类型: {name}</CardDescription>
        <CardDescription>描述: {description}</CardDescription>
      </CardHeader>
    </Card>
  );
};

export default Track;
