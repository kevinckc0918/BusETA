import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Bus, 
  RefreshCw, 
  Moon, 
  Sun, 
  MonitorSmartphone, 
  CloudSun, 
  AlertTriangle, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  X, 
  ChevronRight, 
  Check, 
  Settings, 
  ChevronDown,
  Navigation,
  MapPin,
  Folder,
  Layers,
  Upload,
  Download,
  Copy,
  FileText,
  Sliders,
  RotateCcw,
  Pencil
} from 'lucide-react';

// ==========================================
// 🖼️ 預設高畫質幻燈片 (本地路徑)
// ==========================================
const DEFAULT_PHOTOS = [
  "/photo01.jpg",
  "/photo02.jpg",
  "/photo03.jpg"
];

const WEATHER_BG = "/victoria-harbour.jpg";

// ==========================================
// 🚌 預設預載的自訂巴士站數據
// ==========================================
const DEFAULT_LOCATIONS = [
  {
    id: "67D38E584B919815",
    filterId: "PARKYOHO",
    groupName: "峻巒",
    name: "峻巒總站",
    desc: "往市區",
    routes: [
      { company: "kmb", route: "68", dir: "O", dest: "元朗公園", serviceType: "1" },
      { company: "kmb", route: "68F", dir: "O", dest: "元朗公園", serviceType: "1" },
      { company: "kmb", route: "268M", dir: "O", dest: "荃灣西站", serviceType: "1" }
    ]
  },
  {
    id: "0C943B7308FF4DCC",
    filterId: "YOHO",
    groupName: "形點",
    name: "形點 II",
    desc: "往峻巒",
    routes: [
      { company: "kmb", route: "68", dir: "I", dest: "峻巒", serviceType: "1", customDest: "峻巒" }
    ]
  },
  {
    id: "7917E395940F86AF",
    filterId: "YOHO",
    groupName: "形點",
    name: "形點 I",
    desc: "往峻巒",
    routes: [
      { company: "kmb", route: "68F", dir: "I", dest: "峻巒", serviceType: "1", customDest: "峻巒" }
    ]
  }
];

// 📐 經緯度兩點距離計算函數
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; 
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c); 
}

// 📅 格式化中文日期格式
function formatChineseDate(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekday = weekdays[date.getDay()];
  return `${year}年${month}月${day}日 ${weekday}`;
}

// 🌩️ 天氣警告資料處理中心 (使用官方高清版 PNG，解決狗牙問題)
const getWarningData = (code, originalName) => {
  const hkoBase = 'https://www.hko.gov.hk/images/HKOWarningSymbols/';
  switch(code) {
    case 'WRAINA': return { text: '黃色暴雨警告', img: hkoBase + 'warn800_15_wraina.png', style: 'bg-yellow-400 text-yellow-950 border border-yellow-500', iconBg: 'bg-white/80' };
    case 'WRAINR': return { text: '紅色暴雨警告', img: hkoBase + 'warn800_16_wrainr.png', style: 'bg-red-600 text-white border border-red-500', iconBg: 'bg-white' };
    case 'WRAINB': return { text: '黑色暴雨警告', img: hkoBase + 'warn800_17_wrainb.png', style: 'bg-black text-white border border-gray-600', iconBg: 'bg-white' };
    case 'WTS': return { text: '雷暴警告', img: hkoBase + 'warn800_12_ts.png', style: 'bg-yellow-500 text-black border border-yellow-600', iconBg: 'bg-white/80' };
    case 'WHOT': return { text: '酷熱天氣警告', img: hkoBase + 'warn800_18_vhot.png', style: 'bg-red-500 text-white', iconBg: 'bg-white' };
    case 'WCOLD': return { text: '寒冷天氣警告', img: hkoBase + 'warn800_19_cold.png', style: 'bg-blue-400 text-blue-950 border border-blue-500', iconBg: 'bg-white/80' };
    case 'WFIREY': return { text: '黃色火災危險警告', img: hkoBase + 'warn800_20_firey.png', style: 'bg-yellow-500 text-yellow-950', iconBg: 'bg-white/80' };
    case 'WFIRER': return { text: '紅色火災危險警告', img: hkoBase + 'warn800_21_firer.png', style: 'bg-red-500 text-white', iconBg: 'bg-white' };
    case 'TC1': return { text: '一號戒備信號', img: hkoBase + 'warn800_01_tc1.png', style: 'bg-white text-black border border-gray-200', iconBg: 'bg-transparent' };
    case 'TC3': return { text: '三號強風信號', img: hkoBase + 'warn800_02_tc3.png', style: 'bg-white text-black border border-gray-200', iconBg: 'bg-transparent' };
    case 'TC8NE': return { text: '八號東北烈風或暴風信號', img: hkoBase + 'warn800_04_tc8ne.png', style: 'bg-white text-black border border-gray-200', iconBg: 'bg-transparent' };
    case 'TC8NW': return { text: '八號西北烈風或暴風信號', img: hkoBase + 'warn800_03_tc8nw.png', style: 'bg-white text-black border border-gray-200', iconBg: 'bg-transparent' };
    case 'TC8SE': return { text: '八號東南烈風或暴風信號', img: hkoBase + 'warn800_06_tc8se.png', style: 'bg-white text-black border border-gray-200', iconBg: 'bg-transparent' };
    case 'TC8SW': return { text: '八號西南烈風或暴風信號', img: hkoBase + 'warn800_05_tc8sw.png', style: 'bg-white text-black border border-gray-200', iconBg: 'bg-transparent' };
    case 'TC9': return { text: '九號烈風或暴風風力增強信號', img: hkoBase + 'warn800_07_tc9.png', style: 'bg-white text-black border border-gray-200', iconBg: 'bg-transparent' };
    case 'TC10': return { text: '十號颶風信號', img: hkoBase + 'warn800_08_tc10.png', style: 'bg-white text-black border border-gray-200', iconBg: 'bg-transparent' };
    case 'SMS': return { text: '強烈季候風信號', img: hkoBase + 'warn800_13_ms.png', style: 'bg-slate-800 text-white border border-slate-600', iconBg: 'bg-transparent' };
    case 'WL': return { text: '山泥傾瀉警告', img: hkoBase + 'warn800_14_landslip.png', style: 'bg-yellow-600 text-white border border-yellow-700', iconBg: 'bg-white/80' };
    case 'FNTSA': return { text: '新界北部水浸特別報告', img: hkoBase + 'warn800_22_ntfl.png', style: 'bg-blue-600 text-white border border-blue-700', iconBg: 'bg-white' };
    case 'FROST': return { text: '霜凍警告', img: hkoBase + 'warn800_23_frost.png', style: 'bg-cyan-500 text-white border border-cyan-600', iconBg: 'bg-transparent' };
    default: 
      if (!originalName || originalName.trim() === '') return null;
      return { text: originalName, style: 'bg-slate-800 text-white border border-slate-700 shadow-md', iconBg: 'bg-transparent' };
  }
};

// 🛡️ 防破圖天氣警告徽章元件 (無 CORS 限制)
const WarningBadge = ({ img, text, iconBg = "bg-transparent", className = "w-6 h-6 object-contain", isSmall = false }) => {
  const [error, setError] = useState(false);
  if (error || !img) return null; 
  const padding = iconBg !== 'bg-transparent' ? (isSmall ? 'p-0.5 rounded' : 'p-1.5 rounded-lg') : '';
  return (
    <div className={`${iconBg} ${padding} shrink-0 flex items-center justify-center shadow-sm`}>
      <img src={img} alt={text} className={className} referrerPolicy="no-referrer" onError={() => setError(true)} />
    </div>
  );
};

// 🚌 巴士公司智能 Logo 組件 (本地 VPS 路徑)
const CompanyBadge = ({ company, className = "h-4 sm:h-5 object-contain" }) => {
  const [imgError, setImgError] = useState(false);
  if (imgError) {
    return (
      <span className={`text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded leading-none border shadow-sm shrink-0 flex items-center justify-center ${company === 'ctb' ? 'bg-yellow-400 text-yellow-950 border-yellow-500' : 'bg-[#e3342f]/10 text-[#e3342f] border-[#e3342f]/20'}`}>
        {company === 'ctb' ? '城巴' : '九巴'}
      </span>
    );
  }
  const src = company === 'ctb' ? "/ctb-logo.png" : "/kmb-logo.png";
  return (
    <img src={src} alt={company === 'ctb' ? 'Citybus' : 'KMB'} className={`shrink-0 drop-shadow-sm ${className}`} onError={() => setImgError(true)} />
  );
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [locationsData, setLocationsData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL'); 
  const [photoIndex, setPhotoIndex] = useState(0);
  const [now, setNow] = useState(new Date());

  const [isDarkMode, setIsDarkMode] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kmb_theme') || 'false'); } catch { return false; }
  });

  // 💡 地圖與路線視窗狀態管理
  const [mapState, setMapState] = useState({ 
    isOpen: false, 
    loadingMap: false, 
    loadingStops: false,
    stop: null, 
    routeInfo: null, 
    routeStops: [], 
    error: null 
  });
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // 💡 動態引入地圖引擎 Leaflet (保證在 React 中完美運作)
  useEffect(() => {
    if (window.L) { setLeafletLoaded(true); return; }
    
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
    
    if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => { window.dispatchEvent(new Event('leafletReady')); };
      document.head.appendChild(script);
    }

    const checkL = () => { if (window.L) setLeafletLoaded(true); };
    checkL();
    window.addEventListener('leafletReady', checkL);
    return () => window.removeEventListener('leafletReady', checkL);
  }, []);

  // === 🎨 核心主題配色 ===
  const theme = {
    appBg: isDarkMode ? 'bg-zinc-950 text-white' : 'bg-slate-50 text-slate-900',
    topBar: isDarkMode ? 'bg-red-950 border-red-900/50' : 'bg-[#e3342f] border-red-700',
    bottomBar: isDarkMode ? 'bg-red-950/95' : 'bg-[#e3342f]',
    pillBg: isDarkMode ? 'bg-red-900 text-white' : 'bg-[#e3342f] text-white',
    rowEven: isDarkMode ? 'bg-zinc-900/60' : 'bg-white',
    rowOdd: isDarkMode ? 'bg-red-950/20' : 'bg-[#fae0e5]',
    routeNum: isDarkMode ? 'text-zinc-100' : 'text-slate-900',
    routeDest: isDarkMode ? 'text-zinc-300' : 'text-slate-800', 
    etaPrimaryDefault: isDarkMode ? 'text-zinc-100' : 'text-slate-800', 
    etaSecondary: isDarkMode ? 'text-zinc-400' : 'text-slate-500',
    etaMissed: isDarkMode ? 'text-zinc-500' : 'text-slate-400',
    tabActive: isDarkMode ? 'bg-white text-red-950 shadow-md scale-105 font-black' : 'bg-white text-[#e3342f] shadow-md scale-105 font-black',
    tabInactive: isDarkMode ? 'border border-white/20 text-white/70 hover:bg-white/10' : 'border border-white/20 text-white/90 hover:bg-white/10',
    groupCardBg: isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200',
    groupHeaderBg: isDarkMode ? 'bg-zinc-900 border-zinc-800/50' : 'bg-white border-gray-100',
    groupHeaderText: isDarkMode ? 'text-red-400 border-zinc-800/50' : 'text-[#e3342f] border-gray-100',
    badgeGroupItem: isDarkMode ? 'bg-zinc-800 text-zinc-200 border-zinc-700' : 'bg-slate-100 text-slate-800 border-gray-200',
    emptyStateBg: isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-100',
    modalBg: isDarkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-100 text-slate-800',
    inputBg: isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-800',
    controlBtn: isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-800',
  };

  const getEtaMinutes = (etaDate) => Math.floor((etaDate - now) / 60000);

  const [gpsLoading, setGpsLoading] = useState(false);
  const [userCoords, setUserCoords] = useState(null); 
  const [nearbyStops, setNearbyStops] = useState([]); 
  const [nearbyStopsData, setNearbyStopsData] = useState([]); 
  const [gpsMessage, setGpsMessage] = useState('');

  const [locations, setLocations] = useState(() => {
    try {
      const saved = localStorage.getItem('kmb_custom_locations');
      const parsed = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed)) return parsed;
      return DEFAULT_LOCATIONS;
    } catch {
      return DEFAULT_LOCATIONS;
    }
  });

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('FAVORITES'); 
  const [shouldReopenSettings, setShouldReopenSettings] = useState(false); 
  const [showResetConfirm, setShowResetConfirm] = useState(false); 

  const [nearbyRadius, setNearbyRadius] = useState(() => {
    try { return parseInt(localStorage.getItem('kmb_nearby_radius') || '1200'); } 
    catch { return 1200; }
  });

  const [importText, setImportText] = useState('');
  const [backupSuccess, setBackupSuccess] = useState('');
  const [backupError, setBackupError] = useState('');

  const [weatherInfo, setWeatherInfo] = useState({ temp: '--', icon: null, warnings: [] });

  const [isStandMode, setIsStandMode] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kmb_stand_mode') || 'false'); } 
    catch { return false; }
  });

  const [leftPanelMode, setLeftPanelMode] = useState(() => {
    try { return localStorage.getItem('kmb_left_mode') || 'WEATHER'; } 
    catch { return 'WEATHER'; }
  });

  const [standMonitorId, setStandMonitorId] = useState(() => {
    try { return localStorage.getItem('kmb_stand_monitor_id') || 'ALL_FAVORITES'; } 
    catch { return 'ALL_FAVORITES'; }
  });

  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchStep, setSearchStep] = useState(1); 
  const [allRoutesList, setAllRoutesList] = useState([]); 
  const [loadingRoutes, setLoadingRoutes] = useState(false);
  const [routeQuery, setRouteQuery] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(null); 
  const [routeDirections, setRouteDirections] = useState([]); 
  const [selectedDirection, setSelectedDirection] = useState(null); 
  const [loadingStops, setLoadingStops] = useState(false);
  const [routeStops, setRouteStops] = useState([]); 
  const [selectedStop, setSelectedStop] = useState(null); 

  const [customStopName, setCustomStopName] = useState('');
  const [customStopDesc, setCustomStopDesc] = useState('');
  const [customGroupName, setCustomGroupName] = useState('預設');
  const [customGroupInput, setCustomGroupInput] = useState('');

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = "format-detection";
    meta.content = "telephone=no, date=no, address=no, email=no";
    document.head.appendChild(meta);
    return () => {
      try { document.head.removeChild(meta); } catch(e) {}
    };
  }, []);

  useEffect(() => { try { localStorage.setItem('kmb_custom_locations', JSON.stringify(locations)); } catch {} }, [locations]);
  useEffect(() => { try { localStorage.setItem('kmb_theme', JSON.stringify(isDarkMode)); } catch {} }, [isDarkMode]);
  useEffect(() => { try { localStorage.setItem('kmb_stand_mode', JSON.stringify(isStandMode)); } catch {} }, [isStandMode]);
  useEffect(() => { try { localStorage.setItem('kmb_left_mode', leftPanelMode); } catch {} }, [leftPanelMode]);
  useEffect(() => { try { localStorage.setItem('kmb_nearby_radius', nearbyRadius.toString()); } catch {} }, [nearbyRadius]);
  useEffect(() => { if (standMonitorId) try { localStorage.setItem('kmb_stand_monitor_id', standMonitorId); } catch {} }, [standMonitorId]);

  const availableGroups = useMemo(() => {
    const groupsSet = new Set(locations.map(loc => loc.groupName || '預設'));
    return ['ALL', 'NEARBY', ...Array.from(groupsSet)]; 
  }, [locations]);

  useEffect(() => {
    if (activeTab !== 'ALL' && activeTab !== 'NEARBY' && !availableGroups.includes(activeTab)) setActiveTab('ALL');
  }, [availableGroups, activeTab]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isStandMode || leftPanelMode !== 'PHOTO') return;
    const photoTimer = setInterval(() => setPhotoIndex((prev) => (prev + 1) % DEFAULT_PHOTOS.length), 10000);
    return () => clearInterval(photoTimer);
  }, [isStandMode, leftPanelMode]);

  const fetchWeather = useCallback(async () => {
    try {
      const fetchHkoApi = async (dataType) => {
        const res = await fetch(`https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=${dataType}&lang=tc`);
        const text = await res.text();
        return text ? JSON.parse(text) : null;
      };
      const [rhrData, warnData] = await Promise.all([fetchHkoApi('rhrread'), fetchHkoApi('warnsum')]);
      const hkoTemp = rhrData?.temperature?.data?.find(d => d.place === '香港天文台')?.value || rhrData?.temperature?.data?.[0]?.value || '--';
      const iconId = rhrData?.icon?.[0];
      
      const activeWarnings = [];
      if (warnData && typeof warnData === 'object') {
        Object.keys(warnData).forEach(key => {
          const w = warnData[key];
          if (w && w.code && w.name && w.name.trim().length > 0) {
            activeWarnings.push({ code: w.code, name: w.name });
          }
        });
      }
      setWeatherInfo({ temp: hkoTemp, icon: iconId, warnings: activeWarnings });
    } catch (err) {
      console.warn('天氣數據載入失敗', err);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    const weatherTimer = setInterval(fetchWeather, 300000); 
    return () => clearInterval(weatherTimer);
  }, [fetchWeather]);

  const activeTCWarning = useMemo(() => {
    if (!weatherInfo.warnings) return null;
    const tcWarning = weatherInfo.warnings.find(w => w.code && w.code.startsWith('TC'));
    if (tcWarning) return getWarningData(tcWarning.code, tcWarning.name);
    return null;
  }, [weatherInfo.warnings]);

  const getOrFetchAllStops = async () => {
    try {
      const cached = localStorage.getItem('kmb_all_stops_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.timestamp && Date.now() - parsed.timestamp < 3 * 24 * 60 * 60 * 1000) return parsed.stops;
      }
    } catch {}

    try {
      const res = await fetch('https://data.etabus.gov.hk/v1/transport/kmb/stop');
      if (res.ok) {
        const d = await res.json();
        const miniStops = (d.data || []).map(s => ({
          id: s.stop, name: s.name_tc, lat: parseFloat(s.lat), lng: parseFloat(s.long)
        })).filter(s => !isNaN(s.lat) && !isNaN(s.lng));
        try { localStorage.setItem('kmb_all_stops_cache', JSON.stringify({ timestamp: Date.now(), stops: miniStops })); } catch (e) {}
        return miniStops;
      }
    } catch (e) {}
    return [];
  };

  const findNearbyStops = useCallback(async (customCoords = null) => {
    setGpsLoading(true); setGpsMessage('正在取得你的 GPS 定位位置...'); setError(null);
    const getPosition = () => new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }));
    try {
      let lat, lng;
      if (customCoords) { lat = customCoords.lat; lng = customCoords.lng; } 
      else { const pos = await getPosition(); lat = pos.coords.latitude; lng = pos.coords.longitude; }
      setUserCoords({ lat, lng }); setGpsMessage('定位成功！正在搜索周邊巴士站...');
      const allStops = await getOrFetchAllStops();
      if (allStops.length === 0) throw new Error('無法取得巴士地圖資料庫');
      const withDistance = allStops.map(stop => ({ ...stop, distance: calculateDistance(lat, lng, stop.lat, stop.lng) }));
      const sortedNearby = withDistance.sort((a, b) => a.distance - b.distance).filter(s => s.distance <= nearbyRadius).slice(0, 4);
      setNearbyStops(sortedNearby); setGpsLoading(false);
      if (sortedNearby.length === 0) setGpsMessage(`定位成功，但你附近 ${nearbyRadius} 米內似乎沒有巴士站點。建議到設定中調大搜尋半徑。`);
      else setGpsMessage('');
    } catch (err) {
      setGpsLoading(false);
      let errorText = '無法取得定位。請開啟 GPS 或手動允許定位權限。';
      if (err.code === 1) errorText = '定位授權遭拒。請在瀏覽器設定中允許此網頁讀取位置。';
      else if (err.code === 3) errorText = 'GPS 定位超時，請重試。';
      setGpsMessage(errorText);
    }
  }, [nearbyRadius]);

  const fetchNearbyStopsLiveETA = useCallback(async () => {
    if (nearbyStops.length === 0) return;
    try {
      const stopPromises = nearbyStops.map(stop => fetch(`https://data.etabus.gov.hk/v1/transport/kmb/stop-eta/${stop.id}`).then(res => res.ok ? res.json() : { data: [] }).catch(() => ({ data: [] })));
      const results = await Promise.all(stopPromises);
      const currentMins = Math.floor(Date.now() / 60000);

      const processed = nearbyStops.map((stop, idx) => {
        const rawEtas = results[idx].data || [];
        const routeGroups = {};
        rawEtas.forEach(eta => {
          if (!eta.eta || !eta.route) return;
          const key = `${eta.route}-${eta.dir}-${eta.dest_tc}`;
          if (!routeGroups[key]) routeGroups[key] = { company: 'kmb', route: eta.route, dest: eta.dest_tc.includes('荃灣西') ? '荃灣西站' : eta.dest_tc, dir: eta.dir, serviceType: '1', etas: [] };
          routeGroups[key].etas.push(eta);
        });
        const routesDataList = Object.values(routeGroups).map(group => {
          group.etas.sort((a, b) => new Date(a.eta) - new Date(b.eta));
          const uniqueEtas = [];
          const seenMinutes = new Set();
          group.etas.forEach(e => {
            const minuteKey = Math.floor(new Date(e.eta).getTime() / 60000);
            if (!seenMinutes.has(minuteKey) && (minuteKey - currentMins) >= -1) {
              seenMinutes.add(minuteKey);
              uniqueEtas.push(e);
            }
          });
          return { 
            company: group.company,
            route: group.route, 
            dir: group.dir,
            serviceType: group.serviceType,
            dest: group.dest, 
            etas: uniqueEtas.slice(0, 2).map(e => ({ 
              time: new Date(e.eta), 
              rmk: (e.rmk_tc && e.rmk_tc.trim() !== "" && e.rmk_tc !== "原定班次") ? e.rmk_tc : null 
            })) 
          };
        });
        routesDataList.sort((a, b) => a.route.localeCompare(b.route, undefined, { numeric: true }));
        return { id: stop.id, name: stop.name, distance: stop.distance, routesData: routesDataList };
      });
      setNearbyStopsData(processed); setLastUpdated(new Date());
    } catch (e) {}
  }, [nearbyStops]);

  useEffect(() => {
    fetchNearbyStopsLiveETA();
    const timer = setInterval(fetchNearbyStopsLiveETA, 30000);
    return () => clearInterval(timer);
  }, [fetchNearbyStopsLiveETA]);

  const fetchCustomLocationsData = useCallback(async () => {
    if (!locations || locations.length === 0) { setLocationsData([]); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const currentMins = Math.floor(Date.now() / 60000);

      const promises = locations.map(async loc => {
        let allEtas = [];
        
        if (loc.routes.some(r => !r.company || r.company === 'kmb')) {
          try {
            const res = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/stop-eta/${loc.id}`);
            if (res.ok) { const d = await res.json(); allEtas.push(...(d.data || [])); }
          } catch(e) {}
        }
        
        const ctbRoutes = loc.routes.filter(r => r.company === 'ctb');
        if (ctbRoutes.length > 0) {
          await Promise.all(ctbRoutes.map(async r => {
            try {
              const res = await fetch(`https://rt.data.gov.hk/v1.1/transport/citybus-nwfb/eta/CTB/${loc.id}/${r.route}`);
              if (res.ok) { const d = await res.json(); allEtas.push(...(d.data || [])); }
            } catch(e) {}
          }));
        }

        const routesList = [];
        loc.routes.forEach(routeObj => {
          const comp = routeObj.company || 'kmb';
          const validEtas = allEtas.filter(eta => 
            eta.route === routeObj.route && 
            eta.eta && 
            (routeObj.dir ? eta.dir === routeObj.dir : true)
          );
          
          if (validEtas.length > 0) {
            validEtas.sort((a, b) => new Date(a.eta) - new Date(b.eta));
            const uniqueEtas = [];
            const seenMinutes = new Set();
            validEtas.forEach(e => {
              const minuteKey = Math.floor(new Date(e.eta).getTime() / 60000);
              if (!seenMinutes.has(minuteKey) && (minuteKey - currentMins) >= -1) {
                seenMinutes.add(minuteKey);
                uniqueEtas.push(e);
              }
            });

            const primaryDest = routeObj.customDest || uniqueEtas[0]?.dest_tc || routeObj.dest || "目的地";
            routesList.push({ 
              company: comp,
              route: routeObj.route, 
              dir: routeObj.dir,
              serviceType: routeObj.serviceType,
              dest: primaryDest.includes('荃灣西') ? '荃灣西站' : primaryDest, 
              customDest: routeObj.customDest, 
              etas: uniqueEtas.slice(0, 2).map(e => ({ 
                time: new Date(e.eta), 
                rmk: (e.rmk_tc && e.rmk_tc.trim() !== "" && e.rmk_tc !== "原定班次") ? e.rmk_tc : null 
              })) 
            });
          } else {
            routesList.push({ company: comp, route: routeObj.route, dir: routeObj.dir, serviceType: routeObj.serviceType, dest: routeObj.customDest || routeObj.dest || "未有班次", customDest: routeObj.customDest, etas: [] });
          }
        });
        routesList.sort((a, b) => a.route.localeCompare(b.route, undefined, { numeric: true }));
        return { ...loc, routesData: routesList };
      });

      const processedData = await Promise.all(promises);
      setLocationsData(processedData); setLastUpdated(new Date());
    } catch (err) { setError('到站預報載入失敗'); } finally { setLoading(false); }
  }, [locations]);

  useEffect(() => {
    fetchCustomLocationsData();
    const interval = setInterval(fetchCustomLocationsData, 30000);
    return () => clearInterval(interval);
  }, [fetchCustomLocationsData]);

  const groupedFavoritesData = useMemo(() => {
    const groups = {};
    locationsData.forEach(loc => {
      const gName = loc.groupName || '預設';
      if (!groups[gName]) groups[gName] = { groupName: gName, routesData: [] };
      const routesWithStopMeta = loc.routesData.map(r => ({ ...r, stopName: loc.name, stopId: loc.id }));
      groups[gName].routesData.push(...routesWithStopMeta);
    });
    return Object.values(groups).map(g => {
      g.routesData.sort((a, b) => a.route.localeCompare(b.route, undefined, { numeric: true }));
      return g;
    });
  }, [locationsData]);

  const filteredRoutesList = useMemo(() => {
    if (!routeQuery || !Array.isArray(allRoutesList)) return [];
    const q = routeQuery.toUpperCase().trim();
    
    const uniqueRoutes = [];
    const seen = new Set();
    
    allRoutesList
      .filter(r => r && r.route && r.route.toUpperCase().includes(q))
      .forEach(r => {
        const key = `${r.company}-${r.route}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueRoutes.push(r);
        }
      });
      
    return uniqueRoutes.sort((a, b) => {
      if (a.route === q) return -1;
      if (b.route === q) return 1;
      return a.route.localeCompare(b.route, undefined, { numeric: true });
    }).slice(0, 15); 
  }, [allRoutesList, routeQuery]);

  const handleDeleteLocation = (locId, e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setLocations(locations.filter(loc => loc.id !== locId));
    setLocationsData(prev => prev.filter(loc => loc.id !== locId));
  };

  const handleDeleteRouteInLocation = (locId, routeNum, e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setLocations(locations.map(loc => {
      if (loc.id === locId) return { ...loc, routes: loc.routes.filter(r => r.route !== routeNum) };
      return loc;
    }).filter(loc => loc.routes.length > 0));
    setLocationsData(prev => prev.map(loc => {
      if (loc.id === locId) return { ...loc, routesData: loc.routesData.filter(r => r.route !== routeNum) };
      return loc;
    }).filter(loc => loc.routesData.length > 0));
  };

  const handleUpdateCustomDest = (locId, routeNum, dir, newDest) => {
    setLocations(prev => prev.map(loc => {
      if (loc.id === locId) {
        return {
          ...loc,
          routes: loc.routes.map(r => {
            if (r.route === routeNum && r.dir === dir) {
              return { ...r, customDest: newDest };
            }
            return r;
          })
        };
      }
      return loc;
    }));
  };

  // 💡 極速版站名與經緯度快取讀取器 (專為全路線地圖設計)
  const fetchStopDetailsInBatch = async (stopIds, company = 'kmb') => {
    let cache = {};
    const cacheKey = `kmb_stop_details_cache_${company}`;
    try { cache = JSON.parse(localStorage.getItem(cacheKey) || '{}'); } catch {}
    
    const missingIds = stopIds.filter(id => !cache[id] || !cache[id].lat);
    
    if (missingIds.length > 0) {
      const fetchSingle = async (id) => {
        try { 
          const url = company === 'ctb' 
            ? `https://rt.data.gov.hk/v1.1/transport/citybus-nwfb/stop/${id}`
            : `https://data.etabus.gov.hk/v1/transport/kmb/stop/${id}`;
          const res = await fetch(url); 
          if (res.ok) { 
            const d = await res.json(); 
            return { id, name: d.data?.name_tc || id, lat: parseFloat(d.data?.lat), lng: parseFloat(d.data?.long) }; 
          } 
        } catch {}
        return { id, name: id, lat: null, lng: null };
      };
      const chunkSize = 10;
      for (let i = 0; i < missingIds.length; i += chunkSize) {
        const results = await Promise.all(missingIds.slice(i, i + chunkSize).map(fetchSingle));
        results.forEach(r => { cache[r.id] = r; });
      }
      try { localStorage.setItem(cacheKey, JSON.stringify(cache)); } catch {}
    }
    return cache;
  };

  const listRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylineRef = useRef(null);
  const markerRef = useRef(null);
  const stopsLayerRef = useRef(null);
  const arrowsLayerRef = useRef(null);

  // 💡 處理打開全路線地圖彈窗邏輯
  const handleOpenMap = async (initialStopId, stopName, company, routeNum, dir, dest, serviceType = '1') => {
    if (!initialStopId || !routeNum) return;
    
    setMapState({ 
      isOpen: true, 
      loadingMap: true, 
      loadingStops: true, 
      stop: { id: initialStopId, name: stopName }, 
      routeInfo: { company, route: routeNum, dir, dest },
      routeStops: [],
      error: null 
    });
    
    try {
      const dirStr = dir === 'I' ? 'inbound' : 'outbound';
      let stopsList = [];
      
      if (company === 'ctb') {
        const res = await fetch(`https://rt.data.gov.hk/v1.1/transport/citybus-nwfb/route-stop/CTB/${routeNum}/${dirStr}`);
        if (res.ok) {
           const d = await res.json();
           stopsList = Array.isArray(d.data) ? d.data : [];
        }
      } else {
        const res = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/route-stop/${routeNum}/${dirStr}/${serviceType}`);
        if (res.ok) {
           const d = await res.json();
           stopsList = Array.isArray(d.data) ? d.data : [];
        }
      }

      if (stopsList.length > 0) {
        const stopIds = stopsList.map(s => s.stop);
        const detailsMap = await fetchStopDetailsInBatch(stopIds, company);
        
        const processedStops = stopsList.map(s => ({ 
          id: s.stop, 
          seq: s.seq || 0, 
          name: detailsMap[s.stop]?.name || s.stop,
          lat: detailsMap[s.stop]?.lat,
          lng: detailsMap[s.stop]?.lng
        }));
        
        const targetStop = processedStops.find(s => s.id === initialStopId) || processedStops[0];

        setMapState(prev => ({ 
          ...prev, 
          loadingStops: false, 
          loadingMap: false,
          routeStops: processedStops,
          stop: targetStop,
          error: null
        }));
        
        setTimeout(() => {
          const activeStopEl = document.getElementById(`modal-stop-${initialStopId}`);
          if (activeStopEl && listRef.current) {
            activeStopEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      } else {
         setMapState(prev => ({ ...prev, loadingMap: false, loadingStops: false, error: '無法獲取此路線的詳細資料' }));
      }
    } catch (err) {
      setMapState(prev => ({ ...prev, loadingMap: false, loadingStops: false, error: '網絡連線異常，無法載入路線資料' }));
    }
  };

  // 💡 第一階段：初始化地圖與繪製全路線軌跡 (Polyline & Arrows)
  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || !mapState.isOpen || mapState.loadingStops) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = window.L.map(mapContainerRef.current, {
         zoomControl: false,
         attributionControl: false
      });
      window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
         maxZoom: 19
      }).addTo(mapInstanceRef.current);
    }

    const map = mapInstanceRef.current;

    if (mapState.routeStops.length > 0 && !polylineRef.current) {
       const validStops = mapState.routeStops.filter(s => s.lat && s.lng);
       const latlngs = validStops.map(s => [s.lat, s.lng]);
       
       if (latlngs.length > 0) {
           const polylineColor = mapState.routeInfo?.company === 'ctb' ? '#3b82f6' : '#ef4444'; 
           
           polylineRef.current = window.L.polyline(latlngs, { color: polylineColor, weight: 5, opacity: 0.8 }).addTo(map);

           stopsLayerRef.current = window.L.layerGroup().addTo(map);
           validStops.forEach(s => {
              window.L.circleMarker([s.lat, s.lng], {
                 radius: 3, fillColor: '#ffffff', color: polylineColor, weight: 2, fillOpacity: 1
              }).addTo(stopsLayerRef.current);
           });

           arrowsLayerRef.current = window.L.layerGroup().addTo(map);
           for(let i=0; i<latlngs.length-1; i++) {
              const p1 = latlngs[i];
              const p2 = latlngs[i+1];
              const distance = calculateDistance(p1[0], p1[1], p2[0], p2[1]);
              
              if (distance > 60) { 
                 const midLat = (p1[0] + p2[0]) / 2;
                 const midLng = (p1[1] + p2[1]) / 2;
                 const dy = p2[0] - p1[0];
                 const dx = Math.cos(Math.PI / 180 * p1[0]) * (p2[1] - p1[1]);
                 const heading = 90 - (Math.atan2(dy, dx) * 180 / Math.PI);
                 
                 const arrowIcon = window.L.divIcon({
                    className: 'route-arrow',
                    html: `<div style="transform: rotate(${heading}deg); width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0px 1px 1px rgba(0,0,0,0.3));">
                              <svg viewBox="0 0 24 24" width="14" height="14" fill="white" stroke="${polylineColor}" stroke-width="2" stroke-linejoin="round">
                                 <path d="M12 3L20 21L12 17L4 21L12 3Z" />
                              </svg>
                           </div>`,
                    iconSize: [14, 14],
                    iconAnchor: [7, 7]
                 });
                 window.L.marker([midLat, midLng], {icon: arrowIcon, interactive: false}).addTo(arrowsLayerRef.current);
              }
           }

           map.fitBounds(polylineRef.current.getBounds(), { padding: [40, 40] });
       }
    }
  }, [leafletLoaded, mapState.isOpen, mapState.loadingStops, mapState.routeStops, mapState.routeInfo]);

  // 💡 第二階段：根據選取的車站，更新實體巴士大頭針與地圖視角
  useEffect(() => {
    if (!mapInstanceRef.current || !mapState.stop?.lat || !mapState.stop?.lng) return;
    
    const map = mapInstanceRef.current;
    const stop = mapState.stop;

    if (markerRef.current) { map.removeLayer(markerRef.current); }

    const isCTB = mapState.routeInfo?.company === 'ctb';
    const pinColor = isCTB ? '#eab308' : '#e3342f'; // 城巴黃色針，九巴紅色針
    const pinShadow = isCTB ? 'rgba(234,179,8,0.4)' : 'rgba(227,52,47,0.4)';

    const customIcon = window.L.divIcon({
        className: 'custom-bus-pin',
        html: `<div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; margin-top: -44px; margin-left: -22px;">
                 <svg viewBox="0 0 24 24" fill="${pinColor}" style="position: absolute; inset: 0; width: 100%; height: 100%; filter: drop-shadow(0px 6px 6px ${pinShadow});">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
                 </svg>
                 <svg viewBox="0 0 24 24" fill="white" style="position: absolute; width: 22px; height: 22px; margin-bottom: 6px; z-index: 10;">
                    <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z" />
                 </svg>
               </div>`,
        iconSize: [44, 44],
        iconAnchor: [0, 0] 
    });

    markerRef.current = window.L.marker([stop.lat, stop.lng], { icon: customIcon, zIndexOffset: 1000 }).addTo(map);
    map.flyTo([stop.lat, stop.lng], 16, { animate: true, duration: 0.8 });
  }, [mapState.stop, mapState.routeInfo]);

  // 清除地圖實例
  useEffect(() => {
    if (!mapState.isOpen) {
       if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
       }
       polylineRef.current = null;
       stopsLayerRef.current = null;
       arrowsLayerRef.current = null;
       markerRef.current = null;
    }
  }, [mapState.isOpen]);

  const handleCopyBackupCode = () => {
    const backupJson = JSON.stringify(locations);
    const textArea = document.createElement("textarea");
    textArea.value = backupJson;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      if (successful) { setBackupSuccess('備份代碼複製成功！'); setTimeout(() => setBackupSuccess(''), 2000); } 
      else setBackupError('複製失敗，請手動複製文本。');
    } catch (err) { setBackupError('瀏覽器不支持自動複製。'); }
    document.body.removeChild(textArea);
  };

  const handleDownloadBackupFile = () => {
    try {
      const backupJson = JSON.stringify(locations, null, 2);
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(backupJson);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `巴士到站看板設定備份_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setBackupSuccess('自訂設定檔已成功下載！');
      setTimeout(() => setBackupSuccess(''), 3000);
    } catch (e) { setBackupError('檔案下載失敗，請嘗試複製代碼。'); }
  };

  const handleUploadFile = (e) => {
    const fileReader = new FileReader();
    const file = e.target.files[0];
    if (!file) return;
    fileReader.onload = (event) => { setImportText(event.target.result); setBackupSuccess('備份載入成功！請點選下方按鈕確認還原。'); setBackupError(''); };
    fileReader.onerror = () => { setBackupError('檔案讀取失敗'); };
    fileReader.readAsText(file);
  };

  const handleConfirmImport = () => {
    setBackupError(''); setBackupSuccess('');
    try {
      if (!importText.trim()) { setBackupError('請先貼上代碼或上傳檔案'); return; }
      const parsed = JSON.parse(importText.trim());
      if (!Array.isArray(parsed)) throw new Error('匯入格式必須為巴士站卡片陣列！');
      const isValid = parsed.every(item => item.id && item.name && Array.isArray(item.routes));
      if (!isValid) throw new Error('匯入資料遺漏關鍵欄位！');
      setLocations(parsed);
      setBackupSuccess('🎉 成功從備份中還原最愛看板配置！');
      setImportText('');
      setTimeout(() => { setIsSettingsModalOpen(false); setBackupSuccess(''); fetchCustomLocationsData(); }, 1500);
    } catch (e) { setBackupError(`匯入驗證失敗: ${e.message || '格式錯誤'}`); }
  };

  const handleResetToPreload = () => {
    setLocations(DEFAULT_LOCATIONS); setShowResetConfirm(false); setBackupSuccess('已成功重設為原裝最愛路線範例！');
    setTimeout(() => { setBackupSuccess(''); fetchCustomLocationsData(); }, 2000);
  };

  const handleOpenSearchModal = () => {
    setIsSettingsModalOpen(false); 
    setShouldReopenSettings(true);
    setIsSearchModalOpen(true); 
    setSearchStep(1); 
    setRouteQuery(''); 
    setSelectedRoute(null); 
    setSelectedDirection(null); 
    setSelectedStop(null);
    setCustomStopName(''); 
    setCustomStopDesc(''); 
    setCustomGroupName('預設'); 
    setCustomGroupInput('');
    
    if (allRoutesList.length === 0) {
      setLoadingRoutes(true);
      Promise.all([
        fetch('https://data.etabus.gov.hk/v1/transport/kmb/route/').then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
        fetch('https://rt.data.gov.hk/v1.1/transport/citybus-nwfb/route/CTB').then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] }))
      ]).then(([kmbData, ctbData]) => {
        const kmb = (Array.isArray(kmbData.data) ? kmbData.data : []).map(r => ({ ...r, company: 'kmb' }));
        const ctb = (Array.isArray(ctbData.data) ? ctbData.data : []).map(r => ({ ...r, company: 'ctb' }));
        setAllRoutesList([...kmb, ...ctb]);
      }).finally(() => {
        setLoadingRoutes(false);
      });
    }
  };

  const handleCloseSearchModal = () => {
    setIsSearchModalOpen(false);
    if (shouldReopenSettings) { setIsSettingsModalOpen(true); setShouldReopenSettings(false); }
  };

  const handleSelectRoute = (routeItem) => {
    setSelectedRoute(routeItem); 
    if (routeItem.company === 'ctb') {
      setRouteDirections([
        { ...routeItem, bound: 'O', dest_tc: routeItem.dest_tc, orig_tc: routeItem.orig_tc, service_type: '1' },
        { ...routeItem, bound: 'I', dest_tc: routeItem.orig_tc, orig_tc: routeItem.dest_tc, service_type: '1' }
      ]);
    } else {
      setRouteDirections(allRoutesList.filter(r => r.company === 'kmb' && r.route === routeItem.route));
    }
    setSearchStep(2);
  };

  const handleSelectDirection = async (directionItem) => {
    setSelectedDirection(directionItem); setSearchStep(3); setLoadingStops(true);
    try {
      const dirStr = directionItem.bound === 'I' ? 'inbound' : 'outbound';
      const apiUrl = selectedRoute.company === 'ctb' 
        ? `https://rt.data.gov.hk/v1.1/transport/citybus-nwfb/route-stop/CTB/${directionItem.route}/${dirStr}`
        : `https://data.etabus.gov.hk/v1/transport/kmb/route-stop/${directionItem.route}/${dirStr}/${directionItem.service_type}`;
        
      const res = await fetch(apiUrl);
      if (res.ok) {
        const d = await res.json();
        const stopList = Array.isArray(d.data) ? d.data : [];
        const stopIds = stopList.map(s => s.stop);
        const nameCache = await fetchStopNamesInBatch(stopIds, selectedRoute.company);
        setRouteStops(stopList.map(s => ({ ...s, name_tc: nameCache[s.stop] || s.stop })));
      } else {
        setRouteStops([]);
      }
    } catch (e) { 
      console.error("無法取得巴士站清單", e); 
      setRouteStops([]);
    } finally { 
      setLoadingStops(false); 
    }
  };

  const handleSelectStop = (stopItem) => {
    setSelectedStop(stopItem); setCustomStopName(stopItem.name_tc); setCustomStopDesc(`${selectedDirection.dest_tc}`); setSearchStep(4);
  };

  const handleConfirmAddStop = () => {
    if (!selectedStop) return;
    const finalGroupName = customGroupName === 'NEW' ? (customGroupInput.trim() || '自訂') : customGroupName;
    
    const newRouteConfig = { 
      company: selectedRoute.company || 'kmb',
      route: selectedDirection.route, 
      dir: selectedDirection.bound, 
      dest: selectedDirection.dest_tc, 
      serviceType: selectedDirection.service_type,
      customDest: customStopDesc.trim() || "" 
    };
    
    const existingIndex = locations.findIndex(loc => loc.id === selectedStop.stop);
    let updatedLocations;
    
    if (existingIndex > -1) {
      updatedLocations = locations.map((loc, idx) => {
        if (idx === existingIndex) {
          const isRouteDuplicate = loc.routes.some(r => r.route === newRouteConfig.route && r.dir === newRouteConfig.dir && r.company === newRouteConfig.company);
          return {
            ...loc,
            name: customStopName.trim() || loc.name,
            groupName: finalGroupName,
            routes: isRouteDuplicate ? loc.routes : [...loc.routes, newRouteConfig]
          };
        }
        return loc;
      });
    } else {
      const newCard = {
        id: selectedStop.stop, filterId: finalGroupName.toUpperCase().replace(/\s+/g, ''), groupName: finalGroupName,
        name: customStopName.trim() || selectedStop.name_tc, routes: [newRouteConfig]
      };
      updatedLocations = [...locations, newCard];
    }

    setLocations(updatedLocations); 
    handleCloseSearchModal();
    setTimeout(() => fetchCustomLocationsData(), 200);
  };

  const renderRow = (route, rIdx, isNearbySource = false, layoutType = 'LIST') => {
    const isEven = rIdx % 2 === 0;
    const rowBg = isEven ? theme.rowEven : theme.rowOdd;
    
    const primaryRmk = route.etas[0] ? route.etas[0].rmk : null;
    const secondaryRmk = route.etas[1] ? route.etas[1].rmk : null;
    
    const primaryMins = route.etas[0] ? getEtaMinutes(route.etas[0].time) : null;
    const secondaryMins = route.etas[1] ? getEtaMinutes(route.etas[1].time) : null;
    const isMissed = primaryMins !== null && primaryMins < 0;
    const isImminent = primaryMins === 0;

    let etaColorStyle = isDarkMode ? '#f4f4f5' : '#0f172a'; 
    if (primaryMins !== null && primaryMins >= 0) {
      if (primaryMins <= 5) etaColorStyle = '#e3342f';       
      else if (primaryMins <= 10) etaColorStyle = '#f97316'; 
    }

    const isStand = layoutType === 'STAND';
    const routeNumSize = isStand ? 'text-4xl lg:text-5xl' : 'text-5xl sm:text-6xl md:text-7xl';
    const destSize = isStand ? 'text-xs' : 'text-base sm:text-lg'; 
    const primaryNumSize = isStand ? 'text-4xl lg:text-5xl' : 'text-5xl sm:text-6xl md:text-7xl';
    const primaryTextSize = isStand ? 'text-2xl' : 'text-3xl sm:text-4xl';
    const secondarySize = isStand ? 'text-lg' : 'text-2xl sm:text-3xl';
    const rowPadding = isStand ? 'px-4 py-3' : 'px-5 py-4 sm:py-5';
    const primaryEtaHeight = isStand ? 'h-[40px] lg:h-[48px]' : 'h-[50px] sm:h-[60px] md:h-[72px]';

    const routeNumColorClass = route.company === 'ctb' ? 'text-blue-700 dark:text-blue-400' : theme.routeNum;

    // 💡 點擊開啟地圖效果
    const isClickable = !!route.stopId;
    const clickableClasses = isClickable ? 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.99]' : '';

    return (
      <div 
        key={rIdx} 
        onClick={() => { if (isClickable) handleOpenMap(route.stopId, route.stopName, route.company, route.route, route.dir, route.dest, route.serviceType); }}
        className={`flex justify-between items-center ${rowPadding} transition-all border-b border-gray-500/5 ${rowBg} ${clickableClasses}`}
      >
        
        <div className="flex flex-col items-start justify-center flex-1 min-w-0 pr-3 pointer-events-none">
          <div className="flex items-center gap-2.5">
            <span className={`${routeNumSize} font-black tracking-tighter leading-none text-left block ${routeNumColorClass}`}>
              {route.route}
            </span>
            <CompanyBadge company={route.company} className="h-4 sm:h-5 lg:h-6 object-contain drop-shadow-sm rounded-sm shrink-0" />
          </div>
          <span className={`${destSize} font-extrabold mt-1 sm:mt-1.5 ${theme.routeDest} block truncate w-full text-left`}>
            往 {route.dest}
          </span>
        </div>
        
        <div className="flex flex-col items-end justify-center shrink-0 min-w-[80px] pointer-events-none">
          
          <div className={`flex items-center justify-end gap-2 sm:gap-3 ${primaryEtaHeight}`}>
            {primaryRmk && primaryMins !== null && (
              <span className="text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded bg-[#e3342f]/10 text-[#e3342f] dark:bg-red-500/20 dark:text-red-400 border border-[#e3342f]/20 shadow-sm leading-none whitespace-nowrap">
                {primaryRmk}
              </span>
            )}
            {primaryMins === null ? (
              <span className={`${primaryNumSize} font-black leading-none ${theme.etaMissed}`}>-</span>
            ) : isMissed ? (
              <span className={`${primaryTextSize} font-black tracking-wide leading-none ${theme.etaMissed}`}>已開出</span>
            ) : isImminent ? (
              <span style={{ color: etaColorStyle }} className={`${primaryTextSize} font-black tracking-wide animate-pulse leading-none`}>即將到站</span>
            ) : (
              <span style={{ color: etaColorStyle }} className={`${primaryNumSize} font-black tracking-tighter leading-none`}>{primaryMins}</span>
            )}
          </div>
          
          <div className="flex items-center justify-end gap-2 sm:gap-3 mt-1.5 sm:mt-2">
            {secondaryRmk && secondaryMins !== null && secondaryMins >= 0 && (
              <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-500 dark:bg-gray-400/20 dark:text-gray-400 border border-gray-500/20 leading-none whitespace-nowrap">
                {secondaryRmk}
              </span>
            )}
            {secondaryMins !== null && secondaryMins >= 0 ? (
              <span className={`${secondarySize} font-extrabold ${theme.etaSecondary} leading-none`}>
                {secondaryMins}
              </span>
            ) : (
              <span className={`opacity-0 ${secondarySize} leading-none`}>-</span>
            )}
          </div>

        </div>

      </div>
    );
  };

  const validWarnings = useMemo(() => {
    return (weatherInfo.warnings || [])
      .map(warn => getWarningData(warn.code, warn.name))
      .filter(wData => wData !== null); 
  }, [weatherInfo.warnings]);

  // === 📱 列表模式 ===
  const renderListMode = () => {
    const filteredGroups = groupedFavoritesData.filter(g => activeTab === 'ALL' || g.groupName === activeTab);

    return (
      <div className="w-full max-w-4xl mx-auto px-0 sm:px-3 pt-0 sm:pt-4 pb-24">
        {error && <div className="bg-red-50 text-red-600 p-2.5 text-center text-xs font-bold mx-3 my-3 rounded-lg">{error}</div>}
        
        {/* 💡 主畫面實時天氣警告顯示區 (完美無 CORS 限制) */}
        {validWarnings.length > 0 && (
          <div className="flex flex-col gap-2 px-3 sm:px-0 mb-4 mt-2">
            {validWarnings.map((wData, idx) => (
              <div key={idx} className={`flex items-center justify-center gap-3 w-full py-2.5 px-4 rounded-xl font-black text-base shadow-md animate-pulse ${wData.style}`}>
                <WarningBadge img={wData.img} text={wData.text} iconBg={wData.iconBg} className="w-7 h-7 object-contain" />
                <span>{wData.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* ================= 🛰️ 附近巴士站專屬分頁 ================= */}
        {activeTab === 'NEARBY' && (
          <div className="flex flex-col gap-4 px-3 sm:px-0 mt-3 sm:mt-0">
            {(!userCoords || gpsLoading) ? (
              <div className={`p-8 rounded-2xl border text-center flex flex-col items-center justify-center gap-3 ${theme.emptyStateBg}`}>
                <MapPin className="w-8 h-8 text-blue-500 animate-bounce" />
                <h3 className="text-sm font-bold">探索附近巴士站</h3>
                <p className="text-gray-400 text-xs max-w-xs leading-relaxed">我們將使用 GPS 定位尋找你周圍最近的巴士站點與實時到站時間 (目前支援九巴)。</p>
                <button onClick={() => findNearbyStops()} disabled={gpsLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 shadow-md">
                  <Navigation className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
                  {gpsLoading ? '正在定位中...' : '授權並尋找附近站點'}
                </button>
                {gpsMessage && <span className="text-xs font-medium text-red-500 mt-2">{gpsMessage}</span>}
              </div>
            ) : (
              <div className="flex justify-end pr-1">
                <button onClick={() => findNearbyStops()} disabled={gpsLoading} className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 text-xs font-bold rounded-lg transition-all shadow-sm">
                  <Navigation className={`w-3 h-3 ${gpsLoading ? 'animate-spin' : ''}`} />
                  更新 GPS 附近站點 ({nearbyRadius} 米內)
                </button>
              </div>
            )}

            {userCoords && nearbyStopsData.length > 0 ? (
              nearbyStopsData.map((loc, idx) => (
                <div key={idx} className={`rounded-xl overflow-hidden shadow-sm border ${theme.groupCardBg}`}>
                  <div className={`px-4 py-2.5 flex items-center justify-between border-b ${theme.groupHeaderBg}`}>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-extrabold shadow-sm ${theme.pillBg}`}>{loc.name}</span>
                      <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">距離 {loc.distance} 米</span>
                    </div>
                    {/* 💡 點擊看地圖提示 */}
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 font-bold flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> 點擊看地圖
                    </span>
                  </div>
                  <div className="flex flex-col">
                    {loc.routesData.map((route, rIdx) => renderRow({...route, stopId: loc.id, stopName: loc.name}, rIdx, true, 'LIST'))}
                  </div>
                </div>
              ))
            ) : userCoords && !gpsLoading && (
              <div className="text-center py-10 opacity-60">
                <MapPin className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-xs">周圍符合半徑的範圍內未找到任何巴士站點。</p>
              </div>
            )}
          </div>
        )}

        {/* ================= ⭐️ 我的收藏 ================= */}
        {activeTab !== 'NEARBY' && (
          <>
            {locations.length === 0 && (
              <div className={`text-center py-16 rounded-2xl mx-3 shadow-sm border ${theme.emptyStateBg}`}>
                <Bus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold mb-1">收藏看板還是空的</h3>
                <button onClick={() => setIsSettingsModalOpen(true)} className="bg-[#e3342f] text-white px-4 py-2 text-xs font-bold rounded-lg shadow-sm mt-3">開啟設定中心新增路線</button>
              </div>
            )}

            <div className="flex flex-col gap-5 sm:gap-6">
              {filteredGroups.map((group, gIdx) => (
                <div key={gIdx} className={`sm:rounded-2xl overflow-hidden shadow-sm border-b sm:border ${theme.groupCardBg}`}>
                  
                  <div className={`flex justify-between items-center px-5 py-3 sm:py-4 text-base sm:text-lg font-black border-b ${theme.groupHeaderText}`}>
                    <span className="flex-1 text-left">路線</span>
                    
                    <div className="flex flex-col items-center justify-center shrink-0 mx-2">
                      <span className="bg-[#e3342f] text-white px-6 py-1.5 rounded-full text-sm sm:text-base tracking-widest shadow-sm">
                        {group.groupName}
                      </span>
                      {/* 💡 點擊看地圖提示 */}
                      <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold mt-1 tracking-wider opacity-70">點擊看全路線地圖</span>
                    </div>

                    <span className="flex-1 text-right">分鐘</span>
                  </div>

                  <div className="flex flex-col">
                    {group.routesData.map((route, rIdx) => renderRow(route, rIdx, false, 'LIST'))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  // === 🖥️ 橫向「座枱模式」 ===
  const renderStandMode = () => {
    let displayRoutes = [];
    let title = "我的最愛";
    if (standMonitorId === 'ALL_FAVORITES') {
      groupedFavoritesData.forEach(g => displayRoutes.push(...g.routesData));
      title = "全部最愛";
    } else if (standMonitorId === 'NEARBY_STOPS') {
      nearbyStopsData.forEach(s => {
        const withStopName = s.routesData.map(r => ({ ...r, stopName: s.name, stopId: s.id }));
        displayRoutes.push(...withStopName);
      });
      title = "附近巴士站";
    } else {
      const match = groupedFavoritesData.find(g => g.groupName === standMonitorId);
      if (match) { displayRoutes = match.routesData; title = match.groupName; }
      else { 
        groupedFavoritesData.forEach(g => displayRoutes.push(...g.routesData));
        title = "全部最愛";
      }
    }

    return (
      <div className="flex flex-row w-full h-full overflow-hidden relative bg-black">
        
        <div className="w-[70%] h-full relative overflow-hidden bg-black shadow-[inset_-10px_0_20px_rgba(0,0,0,0.5)] z-0 shrink-0">
          {leftPanelMode === 'WEATHER' ? (
            <div className="absolute inset-0 flex flex-col justify-between p-8 md:p-12">
              <div className="absolute inset-0 bg-cover bg-center transition-all duration-1000" style={{ backgroundImage: `url(${WEATHER_BG})` }} />
              <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/40 to-black/80" />
              <div className="relative z-10 text-white drop-shadow-lg">
                <h2 className="text-lg md:text-xl font-bold text-white/95 mb-1">{formatChineseDate(now)}</h2>
                <span className="text-[3.5rem] md:text-[5.5rem] font-black leading-none tracking-tight drop-shadow-2xl">
                  {now.getHours().toString().padStart(2, '0')}:{now.getMinutes().toString().padStart(2, '0')}:{now.getSeconds().toString().padStart(2, '0')}
                </span>
              </div>
              <div className="relative z-10 flex flex-col items-start gap-2 text-white">
                <div className="flex items-center gap-3">
                  {weatherInfo.icon && (
                    <img 
                      src={`https://www.hko.gov.hk/images/HKOWxIconOutline/pic${weatherInfo.icon}.png`} 
                      alt="Weather" 
                      className="w-16 h-16 drop-shadow-xl" 
                      referrerPolicy="no-referrer" 
                    />
                  )}
                  <div className="flex flex-col">
                    <span className="text-4xl md:text-5xl font-black">{weatherInfo.temp}°C</span>
                    <span className="text-[10px] font-bold text-white/70">香港天文台</span>
                  </div>
                </div>
                {/* 💡 座枱模式警告標籤 */}
                {validWarnings.length > 0 && (
                  <div className="flex flex-wrap gap-2 max-w-full mt-1">
                    {validWarnings.map((wData, idx) => (
                      <div key={idx} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-black text-sm shadow-lg animate-pulse ${wData.style}`}>
                        <WarningBadge img={wData.img} text={wData.text} iconBg={wData.iconBg} className="w-5 h-5 object-contain" isSmall={true} />
                        <span>{wData.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {DEFAULT_PHOTOS.map((src, i) => (
                <img key={i} src={src} alt="Slideshow" className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${i === photoIndex ? 'opacity-100' : 'opacity-0'}`} />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </>
          )}
        </div>

        <div className={`w-[30%] h-full flex flex-col z-10 transition-colors shadow-2xl ${theme.appBg}`}>
          <div className="px-4 pt-4 pb-3 border-b border-gray-500/10 flex flex-col gap-2 shrink-0">
            <div className="relative">
              <select 
                value={standMonitorId} 
                onChange={(e) => setStandMonitorId(e.target.value)}
                className={`w-full text-xs font-bold py-1.5 px-3 rounded-lg border appearance-none outline-none ${theme.inputBg}`}
              >
                <option value="ALL_FAVORITES">★ 全部最愛</option>
                {nearbyStopsData.length > 0 && <option value="NEARBY_STOPS">🛰️ 附近巴士站</option>}
                {groupedFavoritesData.map(g => <option key={g.groupName} value={g.groupName}>📁 分組: {g.groupName}</option>)}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-2 pointer-events-none opacity-60" />
            </div>
          </div>

          <div className={`flex justify-between px-4 py-2.5 text-xs font-black border-b shrink-0 ${theme.groupHeaderText}`}>
            <span>路線</span>
            <span>分鐘</span>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col">
            {displayRoutes.length > 0 ? (
              displayRoutes.map((route, rIdx) => renderRow(route, rIdx, true, 'STAND'))
            ) : (
              <div className="p-8 text-center text-xs opacity-50">本項目無即時班次</div>
            )}
          </div>
        </div>

      </div>
    );
  };

  return (
    <div className={`h-screen flex flex-col font-sans transition-colors duration-300 overflow-hidden ${theme.appBg}`}>
      <style>{`
        /* 防止 iOS 電話連結變色覆蓋 */
        a[x-apple-data-detectors], a[href^="tel"] {
          color: inherit !important;
          text-decoration: none !important;
        }
        
        /* 解決 iOS 橫向滑動與隱藏卷軸 */
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; -webkit-overflow-scrolling: touch; }

        /* 💡 全新 Leaflet 地圖樣式修復與覆寫 */
        .leaflet-container {
           background: transparent !important;
        }
        .leaflet-control-attribution {
           display: none !important;
        }
      `}</style>

      <header className={`px-4 py-3 flex items-center justify-between border-b shadow-sm z-20 shrink-0 transition-colors ${theme.topBar}`}>
        <div className="flex gap-2 w-[90px]">
          <button onClick={() => setIsStandMode(!isStandMode)} className={`p-1.5 rounded-full ${isStandMode ? 'bg-white text-red-600 shadow-md' : 'text-white/80 hover:text-white'}`}>
            <MonitorSmartphone className="w-6 h-6" />
          </button>
          {isStandMode && (
            <button onClick={() => setLeftPanelMode(leftPanelMode === 'WEATHER' ? 'PHOTO' : 'WEATHER')} className="ml-1 p-1.5 rounded-full bg-white/20 text-white border border-white/20 flex items-center gap-1 px-3">
              {leftPanelMode === 'WEATHER' ? <><ImageIcon className="w-5 h-5" /><span className="text-xs font-bold hidden sm:inline">轉相簿</span></> : <><CloudSun className="w-5 h-5" /><span className="text-xs font-bold hidden sm:inline">轉天氣</span></>}
            </button>
          )}
        </div>
        
        <div className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 min-w-0">
          <h1 className="text-base sm:text-lg md:text-xl font-black tracking-widest text-white truncate">巴士到站看板</h1>
          {(weatherInfo.temp !== '--' || activeTCWarning) && (
            <div className="flex items-center gap-1.5 bg-black/20 dark:bg-black/40 border border-white/10 px-2 py-0.5 rounded-full shadow-inner shrink-0">
              {/* 💡 頂部颱風標誌 */}
              {activeTCWarning && activeTCWarning.img && (
                <WarningBadge img={activeTCWarning.img} text={activeTCWarning.text} iconBg={activeTCWarning.iconBg} className="w-4 h-4 sm:w-5 sm:h-5 object-contain drop-shadow-md" isSmall={true} />
              )}
              {/* 💡 頂部一般天氣圖示 (無防盜鏈問題) */}
              {weatherInfo.icon && (
                <img 
                  src={`https://www.hko.gov.hk/images/HKOWxIconOutline/pic${weatherInfo.icon}.png`} 
                  alt="weather icon" 
                  className="w-4 h-4 sm:w-5 sm:h-5 object-contain"
                  referrerPolicy="no-referrer" 
                />
              )}
              {weatherInfo.temp !== '--' && (
                <span className="text-xs sm:text-sm font-bold text-white ios-num-fix tracking-wide">{weatherInfo.temp}°C</span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 w-[90px]">
          <button onClick={() => { if (activeTab === 'NEARBY' && userCoords) fetchNearbyStopsLiveETA(); else fetchCustomLocationsData(); fetchWeather(); }} className="p-1.5 text-white/85 hover:text-white rounded-full">
            <RefreshCw className={`w-6 h-6 ${loading || gpsLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setIsSettingsModalOpen(true)} className="p-1.5 text-white/85 hover:text-white rounded-full hover:bg-white/10 transition-colors">
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className={`flex-1 w-full overflow-hidden ${isStandMode ? 'flex' : 'overflow-y-auto'}`}>
        {!isStandMode ? renderListMode() : renderStandMode()}
      </main>

      {!isStandMode && (
        <footer className={`fixed bottom-0 left-0 w-full p-2.5 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-colors z-20 ${theme.bottomBar}`}>
          <div className="max-w-4xl mx-auto flex gap-1.5 overflow-x-auto no-scrollbar items-center">
            {availableGroups.map(group => (
              <button 
                key={group}
                onClick={() => { setActiveTab(group); if (group === 'NEARBY' && !userCoords && !gpsLoading) findNearbyStops(); }} 
                className={`px-4 py-2.5 rounded-xl text-xs font-bold text-center transition-all duration-200 shrink-0 ${activeTab === group ? theme.tabActive : theme.tabInactive}`}
              >
                {group === 'NEARBY' ? '🛰️ 附近' : group === 'ALL' ? '★ 全部最愛' : group}
              </button>
            ))}
          </div>
        </footer>
      )}

      {/* 🗺️ 全新全路線互動地圖與時間軸彈出視窗 Modal */}
      {mapState.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 sm:p-4 backdrop-blur-md animate-fade-in" onClick={() => setMapState({ ...mapState, isOpen: false })}>
          <div className={`w-full h-full sm:h-[85vh] sm:max-w-md shadow-2xl flex flex-col overflow-hidden sm:rounded-2xl border ${theme.modalBg}`} onClick={(e) => e.stopPropagation()}>
            
            {/* 💡 官方風格 Header：根據巴士公司轉換顏色 */}
            <div className={`px-5 py-3.5 flex items-center justify-between shrink-0 shadow-sm z-10 ${mapState.routeInfo?.company === 'ctb' ? 'bg-[#ffcc00] text-yellow-950 border-b border-yellow-500' : 'bg-[#e3342f] text-white border-b border-red-700'}`}>
              <div className="flex flex-col min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <CompanyBadge company={mapState.routeInfo?.company} className="h-4 sm:h-5 brightness-0 invert opacity-90" />
                  <span className="text-2xl sm:text-3xl font-black tracking-tight leading-none drop-shadow-sm">{mapState.routeInfo?.route}</span>
                </div>
                <span className="text-xs sm:text-sm font-bold opacity-95 mt-1 truncate">
                  往 <span className="font-extrabold">{mapState.routeInfo?.dest}</span>
                </span>
              </div>
              <button onClick={() => setMapState({ ...mapState, isOpen: false })} className={`p-1.5 rounded-full transition-colors shrink-0 ${mapState.routeInfo?.company === 'ctb' ? 'hover:bg-yellow-500/50' : 'hover:bg-white/20'}`}>
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* 💡 上半部：全新 Leaflet 互動地圖 */}
            <div className="h-[40%] min-h-[220px] shrink-0 relative bg-gray-200 dark:bg-zinc-800 border-b border-gray-300 dark:border-zinc-700 shadow-inner">
              <div ref={mapContainerRef} className="w-full h-full z-0" />
              
              {mapState.loadingMap && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-200/80 dark:bg-zinc-800/80 z-20 backdrop-blur-sm">
                  <RefreshCw className={`w-8 h-8 animate-spin ${mapState.routeInfo?.company === 'ctb' ? 'text-blue-600' : 'text-red-500'}`} />
                  <span className="text-xs font-bold opacity-70 text-slate-800 dark:text-zinc-200">正在載入地圖...</span>
                </div>
              )}
              {mapState.error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-red-500 bg-red-50 dark:bg-red-950/20 z-20">
                  <AlertTriangle className="w-8 h-8" />
                  <span className="text-xs font-bold">{mapState.error}</span>
                </div>
              )}

              {/* Google Maps 備用捷徑按鈕 */}
              {!mapState.loadingMap && !mapState.error && mapState.stop?.lat && (
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${mapState.stop.lat},${mapState.stop.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-3 right-3 z-[1000] bg-white/90 dark:bg-zinc-900/90 backdrop-blur text-blue-600 dark:text-blue-400 p-2.5 rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center justify-center border border-gray-200 dark:border-zinc-700"
                  title="在 Google Maps 開啟"
                >
                  <MapPin className="w-5 h-5" />
                </a>
              )}
            </div>
            
            {/* 💡 下半部：全路線站點時間軸列表 (Click to Fly) */}
            <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-zinc-950 relative shadow-[inset_0_10px_10px_-10px_rgba(0,0,0,0.05)]" ref={listRef}>
              {mapState.loadingStops ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-800 dark:text-zinc-200">
                  <RefreshCw className={`w-8 h-8 animate-spin ${mapState.routeInfo?.company === 'ctb' ? 'text-blue-600' : 'text-red-500'}`} />
                  <span className="text-xs font-bold opacity-70">正在載入全線巴士站...</span>
                </div>
              ) : mapState.routeStops.length > 0 ? (
                <div className="py-2">
                  {mapState.routeStops.map((stop, idx) => {
                    const isCurrent = stop.id === mapState.stop?.id;
                    const isLast = idx === mapState.routeStops.length - 1;
                    const isCTB = mapState.routeInfo?.company === 'ctb';
                    
                    return (
                      <div 
                        key={idx} 
                        id={`modal-stop-${stop.id}`} 
                        onClick={() => {
                          setMapState(prev => ({ ...prev, stop: stop }));
                          document.getElementById(`modal-stop-${stop.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        className={`flex items-stretch px-4 sm:px-6 cursor-pointer transition-colors duration-300 ${isCurrent ? (isCTB ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-red-50 dark:bg-red-950/20') : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
                      >
                        
                        {/* 繪製左側時間軸 */}
                        <div className="flex flex-col items-center mr-4 w-6 shrink-0 relative pointer-events-none">
                          <div className={`w-1 flex-1 ${idx === 0 ? 'bg-transparent' : 'bg-gray-300 dark:bg-zinc-700'}`} />
                          <div className={`w-3.5 h-3.5 rounded-full border-[2.5px] border-white dark:border-zinc-900 shadow-sm z-10 my-1 transition-all ${
                            isCurrent 
                              ? (isCTB ? 'bg-blue-600 border-blue-200 w-4 h-4 scale-110' : 'bg-red-500 border-red-200 w-4 h-4 scale-110') 
                              : 'bg-gray-400 dark:bg-zinc-500'
                          }`} />
                          <div className={`w-1 flex-1 ${isLast ? 'bg-transparent' : 'bg-gray-300 dark:bg-zinc-700'}`} />
                        </div>
                        
                        {/* 站點名稱 */}
                        <div className={`py-3.5 flex-1 border-b border-gray-200 dark:border-zinc-800 ${isLast ? 'border-transparent' : ''}`}>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${isCurrent ? (isCTB ? 'bg-blue-500 text-white' : 'bg-red-500 text-white') : 'bg-gray-200 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                              {idx + 1}
                            </span>
                            <span className={`text-sm ${isCurrent ? 'font-black text-slate-900 dark:text-white text-base' : 'font-bold text-slate-700 dark:text-zinc-300'}`}>
                              {stop.name}
                            </span>
                          </div>
                          {isCurrent && (
                            <span className={`text-[10px] font-bold mt-1.5 flex items-center gap-1 ${isCTB ? 'text-blue-600 dark:text-blue-400' : 'text-red-500 dark:text-red-400'}`}>
                              <MapPin className="w-3 h-3" /> 當前選取車站
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-50 p-6 text-center text-slate-800 dark:text-zinc-200">
                  <span className="text-sm font-bold">無法載入路線沿途站點</span>
                  <span className="text-xs mt-1">此路線可能已暫停服務或資料庫更新中</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ⚙️ Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border ${theme.modalBg}`}>
            
            <div className="px-5 py-4 border-b border-gray-500/10 flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-base flex items-center gap-2 text-[#e3342f]">
                <Settings className="w-5 h-5 animate-spin-hover" />
                看板設定中心
              </h3>
              
              <div className="flex items-center gap-2">
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors border border-gray-200 dark:border-zinc-700 shadow-sm" title="切換深淺色主題">
                  <Sun className="w-5 h-5 hidden dark:block text-yellow-500" />
                  <Moon className="w-5 h-5 block dark:hidden text-slate-700" />
                </button>
                <button onClick={() => { setIsSettingsModalOpen(false); setBackupError(''); setBackupSuccess(''); setImportText(''); }} className="p-1.5 rounded-full hover:bg-gray-500/10 bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex border-b border-gray-500/10 bg-slate-500/5 shrink-0 text-xs font-black">
              <button onClick={() => { setSettingsTab('FAVORITES'); setBackupError(''); setBackupSuccess(''); }} className={`flex-1 py-3 text-center transition-all ${settingsTab === 'FAVORITES' ? 'border-b-2 border-[#e3342f] text-[#e3342f]' : 'opacity-60'}`}>📁 最愛管理</button>
              <button onClick={() => { setSettingsTab('BACKUP'); setBackupError(''); setBackupSuccess(''); }} className={`flex-1 py-3 text-center transition-all ${settingsTab === 'BACKUP' ? 'border-b-2 border-[#e3342f] text-[#e3342f]' : 'opacity-60'}`}>💾 備份還原</button>
              <button onClick={() => { setSettingsTab('ADVANCED'); setBackupError(''); setBackupSuccess(''); }} className={`flex-1 py-3 text-center transition-all ${settingsTab === 'ADVANCED' ? 'border-b-2 border-[#e3342f] text-[#e3342f]' : 'opacity-60'}`}>⚙️ 進階設定</button>
            </div>

            <div className="flex-1 p-5 overflow-y-auto bg-slate-50 dark:bg-zinc-950/50">
              {backupSuccess && <div className="mb-4 bg-green-500/10 border border-green-500/20 text-green-500 p-2.5 text-center text-xs font-bold rounded-lg animate-pulse">{backupSuccess}</div>}
              {backupError && <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-500 p-2.5 text-center text-xs font-bold rounded-lg">{backupError}</div>}

              {settingsTab === 'FAVORITES' && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-xs font-black opacity-60">已收藏 {locations.length} 個巴士站點：</span>
                    <button onClick={handleOpenSearchModal} className="bg-[#e3342f] hover:bg-red-600 text-white px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1 transition-all">
                      <Plus className="w-3.5 h-3.5" />手動新增路線
                    </button>
                  </div>
                  
                  {locations.length === 0 ? (
                    <div className="py-12 text-center text-xs opacity-50 border border-dashed rounded-xl">目前無自訂路線，請點擊右上方「手動新增路線」。</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {locations.map((loc) => (
                        <div key={loc.id} className="p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex flex-col gap-3 relative">
                          <div className="flex items-start justify-between border-b border-gray-100 dark:border-zinc-800 pb-2.5">
                            <div className="flex flex-col pr-2">
                              <span className="text-sm font-black text-slate-800 dark:text-zinc-100">{loc.name}</span>
                              <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 mt-0.5">📂 {loc.groupName || '預設'}</span>
                            </div>
                            <button onClick={(e) => handleDeleteLocation(loc.id, e)} className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 rounded-lg transition-all shrink-0" title="刪除整個車站">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            {loc.routes.map((r, rIdx) => (
                              <div key={`${r.route}-${r.dir}-${rIdx}`} className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-800/50 p-2 rounded-lg border border-gray-100 dark:border-zinc-800">
                                <CompanyBadge company={r.company} className="h-3 sm:h-3.5 object-contain opacity-80" />
                                <span className={`text-sm font-black w-10 text-center ${r.company === 'ctb' ? 'text-blue-600 dark:text-blue-400' : 'text-red-500'}`}>{r.route}</span>
                                
                                <input 
                                  type="text"
                                  value={r.customDest !== undefined ? r.customDest : (r.dest || '')}
                                  onChange={(e) => handleUpdateCustomDest(loc.id, r.route, r.dir, e.target.value)}
                                  onBlur={() => setTimeout(fetchCustomLocationsData, 200)}
                                  placeholder={r.dest || '自訂目的地'}
                                  className="flex-1 min-w-0 text-xs font-bold bg-transparent border-b border-dashed border-gray-300 dark:border-zinc-600 focus:border-blue-500 text-slate-700 dark:text-zinc-300 outline-none pb-0.5 transition-colors placeholder:text-gray-400"
                                  title="點擊直接修改目的地文字"
                                />

                                <button 
                                  onClick={(e) => handleDeleteRouteInLocation(loc.id, r.route, e)} 
                                  className="p-1 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                                  title="移除路線"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {settingsTab === 'BACKUP' && (
                <div className="flex flex-col gap-4">
                  <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex flex-col gap-3">
                    <span className="text-xs font-black">📥 匯出最愛備份設定</span>
                    <p className="text-[11px] opacity-70 leading-relaxed font-bold">您可以將自訂巴士看板數據導出保存，便於同步至您的 iPad 或其他家人的裝置。</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={handleDownloadBackupFile} className="bg-[#e3342f] hover:bg-red-600 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1"><Download className="w-3.5 h-3.5" />下載備份檔 (.json)</button>
                      <button onClick={handleCopyBackupCode} className={`py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-colors ${theme.controlBtn}`}><Copy className="w-3.5 h-3.5" />複製設定代碼</button>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex flex-col gap-3">
                    <span className="text-xs font-black text-red-600 dark:text-red-400">📤 覆蓋還原自訂最愛</span>
                    <p className="text-[11px] opacity-70 leading-relaxed font-bold">上傳先前保存的備份檔案，或者直接在下方貼上備份 JSON 代碼。注意這將覆蓋現有看板最愛。</p>
                    <div className="border border-dashed border-gray-300 dark:border-gray-700 p-3 rounded-lg flex flex-col items-center justify-center gap-2 bg-white/50 dark:bg-black/20">
                      <input type="file" accept=".json" onChange={handleUploadFile} className="hidden" id="setting-backup-upload" />
                      <label htmlFor="setting-backup-upload" className="px-4 py-1.5 bg-[#e3342f] text-white hover:bg-red-600 rounded-lg text-xs font-bold cursor-pointer transition-colors">選擇上傳設定檔 (.json)</label>
                    </div>
                    <textarea rows={3} placeholder='或在此處貼上備份 JSON 代碼...' value={importText} onChange={(e) => setImportText(e.target.value)} className={`w-full py-1.5 px-3 rounded-lg border font-mono text-[10px] resize-none focus:outline-none focus:ring-1 focus:ring-red-500 ${theme.inputBg}`} />
                    <button onClick={handleConfirmImport} className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-extrabold text-xs flex items-center justify-center gap-1 shadow-sm transition-colors"><Check className="w-3.5 h-3.5" />確認匯入並覆蓋最愛</button>
                  </div>
                </div>
              )}

              {settingsTab === 'ADVANCED' && (
                <div className="flex flex-col gap-5">
                  <div className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex flex-col gap-3">
                    <span className="text-xs font-black flex items-center gap-1.5"><Sliders className="w-4 h-4 text-blue-500" />🛰️ 附近巴士站搜尋範圍設定</span>
                    <p className="text-[11px] opacity-70 leading-relaxed font-bold">微調 GPS 定位搜尋周圍巴士站點的最大允許半徑，目前半徑為：<strong className="text-blue-500 text-xs ml-1">{nearbyRadius} 米</strong></p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold opacity-50">300米</span>
                      <input type="range" min="300" max="2000" step="100" value={nearbyRadius} onChange={(e) => setNearbyRadius(parseInt(e.target.value))} className="flex-1 accent-[#e3342f] cursor-pointer" />
                      <span className="text-[10px] font-bold opacity-50">2000米</span>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex flex-col gap-3">
                    <span className="text-xs font-black text-red-600 dark:text-red-400 flex items-center gap-1.5"><RotateCcw className="w-4 h-4" />還原原廠預設值</span>
                    <p className="text-[11px] opacity-70 leading-relaxed font-bold">還原最愛看板設定回範例（預設峻巒總站、形點 II、大欖隧道配置），這將重置所有自訂設定。</p>
                    {!showResetConfirm ? (
                      <button onClick={() => setShowResetConfirm(true)} className="bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-bold text-xs transition-colors">重設我的最愛站點</button>
                    ) : (
                      <div className="flex gap-2 animate-pulse">
                        <button onClick={handleResetToPreload} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-black text-xs transition-colors">確定重設！(點擊執行)</button>
                        <button onClick={() => setShowResetConfirm(false)} className={`flex-1 py-2 rounded-lg font-bold text-xs transition-colors ${theme.controlBtn}`}>取消</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* 🔍 步驟式搜尋精靈 (WIZARD MODAL) */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border ${theme.modalBg}`}>
            <div className="px-5 py-4 border-b border-gray-500/10 flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-base flex items-center gap-2"><Plus className="w-5 h-5 text-red-500" />新增路線至看板</h3>
              <button onClick={handleCloseSearchModal} className="p-1 rounded-full hover:bg-gray-500/10"><X className="w-5 h-5" /></button>
            </div>
            <div className="bg-slate-500/5 px-5 py-2 flex items-center justify-between text-xs font-bold shrink-0 border-b border-gray-500/10">
              <span className={searchStep === 1 ? "text-red-500" : "opacity-60"}>1. 搜尋路線</span><ChevronRight className="w-3.5 h-3.5 opacity-40" />
              <span className={searchStep === 2 ? "text-red-500" : "opacity-60"}>2. 選方向</span><ChevronRight className="w-3.5 h-3.5 opacity-40" />
              <span className={searchStep === 3 ? "text-red-500" : "opacity-60"}>3. 挑中途站</span><ChevronRight className="w-3.5 h-3.5 opacity-40" />
              <span className={searchStep === 4 ? "text-red-500" : "opacity-60"}>4. 自訂確認</span>
            </div>
            <div className="flex-1 p-5 overflow-y-auto">
              
              {searchStep === 1 && (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black opacity-70">輸入巴士路線名稱搜尋 (支援九巴/城巴)：</label>
                    <div className="relative">
                      <input type="text" placeholder="例如: 264X, 68F, 968, 969..." value={routeQuery} onChange={(e) => setRouteQuery(e.target.value)} className={`w-full py-2 px-3 rounded-lg border font-bold text-sm focus:outline-none focus:ring-1 focus:ring-red-500 ${theme.inputBg}`} autoFocus />
                      {routeQuery && <button onClick={() => setRouteQuery('')} className="absolute right-3 top-2.5 text-xs opacity-50">清除</button>}
                    </div>
                  </div>
                  {loadingRoutes ? (
                    <div className="py-10 text-center text-sm font-bold opacity-70 flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4 animate-spin text-red-500" />正在同步全港九城巴路線庫...</div>
                  ) : filteredRoutesList.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      <span className="text-[11px] font-bold opacity-60">搜尋建議：</span>
                      <div className="grid grid-cols-2 gap-2 max-h-[250px] overflow-y-auto pr-1">
                        {filteredRoutesList.map((r, idx) => (
                          <button key={idx} onClick={() => handleSelectRoute(r)} className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all hover:scale-[1.02] ${theme.controlBtn}`}>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-lg font-black leading-none ${r.company === 'ctb' ? 'text-blue-600 dark:text-blue-400' : 'text-red-500'}`}>{r.route}</span>
                              <CompanyBadge company={r.company} className="h-3 object-contain" />
                            </div>
                            <span className="text-[10px] font-bold opacity-60 truncate">{r.orig_tc} ⇆ {r.dest_tc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : routeQuery ? (
                    <div className="py-8 text-center text-sm font-bold opacity-50">查無此路線，請重試</div>
                  ) : (
                    <div className="py-10 text-center text-xs font-bold opacity-40">請在上方輸入想搜尋的路線編號</div>
                  )}
                </div>
              )}

              {searchStep === 2 && selectedRoute && (
                <div className="flex flex-col gap-4">
                  <div className={`${selectedRoute.company === 'ctb' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-red-500/10 border-red-500/20'} p-3.5 rounded-xl border text-center flex flex-col items-center gap-1.5`}>
                    <span className={`text-3xl font-black block ${selectedRoute.company === 'ctb' ? 'text-blue-600 dark:text-blue-400' : 'text-red-500'}`}>{selectedRoute.route}</span>
                    <span className="text-xs font-bold opacity-70">請選擇方向：</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {routeDirections.map((dir, idx) => (
                      <button key={idx} onClick={() => handleSelectDirection(dir)} className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all hover:scale-[1.01] ${theme.controlBtn}`}>
                        <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                          <span className="text-xs font-bold opacity-50">方向 {dir.bound === 'I' ? '回程' : '去程'}</span>
                          <span className="font-extrabold text-sm truncate">往 {dir.dest_tc} (經 {dir.orig_tc})</span>
                        </div>
                        <ChevronRight className="w-5 h-5 opacity-60 shrink-0" />
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setSearchStep(1)} className="mt-2 text-xs font-bold text-center underline opacity-60">返回上一步</button>
                </div>
              )}

              {searchStep === 3 && selectedDirection && (
                <div className="flex flex-col gap-3">
                  <div className="bg-slate-500/10 p-3 rounded-xl text-center text-xs">設定 <strong className={selectedRoute.company === 'ctb' ? 'text-blue-600' : 'text-red-500'}>{selectedDirection.route}</strong> 往 <strong className={selectedRoute.company === 'ctb' ? 'text-blue-600' : 'text-red-500'}>{selectedDirection.dest_tc}</strong> 的站點</div>
                  {loadingStops ? (
                    <div className="py-12 text-center text-sm font-bold opacity-70 flex flex-col items-center justify-center gap-2"><RefreshCw className={`w-5 h-5 animate-spin ${selectedRoute.company === 'ctb' ? 'text-blue-500' : 'text-red-500'}`} /><span>正在獲取巴士站點資訊...</span></div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <span className="text-[11px] font-bold opacity-60">沿途巴士站：</span>
                      <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-1">
                        {routeStops.map((stop, idx) => (
                          <button key={idx} onClick={() => handleSelectStop(stop)} className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${theme.controlBtn}`}>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-black bg-slate-500/10 dark:bg-zinc-800 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-slate-800 dark:text-zinc-200">{idx + 1}</span>
                              <span className="text-sm font-bold truncate">{stop.name_tc}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 opacity-50 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <button onClick={() => setSearchStep(2)} className="mt-2 text-xs font-bold text-center underline opacity-60">返回上一步</button>
                </div>
              )}

              {searchStep === 4 && selectedStop && (
                <div className="flex flex-col gap-4">
                  <div className="bg-green-500/10 p-4 rounded-xl border border-green-500/20 text-center flex flex-col gap-1">
                    <span className="text-green-500 font-extrabold text-xs tracking-wider">確認設定</span>
                    <div className="flex items-center justify-center gap-2">
                      <span className={`text-lg font-black ${selectedRoute.company === 'ctb' ? 'text-blue-600 dark:text-blue-400' : 'text-red-500'}`}>{selectedDirection.route} 號巴士</span>
                      <CompanyBadge company={selectedRoute.company} className="h-4 object-contain" />
                    </div>
                    <span className="text-sm font-bold opacity-80">於「{selectedStop.name_tc}」上車</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black opacity-70">顯示巴士站名稱 (選填)：</label>
                    <input type="text" placeholder={selectedStop.name_tc} value={customStopName} onChange={(e) => setCustomStopName(e.target.value)} className={`w-full py-2 px-3 rounded-lg border font-bold text-sm focus:outline-none focus:ring-1 focus:ring-red-500 ${theme.inputBg}`} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black opacity-70">自訂顯示目的地 (解決循環線方向，選填)：</label>
                    <input type="text" placeholder={`${selectedDirection.dest_tc}`} value={customStopDesc} onChange={(e) => setCustomStopDesc(e.target.value)} className={`w-full py-2 px-3 rounded-lg border font-bold text-sm focus:outline-none focus:ring-1 focus:ring-red-500 ${theme.inputBg}`} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black opacity-70">放置於看板分類分組：</label>
                    <div className="grid grid-cols-2 gap-2">
                      <select value={customGroupName} onChange={(e) => setCustomGroupName(e.target.value)} className={`py-2 px-3 rounded-lg border font-bold text-sm outline-none ${theme.inputBg}`}>
                        <option value="預設">預設</option>
                        {Array.from(new Set(locations.map(loc => loc.groupName).filter(n => n && n !== '預設'))).map(group => <option key={group} value={group}>{group}</option>)}
                        <option value="NEW">+ 新增分組...</option>
                      </select>
                      {customGroupName === 'NEW' && <input type="text" placeholder="請輸入新分組名稱" value={customGroupInput} onChange={(e) => setCustomGroupInput(e.target.value)} className={`w-full py-2 px-3 rounded-lg border font-bold text-sm focus:outline-none focus:ring-1 focus:ring-red-500 ${theme.inputBg}`} />}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 shrink-0">
                    <button onClick={() => setSearchStep(3)} className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-colors ${theme.controlBtn}`}>返回上一步</button>
                    <button onClick={handleConfirmAddStop} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md"><Check className="w-4 h-4" />加入最愛</button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

