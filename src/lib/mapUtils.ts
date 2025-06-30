interface MapLocation {
  lng: number;
  lat: number;
  title?: string;
  address?: string;
}

export interface MapApp {
  name: string;
  icon: string;
  color: string;
  isAvailable: () => boolean;
  getUrl: (location: MapLocation) => string;
}

// Detect if we're on iOS
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

// Detect if we're on Android
const isAndroid = () => {
  return /Android/.test(navigator.userAgent);
};

// Check if an app is installed by trying to open it
const checkAppInstalled = async (scheme: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = scheme;
    
    const timeout = setTimeout(() => {
      document.body.removeChild(iframe);
      resolve(false);
    }, 1000);
    
    iframe.onload = () => {
      clearTimeout(timeout);
      document.body.removeChild(iframe);
      resolve(true);
    };
    
    document.body.appendChild(iframe);
  });
};

export const mapApps: MapApp[] = [
  {
    name: 'Apple Maps',
    icon: '🍎',
    color: '#007AFF',
    isAvailable: () => isIOS(),
    getUrl: (location: MapLocation) => {
      const { lng, lat, title } = location;
      return `maps://?q=${encodeURIComponent(title || 'Location')}&ll=${lat},${lng}`;
    }
  },
  {
    name: 'Google Maps',
    icon: '🗺️',
    color: '#4285F4',
    isAvailable: () => true, // Available on all platforms via web
    getUrl: (location: MapLocation) => {
      const { lng, lat, title } = location;
      if (isIOS()) {
        return `comgooglemaps://?q=${lat},${lng}&center=${lat},${lng}&zoom=16`;
      } else if (isAndroid()) {
        return `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(title || 'Location')})`;
      } else {
        return `https://maps.google.com/maps?q=${lat},${lng}&z=16`;
      }
    }
  },
  {
    name: '高德地图',
    icon: '🧭',
    color: '#00C853',
    isAvailable: () => true, // Available in China
    getUrl: (location: MapLocation) => {
      const { lng, lat, title } = location;
      if (isIOS()) {
        return `iosamap://navi?sourceApplication=webapp&poiname=${encodeURIComponent(title || 'Location')}&lat=${lat}&lon=${lng}&dev=0`;
      } else if (isAndroid()) {
        return `androidamap://navi?sourceApplication=webapp&poiname=${encodeURIComponent(title || 'Location')}&lat=${lat}&lon=${lng}&dev=0`;
      } else {
        return `https://uri.amap.com/navigation?to=${lng},${lat},${encodeURIComponent(title || 'Location')}&mode=car`;
      }
    }
  },
  {
    name: '百度地图',
    icon: '🐻',
    color: '#2196F3',
    isAvailable: () => true, // Available in China
    getUrl: (location: MapLocation) => {
      const { lng, lat, title } = location;
      if (isIOS() || isAndroid()) {
        return `baidumap://map/direction?destination=latlng:${lat},${lng}|name:${encodeURIComponent(title || 'Location')}&mode=driving`;
      } else {
        return `https://map.baidu.com/search/${encodeURIComponent(title || 'Location')}/@${lng},${lat},16z`;
      }
    }
  }
];

export const openInMapApp = (app: MapApp, location: MapLocation) => {
  const url = app.getUrl(location);
  
  try {
    // Try to open the native app first
    window.location.href = url;
    
    // Fallback to web version if native app doesn't open
    setTimeout(() => {
      if (app.name === 'Google Maps' && !isIOS() && !isAndroid()) {
        window.open(`https://maps.google.com/maps?q=${location.lat},${location.lng}&z=16`, '_blank');
      }
    }, 1500);
  } catch (error) {
    console.error('Failed to open map app:', error);
    // Fallback to web version
    if (app.name === 'Google Maps') {
      window.open(`https://maps.google.com/maps?q=${location.lat},${location.lng}&z=16`, '_blank');
    }
  }
};

export const getAvailableMapApps = (): MapApp[] => {
  return mapApps.filter(app => app.isAvailable());
}; 