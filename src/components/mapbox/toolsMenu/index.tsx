import * as React from 'react'
import { cn } from "@/lib/utils";
import { markers } from '../../../constant'
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger, MenubarShortcut } from '@/components/ui/menubar';

interface Props {
  className?: string
  onClickMenu?: (fileName: string) => void
}

const ToolsMenu: React.FC<Props> = ({ className, onClickMenu = (fileName: string) => { } }) => {
  return (
    <Menubar className={cn("w-[300px] h-[45px]", className)}>
      <MenubarMenu>
        <MenubarMenu>
          <MenubarTrigger>Quick Markers</MenubarTrigger>
        </MenubarMenu>
        <MenubarTrigger>Special Markers</MenubarTrigger>
        <MenubarContent>
          {markers.map((marker) => (
            <MenubarItem key={marker.name} onClick={() => onClickMenu(marker.fileName)}>
              {marker.name} <MenubarShortcut><img className={cn('w-[30px]')} src={`/markers/resized/${marker.fileName}.png`} /></MenubarShortcut>
            </MenubarItem>
          ))}
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

export default ToolsMenu; 