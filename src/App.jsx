import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  Bus, 
  RefreshCw, 
  Moon, 
  Sun, 
  MonitorSmartphone, 
  CloudSun, 
  Plus, 
  Trash2, 
  X, 
  ChevronRight, 
  Check, 
  Settings, 
  ChevronDown,
  Navigation,
  MapPin,
  Clock,
  Download,
  Copy,
  Sliders,
  RotateCcw,
  Image as ImageIcon,
  AlertTriangle
} from 'lucide-react';

// ==========================================
// 🚨 企業級防白屏防護罩 (Error Boundary)
// ==========================================
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, errorInfo: error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("App Crash:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 text-red-900 h-screen overflow-auto flex flex-col items-center justify-center">
          <span className="text-6xl mb-4">⚠️</span>
          <h1 className="text-2xl font-black mb-2">系統發生錯誤 (App Crash)</h1>
          <p className="font-bold text-sm mb-4 text-center opacity-80">請將下方的錯誤訊息截圖，這能幫助我們立刻找出環境的衝突點：</p>
          <div className="bg-white p-4 rounded-xl border border-red-200 font-mono text-xs overflow-x-auto w-full max-w-2xl shadow-inner text-red-600">
            {this.state.errorInfo && this.state.errorInfo.toString()}
          </div>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }} 
            className="mt-8 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold shadow-md transition-all"
          >
            清除所有快取並重新啟動
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==========================================
// 💡 全域安全函數區
// ==========================================
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; 
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c); 
};

const formatChineseDate = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const weekday = weekdays[date.getDay()];
  return `${year}年${month}月${day}日 ${weekday}`;
};

const getEtaMinutes = (etaDate, nowObj) => {
  if (!etaDate || !nowObj) return null;
  return Math.floor((new Date(etaDate) - nowObj) / 60000);
};

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ==========================================
// 💡 HKO 本地化圖標引擎 (完美對接您的資料夾)
// ==========================================
const HKO_WARNING_BASE = '/icons/hko/warnings/';
const HKO_WEATHER_BASE = '/icons/hko/weather/';

const makeHkoWarningIcon = (fileName) => ({
  img: `${HKO_WARNING_BASE}${fileName}`,
});

const getWeatherIconPath = (icon) => `${HKO_WEATHER_BASE}pic${icon}.png`;

const getWarningData = (code, originalName) => {
  switch(code) {
    case 'WRAINA': return { text: '黃色暴雨警告信號', ...makeHkoWarningIcon('raina.gif'), style: 'bg-[#eab308] text-white shadow-sm' };
    case 'WRAINR': return { text: '紅色暴雨警告信號', ...makeHkoWarningIcon('rainr.gif'), style: 'bg-[#cf4747] text-white shadow-sm' };
    case 'WRAINB': return { text: '黑色暴雨警告信號', ...makeHkoWarningIcon('rainb.gif'), style: 'bg-black text-white shadow-sm border border-gray-600' };
    case 'WTS': return { text: '雷暴警告', ...makeHkoWarningIcon('ts.gif'), style: 'bg-[#eab308] text-white shadow-sm' };
    case 'WHOT': return { text: '酷熱天氣警告', ...makeHkoWarningIcon('vhot.gif'), style: 'bg-[#cf4747] text-white shadow-sm' };
    case 'WCOLD': return { text: '寒冷天氣警告', ...makeHkoWarningIcon('cold.gif'), style: 'bg-[#3b82f6] text-white shadow-sm' };
    case 'WFIREY': return { text: '黃色火災危險警告', ...makeHkoWarningIcon('firey.gif'), style: 'bg-[#eab308] text-white shadow-sm' };
    case 'WFIRER': return { text: '紅色火災危險警告', ...makeHkoWarningIcon('firer.gif'), style: 'bg-[#cf4747] text-white shadow-sm' };
    case 'TC1': return { text: '一號戒備信號', ...makeHkoWarningIcon('tc1.gif'), style: 'bg-white text-slate-800 shadow-sm border border-gray-200' };
    case 'TC3': return { text: '三號強風信號', ...makeHkoWarningIcon('tc3.gif'), style: 'bg-white text-slate-800 shadow-sm border border-gray-200' };
    case 'TC8NE': return { text: '八號東北烈風或暴風信號', ...makeHkoWarningIcon('tc8ne.gif'), style: 'bg-white text-slate-800 shadow-sm border border-gray-200' };
    case 'TC8NW': return { text: '八號西北烈風或暴風信號', ...makeHkoWarningIcon('tc8nw.gif'), style: 'bg-white text-slate-800 shadow-sm border border-gray-200' };
    case 'TC8SE': return { text: '八號東南烈風或暴風信號', ...makeHkoWarningIcon('tc8se.gif'), style: 'bg-white text-slate-800 shadow-sm border border-gray-200' };
    case 'TC8SW': return { text: '八號西南烈風或暴風信號', ...makeHkoWarningIcon('tc8sw.gif'), style: 'bg-white text-slate-800 shadow-sm border border-gray-200' };
    case 'TC9': return { text: '九號烈風或暴風風力增強信號', ...makeHkoWarningIcon('tc9.gif'), style: 'bg-white text-slate-800 shadow-sm border border-gray-200' };
    case 'TC10': return { text: '十號颶風信號', ...makeHkoWarningIcon('tc10.gif'), style: 'bg-white text-slate-800 shadow-sm border border-gray-200' };
    
    // 💡 就是這裡！之前漏了 WMSL 這個 API 代碼，導致 img 變成 null 而沒有產生 <img /> 標籤。已修復！
    case 'WMSL':
    case 'WMS': 
    case 'SMS': return { text: '強烈季候風信號', ...makeHkoWarningIcon('sms.gif'), style: 'bg-slate-800 text-white shadow-sm border border-slate-700' };
    
    case 'WL': return { text: '山泥傾瀉警告', ...makeHkoWarningIcon('landslip.gif'), style: 'bg-yellow-600 text-white shadow-sm border border-yellow-700' };
    case 'FNTSA': return { text: '新界北部水浸特別報告', ...makeHkoWarningIcon('ntfl.gif'), style: 'bg-white text-slate-800 shadow-sm border border-gray-200' };
    case 'WFROST':
    case 'FROST': return { text: '霜凍警告', ...makeHkoWarningIcon('frost.gif'), style: 'bg-white text-slate-800 shadow-sm border border-gray-200' };
    default:
      if (!originalName || originalName.trim() === '') return null;
      return { text: originalName, img: null, style: 'bg-slate-800 text-white shadow-md' };
  }
};

const DEFAULT_PHOTOS = ["/photo01.jpg", "/photo02.jpg", "/photo03.jpg"];
const WEATHER_BG = "/victoria-harbour.jpg";

// 🔗 您的專屬 CSDI 路線庫網址
const MY_GITHUB_CSDI_URL = "https://example-placeholder.github.io/routes";

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
    routes: [{ company: "kmb", route: "68", dir: "I", dest: "峻巒", serviceType: "1", customDest: "峻巒" }]
  },
  {
    id: "7917E395940F86AF",
    filterId: "YOHO",
    groupName: "形點",
    name: "形點 I",
    desc: "往峻巒",
    routes: [{ company: "kmb", route: "68F", dir: "I", dest: "峻巒", serviceType: "1", customDest: "峻巒" }]
  }
];

const WarningBadge = ({ img, text, iconBg = "bg-transparent", className = "w-4 h-4 object-contain" }) => {
  if (!img) return null; 
  return (
    <div className={`${iconBg} shrink-0 flex items-center justify-center p-0.5`}>
      <img src={img} alt={text} title={text} className={className} referrerPolicy="no-referrer" />
    </div>
  );
};

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

// ==========================================
// 🚌 核心主程式 (Main App)
// ==========================================
function MainApp() {
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

  const [trajectoryMode, setTrajectoryMode] = useState(() => {
    try { return localStorage.getItem('kmb_trajectory') || 'CSDI'; } catch { return 'CSDI'; }
  });

  const [weatherInfo, setWeatherInfo] = useState({ temp: '--', icon: null, warnings: [] });

  const activeTCWarning = useMemo(() => {
    if (!weatherInfo.warnings) return null;
    const tcWarning = weatherInfo.warnings.find(w => w.code && w.code.startsWith('TC'));
    if (tcWarning) return getWarningData(tcWarning.code, tcWarning.name);
    return null;
  }, [weatherInfo.warnings]);

  const validWarnings = useMemo(() => {
    return (weatherInfo.warnings || [])
      .map(warn => getWarningData(warn.code, warn.name))
      .filter(wData => wData !== null); 
  }, [weatherInfo.warnings]);

  useEffect(() => {
    document.title = "實時巴士報站";
  }, []);

  useEffect(() => {
    let meta = document.querySelector('meta[name="color-scheme"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = "color-scheme";
      document.head.appendChild(meta);
    }
    meta.content = "light dark"; 
    
    if (isDarkMode) {
      document.documentElement.style.backgroundColor = '#09090b'; 
      document.documentElement.classList.add('kmb-dark');
    } else {
      document.documentElement.style.backgroundColor = '#f8fafc'; 
      document.documentElement.classList.remove('kmb-dark');
    }
  }, [isDarkMode]);

  const theme = useMemo(() => ({
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
    modalBg: isDarkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-slate-100 text-slate-800',
    inputBg: isDarkMode ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-slate-100 border-slate-200 text-slate-800',
    controlBtn: isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-800',
  }), [isDarkMode]);

  const [mapState, setMapState] = useState({ 
    isOpen: false, 
    loadingStops: false,
    stop: null, 
    routeInfo: null, 
    routeStops: [], 
    error: null 
  });
  
  const [mapEngineState, setMapEngineState] = useState({
    loadingMap: false,
    fetched: false,
    snappedCoords: []
  });
  
  const [mapGpsState, setMapGpsState] = useState('idle'); 

  const [mapStopEtas, setMapStopEtas] = useState([]);
  const [loadingMapEtas, setLoadingMapEtas] = useState(false);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  useEffect(() => {
    if (window.L) { setLeafletLoaded(true); return; }
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css'; link.rel = 'stylesheet';
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
    return () => { try { document.head.removeChild(meta); } catch(e) {} };
  }, []);

  useEffect(() => { try { localStorage.setItem('kmb_custom_locations', JSON.stringify(locations)); } catch {} }, [locations]);
  useEffect(() => { try { localStorage.setItem('kmb_theme', JSON.stringify(isDarkMode)); } catch {} }, [isDarkMode]);
  useEffect(() => { try { localStorage.setItem('kmb_stand_mode', JSON.stringify(isStandMode)); } catch {} }, [isStandMode]);
  useEffect(() => { try { localStorage.setItem('kmb_left_mode', leftPanelMode); } catch {} }, [leftPanelMode]);
  useEffect(() => { try { localStorage.setItem('kmb_nearby_radius', nearbyRadius.toString()); } catch {} }, [nearbyRadius]);
  useEffect(() => { if (standMonitorId) try { localStorage.setItem('kmb_stand_monitor_id', standMonitorId); } catch {} }, [standMonitorId]);
  useEffect(() => { try { localStorage.setItem('kmb_trajectory', trajectoryMode); } catch {} }, [trajectoryMode]);

  const availableGroups = useMemo(() => {
    const groupsSet = new Set((locations || []).map(loc => loc.groupName || '預設'));
    return ['ALL', 'NEARBY', ...Array.from(groupsSet)]; 
  }, [locations]);

  const groupedFavoritesData = useMemo(() => {
    const groups = {};
    (locationsData || []).forEach(loc => {
      const gName = loc.groupName || '預設';
      if (!groups[gName]) groups[gName] = { groupName: gName, routesData: [] };
      const routesWithStopMeta = (loc.routesData || []).map(r => ({ ...r, stopName: loc.name, stopId: loc.id }));
      groups[gName].routesData.push(...routesWithStopMeta);
    });
    return Object.values(groups).map(g => {
      g.routesData.sort((a, b) => a.route.localeCompare(b.route, undefined, { numeric: true }));
      return g;
    });
  }, [locationsData]);

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

  const getOrFetchAllKmbStops = async () => {
    try {
      const cached = localStorage.getItem('kmb_all_stops_cache_v45');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.timestamp && Date.now() - parsed.timestamp < 7 * 24 * 60 * 60 * 1000) return parsed.stops;
      }
    } catch {}

    try {
      const res = await fetch('https://data.etabus.gov.hk/v1/transport/kmb/stop');
      if (res.ok) {
        const d = await res.json();
        const miniStops = (d.data || []).map(s => ({
          id: s.stop, name: s.name_tc, lat: parseFloat(s.lat), lng: parseFloat(s.long)
        })).filter(s => !isNaN(s.lat) && !isNaN(s.lng));
        try { localStorage.setItem('kmb_all_stops_cache_v45', JSON.stringify({ timestamp: Date.now(), stops: miniStops })); } catch (e) {}
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
      
      const allStops = await getOrFetchAllKmbStops();
      if (!allStops || allStops.length === 0) throw new Error('無法取得巴士地圖資料庫');
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
    if (!nearbyStops || nearbyStops.length === 0) return;
    try {
      const stopPromises = nearbyStops.map(stop => fetch(`https://data.etabus.gov.hk/v1/transport/kmb/stop-eta/${stop.id}`).then(res => res.ok ? res.json() : { data: [] }).catch(() => ({ data: [] })));
      const results = await Promise.all(stopPromises);
      const currentMins = Math.floor(Date.now() / 60000);

      const processed = nearbyStops.map((stop, idx) => {
        const rawEtas = results[idx].data || [];
        const routeGroups = {};
        rawEtas.forEach(eta => {
          if (!eta.eta || !eta.route) return;
          const sType = String(eta.service_type || '1');
          const key = `${eta.route}-${eta.dir}-${sType}-${eta.dest_tc}`;
          if (!routeGroups[key]) {
            routeGroups[key] = { company: 'kmb', route: eta.route, dest: eta.dest_tc.includes('荃灣西') ? '荃灣西站' : eta.dest_tc, dir: eta.dir, serviceType: sType, etas: [] };
          }
          routeGroups[key].etas.push(eta);
        });
        const routesDataList = Object.values(routeGroups).map(group => {
          group.etas.sort((a, b) => new Date(a.eta) - new Date(b.eta));
          const uniqueEtas = [];
          const seenKeys = new Set();
          group.etas.forEach(e => {
            const minuteKey = Math.floor(new Date(e.eta).getTime() / 60000);
            const rmkKey = e.rmk_tc || '';
            const key = `${minuteKey}-${rmkKey}`; 
            if (!seenKeys.has(key) && (minuteKey - currentMins) >= -1) {
              seenKeys.add(key);
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
        
        if ((loc.routes || []).some(r => !r.company || r.company === 'kmb')) {
          try {
            const res = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/stop-eta/${loc.id}`);
            if (res.ok) { const d = await res.json(); if (Array.isArray(d.data)) allEtas.push(...d.data); }
          } catch(e) {}
        }
        
        const ctbRoutes = (loc.routes || []).filter(r => r.company === 'ctb');
        if (ctbRoutes.length > 0) {
          await Promise.all(ctbRoutes.map(async r => {
            try {
              const res = await fetch(`https://rt.data.gov.hk/v1.1/transport/citybus-nwfb/eta/CTB/${loc.id}/${r.route}`);
              if (res.ok) { const d = await res.json(); if (Array.isArray(d.data)) allEtas.push(...d.data); }
            } catch(e) {}
          }));
        }

        const routesList = [];
        (loc.routes || []).forEach(routeObj => {
          const comp = routeObj.company || 'kmb';
          const validEtas = allEtas.filter(eta => 
            eta.route === routeObj.route && 
            eta.eta && 
            (routeObj.dir ? eta.dir === routeObj.dir : true) &&
            (String(eta.service_type || '1') === String(routeObj.serviceType || '1'))
          );
          
          if (validEtas.length > 0) {
            validEtas.sort((a, b) => new Date(a.eta) - new Date(b.eta));
            const uniqueEtas = [];
            const seenKeys = new Set();
            validEtas.forEach(e => {
              const minuteKey = Math.floor(new Date(e.eta).getTime() / 60000);
              const rmkKey = e.rmk_tc || '';
              const key = `${minuteKey}-${rmkKey}`; 
              if (!seenKeys.has(key) && (minuteKey - currentMins) >= -1) {
                seenKeys.add(key);
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

  const filteredRoutesList = useMemo(() => {
    if (!routeQuery || !Array.isArray(allRoutesList)) return [];
    const q = routeQuery.toUpperCase().trim();
    const uniqueRoutes = [];
    const seen = new Set();
    allRoutesList
      .filter(r => r && r.route && r.route.toUpperCase().includes(q))
      .forEach(r => {
        const key = `${r.company}-${r.route}`;
        if (!seen.has(key)) { seen.add(key); uniqueRoutes.push(r); }
      });
    return uniqueRoutes.sort((a, b) => {
      if (a.route === q) return -1;
      if (b.route === q) return 1;
      return a.route.localeCompare(b.route, undefined, { numeric: true });
    }).slice(0, 15); 
  }, [allRoutesList, routeQuery]);

  const handleDeleteLocation = (locId, e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setLocations((locations || []).filter(loc => loc.id !== locId));
    setLocationsData(prev => prev.filter(loc => loc.id !== locId));
  };

  const handleDeleteRouteInLocation = (locId, routeNum, dir, serviceType, e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setLocations((locations || []).map(loc => {
      if (loc.id === locId) return { 
        ...loc, 
        routes: (loc.routes || []).filter(r => !(r.route === routeNum && r.dir === dir && String(r.serviceType || '1') === String(serviceType || '1'))) 
      };
      return loc;
    }).filter(loc => loc.routes && loc.routes.length > 0));
    setLocationsData(prev => prev.map(loc => {
      if (loc.id === locId) return { 
        ...loc, 
        routesData: (loc.routesData || []).filter(r => !(r.route === routeNum && r.dir === dir && String(r.serviceType || '1') === String(serviceType || '1'))) 
      };
      return loc;
    }).filter(loc => loc.routesData && loc.routesData.length > 0));
  };

  const handleUpdateCustomDest = (locId, routeNum, dir, serviceType, newDest) => {
    setLocations((prev || []).map(loc => {
      if (loc.id === locId) {
        return {
          ...loc,
          routes: (loc.routes || []).map(r => {
            if (r.route === routeNum && r.dir === dir && String(r.serviceType || '1') === String(serviceType || '1')) {
              return { ...r, customDest: newDest };
            }
            return r;
          })
        };
      }
      return loc;
    }));
  };

  const fetchStopDetailsInBatch = async (stopIds, company = 'kmb') => {
    let cache = {};
    const cacheKey = `kmb_stop_details_cache_v45_${company}`;
    
    if (company === 'kmb') {
        const allKmbStops = await getOrFetchAllKmbStops();
        (allKmbStops || []).forEach(s => {
           if (s.lat && s.lng) cache[s.id] = s;
        });
        return cache;
    }

    try { 
      const localCache = JSON.parse(localStorage.getItem(cacheKey) || '{}'); 
      cache = { ...localCache, ...cache };
    } catch {}

    const missingIds = stopIds.filter(id => !cache[id] || !cache[id].lat);
    
    if (missingIds.length > 0) {
      const fetchSingle = async (id) => {
        try { 
          const url = `https://rt.data.gov.hk/v1.1/transport/citybus-nwfb/stop/${id}`;
          const res = await fetch(url); 
          if (res.ok) { 
            const d = await res.json(); 
            if (d.data?.lat) {
               return { id, name: d.data?.name_tc || id, lat: parseFloat(d.data?.lat), lng: parseFloat(d.data?.long || d.data?.lng) }; 
            }
          } 
        } catch {}
        return { id, name: id, lat: null, lng: null };
      };

      const chunkSize = 5; 
      for (let i = 0; i < missingIds.length; i += chunkSize) {
        const results = await Promise.all(missingIds.slice(i, i + chunkSize).map(fetchSingle));
        results.forEach(r => { if(r.lat) cache[r.id] = r; });
      }
      try { localStorage.setItem(cacheKey, JSON.stringify(cache)); } catch {}
    }
    return cache;
  };

  const listRef = useRef(null);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylineBorderRef = useRef(null);
  const polylineRef = useRef(null);
  const markerRef = useRef(null);
  const stopsLayerRef = useRef(null);
  const arrowsLayerRef = useRef(null);
  const userMarkerRef = useRef(null); 

  const handleOpenMap = async (initialStopId, stopName, company, routeNum, dir, dest, serviceType = '1') => {
    if (!initialStopId || !routeNum) return;
    
    setMapState({ 
      isOpen: true, 
      loadingStops: true, 
      stop: { id: initialStopId, name: stopName }, 
      routeInfo: { company, route: routeNum, dir, dest, serviceType },
      routeStops: [], 
      error: null 
    });
    setMapEngineState({ loadingMap: true, fetched: false, snappedCoords: [] });
    
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
          routeStops: processedStops,
          stop: targetStop,
          error: null
        }));
        
        setTimeout(() => {
          const activeStopEl = document.getElementById(`modal-stop-${initialStopId}`);
          if (activeStopEl && listRef.current) {
            activeStopEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 300);
      } else {
         setMapState(prev => ({ ...prev, loadingStops: false, error: '無法獲取此路線的詳細資料' }));
         setMapEngineState(prev => ({ ...prev, loadingMap: false }));
      }
    } catch (err) {
      setMapState(prev => ({ ...prev, loadingStops: false, error: '網絡連線異常，無法載入路線資料' }));
      setMapEngineState(prev => ({ ...prev, loadingMap: false }));
    }
  };

  useEffect(() => {
    if (!mapState.isOpen || !mapState.stop?.id || !mapState.routeInfo) return;
    let isMounted = true;
    
    const fetchMapStopETA = async () => {
       setLoadingMapEtas(true);
       try {
          const { company, route, dir, serviceType } = mapState.routeInfo;
          let url = company === 'ctb' 
             ? `https://rt.data.gov.hk/v1.1/transport/citybus-nwfb/eta/CTB/${mapState.stop.id}/${route}`
             : `https://data.etabus.gov.hk/v1/transport/kmb/stop-eta/${mapState.stop.id}`;
             
          const res = await fetch(url);
          const d = await res.json();
          if (!isMounted) return;

          const currentMins = Math.floor(Date.now() / 60000);
          if (d && Array.isArray(d.data)) {
             let validEtas = d.data.filter(e => e.route === route && e.dir === dir && e.eta && String(e.service_type || '1') === String(serviceType || '1'));
             validEtas.sort((a,b) => new Date(a.eta) - new Date(b.eta));
             const uniqueEtas = [];
             const seenKeys = new Set();
             
             validEtas.forEach(e => {
                const m = Math.floor(new Date(e.eta).getTime() / 60000);
                const rmkKey = e.rmk_tc || '';
                const key = `${m}-${rmkKey}`; 
                if (!seenKeys.has(key) && (m - currentMins) >= -1) {
                   seenKeys.add(key);
                   uniqueEtas.push(e);
                }
             });
             setMapStopEtas(uniqueEtas.slice(0, 3)); 
          } else {
             setMapStopEtas([]);
          }
       } catch(e) {
          if (isMounted) setMapStopEtas([]);
       } finally {
          if (isMounted) setLoadingMapEtas(false);
       }
    };
    
    fetchMapStopETA();
    const timer = setInterval(fetchMapStopETA, 30000);
    return () => { isMounted = false; clearInterval(timer); };
  }, [mapState.isOpen, mapState.stop?.id, mapState.routeInfo]);

  useEffect(() => {
    if (!mapState.isOpen || mapState.loadingStops || mapState.routeStops.length === 0 || mapEngineState.fetched) return;
    
    let isMounted = true;
    const fetchTrajectory = async () => {
        const validStops = mapState.routeStops.filter(s => s.lat && s.lng && !isNaN(s.lat) && !isNaN(s.lng));
        const stopLatLngs = validStops.map(s => [s.lat, s.lng]);
        
        if (stopLatLngs.length < 2 || trajectoryMode === 'STRAIGHT') {
            if(isMounted) setMapEngineState({ loadingMap: false, fetched: true, snappedCoords: stopLatLngs });
            return;
        }

        let allSnappedCoords = null;

        try {
            const compStr = mapState.routeInfo.company.toUpperCase();
            const routeStr = mapState.routeInfo.route.toUpperCase();
            let dirStr = mapState.routeInfo.dir || 'O';
            if (dirStr === 'outbound') dirStr = 'O';
            else if (dirStr === 'inbound') dirStr = 'I';

            const defaultHkbusUrl = `https://hkbus.github.io/hkbus-route-waypoints/waypoints/${compStr}+${routeStr}-${dirStr}.json`;
            const res = await fetch(defaultHkbusUrl); 

            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    allSnappedCoords = data.map(p => (p[0] > 90 ? [p[1], p[0]] : [p[0], p[1]]));
                }
            }
        } catch (e) {
            console.log("Failed to fetch CSDI Data");
        }

        if (!allSnappedCoords) {
            let skeletonStops = [validStops[0]];
            let lastSkStop = validStops[0];
            for (let i = 1; i < validStops.length - 1; i++) {
                const dist = calculateDistance(lastSkStop.lat, lastSkStop.lng, validStops[i].lat, validStops[i].lng);
                if (dist > 600) {
                    skeletonStops.push(validStops[i]);
                    lastSkStop = validStops[i];
                }
            }
            skeletonStops.push(validStops[validStops.length - 1]);

            const coordsStr = skeletonStops.map(s => `${s.lng},${s.lat}`).join(';');
            const radiusesStr = skeletonStops.map(() => '150').join(';');
            const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson&continue_straight=true&radiuses=${radiusesStr}`;

            try {
                const res = await fetch(osrmUrl);
                if (res.ok) {
                    const data = await res.json();
                    if (data.code === 'Ok' && data.routes && data.routes[0]) {
                        allSnappedCoords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
                    } else {
                        allSnappedCoords = stopLatLngs;
                    }
                } else {
                    allSnappedCoords = stopLatLngs;
                }
            } catch (e) {
                allSnappedCoords = stopLatLngs;
            }
        }

        if (isMounted) {
            setMapEngineState({ loadingMap: false, fetched: true, snappedCoords: allSnappedCoords || stopLatLngs });
        }
    };

    fetchTrajectory();
    return () => { isMounted = false; };
  }, [mapState.isOpen, mapState.loadingStops, mapState.routeStops, mapEngineState.fetched, trajectoryMode]);

  useEffect(() => {
    if (!leafletLoaded || !mapContainerRef.current || !mapState.isOpen || !mapEngineState.fetched) return;

    try {
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = window.L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false });
        window.L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', { maxZoom: 19 }).addTo(mapInstanceRef.current);
      }

      const map = mapInstanceRef.current;
      const isCTB = mapState.routeInfo?.company === 'ctb';
      
      const coreColor = isCTB ? '#3b82f6' : '#ef4444';       
      const borderColor = isCTB ? '#1e3a8a' : '#991b1b';     

      const renderVisuals = () => {
          if (polylineRef.current) map.removeLayer(polylineRef.current);
          if (polylineBorderRef.current) map.removeLayer(polylineBorderRef.current);
          if (stopsLayerRef.current) map.removeLayer(stopsLayerRef.current);
          if (arrowsLayerRef.current) map.removeLayer(arrowsLayerRef.current);

          stopsLayerRef.current = window.L.layerGroup().addTo(map);
          arrowsLayerRef.current = window.L.layerGroup().addTo(map);

          const validStops = mapState.routeStops.filter(s => s.lat && s.lng && !isNaN(s.lat) && !isNaN(s.lng));
          const busStopHtml = `
             <div style="background-color: white; border: 2.5px solid #9ca3af; border-radius: 50%; width: 12px; height: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.3);">
             </div>`;
          const busStopIcon = window.L.divIcon({ className: '', html: busStopHtml, iconSize: [12, 12], iconAnchor: [6, 6] });

          validStops.forEach(s => {
             window.L.marker([s.lat, s.lng], { icon: busStopIcon }).addTo(stopsLayerRef.current);
          });

          const coordsToDraw = mapEngineState.snappedCoords.length > 0 ? mapEngineState.snappedCoords : validStops.map(s => [s.lat, s.lng]);

          if (coordsToDraw.length > 1) {
              polylineBorderRef.current = window.L.polyline(coordsToDraw, { 
                  color: borderColor, weight: 8, opacity: 0.9, lineJoin: 'round', lineCap: 'round'
              }).addTo(map);
              
              polylineRef.current = window.L.polyline(coordsToDraw, { 
                  color: coreColor, weight: 4, opacity: 1, lineJoin: 'round', lineCap: 'round'
              }).addTo(map);

              map.fitBounds(polylineBorderRef.current.getBounds(), { padding: [40, 40], maxZoom: 16 });
          }

          let accDist = 0;
          const ARROW_INTERVAL = 600; 
          for (let i = 0; i < coordsToDraw.length - 1; i++) {
              const p1 = coordsToDraw[i];
              const p2 = coordsToDraw[i+1];
              if (!p1 || !p2) continue;
              
              const dist = calculateDistance(p1[0], p1[1], p2[0], p2[1]);
              accDist += dist;

              if (accDist > ARROW_INTERVAL) {
                  const dy = p2[0] - p1[0];
                  const dx = Math.cos(Math.PI / 180 * p1[0]) * (p2[1] - p1[1]);
                  const heading = 90 - (Math.atan2(dy, dx) * 180 / Math.PI);
                  
                  if (!isNaN(heading)) {
                      const arrowIcon = window.L.divIcon({
                          className: 'route-arrow',
                          html: `<div style="transform: rotate(${heading}deg); width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; z-index: 50;">
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
                                       <path d="M12 2L22 20L12 16L2 20Z" />
                                    </svg>
                                 </div>`,
                          iconSize: [14, 14], iconAnchor: [7, 7]
                      });
                      window.L.marker(p2, {icon: arrowIcon, interactive: false}).addTo(arrowsLayerRef.current);
                  }
                  accDist = 0;
              }
          }
      };

      const size = map.getSize();
      if (size.x === 0 || size.y === 0) {
          setTimeout(() => { if (mapInstanceRef.current) { mapInstanceRef.current.invalidateSize(); renderVisuals(); } }, 300);
      } else {
          renderVisuals();
      }

    } catch(err) {
      console.error("Map Render Error:", err);
    }
  }, [leafletLoaded, mapState.isOpen, mapEngineState.fetched, mapEngineState.snappedCoords]);

  const updateUserMarker = useCallback((lat, lng, map) => {
    if (!userMarkerRef.current) {
      const blueDotHtml = `
        <div style="display: flex; justify-content: center; align-items: center; width: 24px; height: 24px; position: relative;">
          <div class="gps-pulse-ring"></div>
          <div class="gps-blue-dot"></div>
        </div>
      `;
      const blueDotIcon = window.L.divIcon({
        className: 'user-gps-icon',
        html: blueDotHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });
      userMarkerRef.current = window.L.marker([lat, lng], { icon: blueDotIcon, zIndexOffset: 2500 }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng([lat, lng]);
    }
  }, []);

  useEffect(() => {
    if (!leafletLoaded || !mapState.isOpen || !mapInstanceRef.current) return;
    let watchId;
    const map = mapInstanceRef.current;
    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          updateUserMarker(latitude, longitude, map);
        },
        (err) => console.warn("背景追蹤定位失敗:", err),
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
      );
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [leafletLoaded, mapState.isOpen, updateUserMarker]);

  const handleLocateUser = (e) => {
    e.stopPropagation();
    if (!mapInstanceRef.current) return;
    if (!("geolocation" in navigator)) {
      setMapGpsState('error');
      setTimeout(() => setMapGpsState('idle'), 3000);
      return;
    }
    setMapGpsState('locating');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const map = mapInstanceRef.current;
        updateUserMarker(latitude, longitude, map);
        map.flyTo([latitude, longitude], 17, { animate: true });
        setMapGpsState('success');
        setTimeout(() => setMapGpsState('idle'), 2000);
      },
      (err) => {
        console.warn("主দ্দিন
