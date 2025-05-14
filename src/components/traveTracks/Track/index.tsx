import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { markers } from '../../../constant'
import { Button } from '@/components/ui/button'
import { useMapStore } from '@/app/store/mapStore'
interface Props {
  track: {
    type: string
    lng: string
    lat: string
  },
  step: number
}

const Track: React.FC<Props> = ({step, ...props }) => {
  const {type, lng,lat } = props.track
  const name = markers.find(({ fileName }) => fileName === type)?.name;
  const baiduInstance = useMapStore((state) => state.baiduInstance)

  const onClick = ()=> {
    const point = new (window as any).BMapGL.Point(lng, lat); // 创建点坐标
    baiduInstance.centerAndZoom(point, 15);
  }

  return <Card className={cn('w-full h-[150px] my-3 first:mt-0 last:mb-0')} onClick={onClick}>
    <CardHeader  className='p-[15px]'>
      <CardTitle> <Button variant="link" className='px-0'>#{step + 1}</Button> 这是一个标记</CardTitle>
      <CardDescription>类型: {name}</CardDescription>
    </CardHeader>
  </Card>
}
export default Track