import * as React from 'react'
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { markers } from '../../../constant'
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarRadioItem, MenubarSeparator, MenubarShortcut, MenubarSub, MenubarSubContent, MenubarSubTrigger, MenubarTrigger } from '@/components/ui/menubar';
interface Props {
  className?: string
  map?: any
  onClickMenu?: (fileName: string) => void
}

const ToolsMenu: React.FC<Props> = ({ className, onClickMenu = (fileName: string) => { }, ...props }) => {

  // const selectMenu = (fileName: string) => {
  //   props.map.setDefaultCursor(`url('/markers/resized/${fileName}') 25 51, auto`)
  // }

  return <Menubar className={cn("w-[300px] h-[45px]", className)}>
    <MenubarMenu>
      <MenubarMenu>
        <MenubarTrigger>快捷标记</MenubarTrigger>
      </MenubarMenu>
      <MenubarTrigger>特殊标记</MenubarTrigger>
      <MenubarContent>
        {
          markers.map((marker) => <MenubarItem  key={marker.name} onClick={() => onClickMenu(marker.fileName)}>
            {marker.name} <MenubarShortcut ><img className={cn('w-[30px]')} src={`/markers/resized/${marker.fileName}.png`} /></MenubarShortcut>
          </MenubarItem>)
        }
      </MenubarContent>
    </MenubarMenu>
  </Menubar>
}

export default ToolsMenu