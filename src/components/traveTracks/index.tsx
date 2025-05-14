import { } from 'react'
import Track from './Track'
import { cn } from '@/lib/utils'
import { ScrollArea, Viewport, } from '@radix-ui/react-scroll-area'

interface Props { className?: string, tracks: any[] }

const TravelTracks: React.FC<Props> = ({ className, ...props }) => {

  return <ScrollArea className="h-full w-[400px] overflow-y-auto rounded-md border p-4">
    <Viewport asChild className={cn("w-full h-full")}>
      <h4 className="mb-4 text-sm font-medium leading-none">路径标记</h4>
      {
        props.tracks.map((i,index) => <Track key={`${index}`} track={i} step={index}/>)
      }
    </Viewport>
  </ScrollArea>
}

export default TravelTracks 