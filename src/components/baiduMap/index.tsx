'use client'; // 标记这个组件为客户端组件

import React, { use, useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import ToolsMenu from './toolsMenu'
import { cn } from '@/lib/utils';
import { useMapStore } from '@/app/store/mapStore'

interface Props { 
  className?: string, 
  onAddOneMarker: (fileName: string, lng: string, lat: string) => void,
  openCreateMarkerDialog: any,
  createMarkerDialogIsOpen: boolean,
}

const BaiduMap: React.FC<Props> = React.memo(({ className, ...props }) => {
  // const [currentSelectMarkerType, setCurrentSelectMarkerType] = useState<any>()
  const currentSelectMarkerType = useRef('');
  const addBaiduMap = useMapStore((state) => state.addBaiduMap)
  const mapInstance = useMapStore((state) => state.baiduInstance)

  useEffect(() => {
    const initMap = () => {
      if (typeof (window as any).BMapGL !== 'undefined') {
        const map = new (window as any).BMapGL.Map('mapContainer'); // 创建地图实例
        const point = new (window as any).BMapGL.Point(116.404, 39.915); // 创建点坐标
        map.centerAndZoom(point, 15);
        map.enableScrollWheelZoom(true); // 开启鼠标滚轮缩放
        var locationControl = new (window as any).BMapGL.LocationControl({
          anchor: (window as any).BMAP_ANCHOR_BUTTOM_RIGHT,
          offset: new (window as any).BMapGL.Size(20, 20)
        });
        map.addControl(locationControl);
        addBaiduMap(map)
      } else {
        console.error('BMapGL is not available.');
      }
    };

    if ((window as any).BMapGL) {
      initMap();
    } else {
      (window as any).initMap = initMap; // 回调函数
    }
  }, []);


  // init save date and events
  useEffect(()=> {
    if (mapInstance) {
      mapInstance?.addEventListener('click', (e: any) => {
        console.log('click')
        const { latlng } = e;
        const { lng, lat } = latlng;
        if (currentSelectMarkerType.current) {
          // ready for add marker to map
          addMakerToMap(lng, lat)
          props.openCreateMarkerDialog()
        }
      })
    }
  },[mapInstance])

  useEffect(()=> {
    if(!props.createMarkerDialogIsOpen && mapInstance) {
      mapInstance.setDefaultCursor("grab")
      currentSelectMarkerType.current = ''
    }
  },[props.createMarkerDialogIsOpen, mapInstance])


  const addMakerToMap = (lng: string, lat: string) => {
    if (mapInstance) {
      const myIcon = new (window as any).BMapGL.Icon(`/markers/resized/${currentSelectMarkerType.current}.png`, new (window as any).BMapGL.Size(50, 50), {
        anchor: new (window as any).BMapGL.Size(25, 51),
      });
      props.onAddOneMarker(currentSelectMarkerType.current, lng, lat)
      currentSelectMarkerType.current = ''

      const pt = new (window as any).BMapGL.Point(lng, lat);
      const marker = new (window as any).BMapGL.Marker(pt, {
        icon: myIcon
      });
      mapInstance.addOverlay(marker);
      mapInstance.setDefaultCursor("grab")
    }
  }

  const selectMenu = (fileName: string) => {
    mapInstance?.setDefaultCursor(`url('/markers/resized/${fileName}.png') 25 51, auto`)
    currentSelectMarkerType.current = fileName
  }

  console.log('outsite',currentSelectMarkerType)
  return (
    <div className={cn('relative', className)}>
      <ToolsMenu className={cn('z-10 absolute top-3 right-5')} onClickMenu={selectMenu} />
      <div id="mapContainer" style={{ width: '100%', height: '100%' }} />
      <Script
        src={`https://api.map.baidu.com/api?v=3.0&type=webgl&ak=kPu6CasCnKDgjW5fzOkblXG4PCvf6UqP&callback=initMap`}
        strategy="afterInteractive"
      />
    </div>
  );
});
BaiduMap.displayName = "BaiduMap";
export default BaiduMap;
