import * as React from 'react'
import { cn } from "@/lib/utils";
import { markers } from '../../../constant'
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarTrigger, MenubarShortcut } from '@/components/ui/menubar';
import Image from 'next/image';

interface Props {
  className?: string
  onClickMenu?: (fileName: string) => void
}

const ToolsMenu: React.FC<Props> = ({ className, onClickMenu = (fileName: string) => { } }) => {
  return (
    <Menubar className={cn("w-[100px] h-[45px]", className)}>
      <MenubarMenu>
        <MenubarTrigger>Quick Markers</MenubarTrigger>
        <MenubarContent>
          {Array.isArray(markers) && markers.map((marker) => (
            <MenubarItem key={marker.name} onClick={() => onClickMenu(marker.fileName)}>
              {marker.name} <MenubarShortcut><Image className={cn('w-[30px]')} src={`/markers/resized/${marker.fileName}.png`} alt={marker.name} width={30} height={30} /></MenubarShortcut>
            </MenubarItem>
          ))}
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

export default ToolsMenu; 