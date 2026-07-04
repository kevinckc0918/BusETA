import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  RotateCcw
} from 'lucide-react';

// ==========================================
// 🖼️ 預設高畫質幻燈片 (已修改為本地路徑)
// ==========================================
const DEFAULT_PHOTOS = [
  "/photo01.jpg",
  "/photo02.jpg",
  "/photo03.jpg"
];

const WEATHER_BG = "/victoria-harbour.jpg";

// ==========================================
// 🚌 預設預載的自訂巴士站數據 (使用者自訂的最愛)
// ==========================================
const DEFAULT_LOCATIONS = [
  {
    id: "67D38E584B919815",
    filterId: "PARKYOHO",
    groupName: "峻巒",
    name: "峻巒總站",
    desc: "往市區",
    routes: [
      { route: "68", dir: "O", dest: "元朗公園", serviceType: "1" },
      { route: "68F", dir: "O", dest: "元朗公園", serviceType: "1" },
      { route: "268M", dir: "O", dest: "荃灣西站", serviceType: "1" }
    ]
  },
  {
    id: "0C943B7308FF4DCC",
    filterId: "YOHO",
    groupName: "形點",
    name: "形點 II",
    desc: "往峻巒",
    routes: [
      { route: "68", dir: "I", dest: "峻巒", serviceType: "1" }
    ]
  },
  {
    id: "7917E395940F86AF",
    filterId: "YOHO",
    groupName: "形點",
    name: "形點 I",
    desc: "往峻巒",
    routes: [
      { route: "68F", dir: "I", dest: "峻巒", serviceType: "1" }
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

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
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

// 🌩️ 天氣警告代碼對應顏色樣式
const getWarningStyle = (code) => {
  switch(code) {
    case 'WRAINA': return 'bg-yellow-400 text-yellow-950 border border-yellow-500'; 
    case 'WRAINR': return 'bg-red-600 text-white'; 
    case 'WRAINB': return 'bg-black text-white border-2 border-gray-400'; 
    case 'WTS': return 'bg-yellow-600 text-yellow-950'; 
    case 'WHOT': return 'bg-red-500 text-white'; 
    case 'WCOLD': return 'bg-blue-400 text-blue-950'; 
    case 'TC1': case 'TC3': case 'TC8NE': case 'TC8NW': case 'TC8SE': case 'TC8SW': case 'TC9': case 'TC10':
      return 'bg-zinc-800 text-white'; 
    case 'WFIREY': return 'bg-yellow-500 text-yellow-950';
    case 'WFIRER': return 'bg-red-500 text-white';
    default: return 'bg-white/20 text-white backdrop-blur-md';
  }
};

export default function App() {
  // === 基礎狀態管理 ===
  const [loading, setLoading] = useState(true);
  const [locationsData, setLocationsData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  
  // 💡 預設分頁改回 'NEARBY'，讓附近變成打開首選
  const [activeTab, setActiveTab] = useState('NEARBY'); 
  const [photoIndex, setPhotoIndex] = useState(0);
  const [now, setNow] = useState(new Date());

  // === 個性化設定 ===
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kmb_theme') || 'false'); } catch { return false; }
  });

  // === 🎨 核心主題配色 (脫離 Tailwind dark: 依賴，解決 iOS 深色模式衝突) ===
  const theme = {
    appBg: isDarkMode ? 'bg-zinc-950 text-white' : 'bg-slate-50 text-slate-900',
    topBar: isDarkMode ? 'bg-red-950 border-red-900/50' : 'bg-[#e3342f] border-red-700',
    bottomBar: isDarkMode ? 'bg-red-950/95' : 'bg-[#e3342f]',
    pillBg: isDarkMode ? 'bg-red-900 text-white' : 'bg-[#e3342f] text-white',
    rowEven: isDarkMode ? 'bg-zinc-900/60' : 'bg-white',
    rowOdd: isDarkMode ? 'bg-red-950/20' : 'bg-[#fae0e5]', // 淺色模式加深粉紅斑馬紋
    routeNum: isDarkMode ? 'text-zinc-100' : 'text-slate-900',
    routeDest: isDarkMode ? 'text-zinc-400' : 'text-slate-600',
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

  // === ⚙️ 時間計算 Helper ===
  const getEtaMinutes = (etaDate) => Math.floor((etaDate - now) / 60000);

  // === 🛰️ GPS 定位與附近巴士站專用狀態 ===
  const [gpsLoading, setGpsLoading] = useState(false);
  const [userCoords, setUserCoords] = useState(null); 
  const [nearbyStops, setNearbyStops] = useState([]); 
  const [nearbyStopsData, setNearbyStopsData] = useState([]); 
  const [gpsMessage, setGpsMessage] = useState('');

  // === 用家自訂巴士站數據 ===
  const [locations, setLocations] = useState(() => {
    try {
      const saved = localStorage.getItem('kmb_custom_locations');
      return saved ? JSON.parse(saved) : DEFAULT_LOCATIONS;
    } catch {
      return DEFAULT_LOCATIONS;
    }
  });

  // === 🛠️ 全新「設定中心」專用狀態 ===
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

  // === 天氣數據 ===
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
    try { return localStorage.getItem('kmb_stand_monitor_id') || 'NEARBY_STOPS'; } 
    catch { return 'NEARBY_STOPS'; }
  });

  // === 搜尋彈窗狀態 ===
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchStep, setSearchStep] = useState(1); 
  const [allKmbRoutes, setAllKmbRoutes] = useState([]); 
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

  // === 🛡️ iPad/Safari 專用：動態禁用電話自動探測 ===
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = "format-detection";
    meta.content = "telephone=no, date=no, address=no, email=no";
    document.head.appendChild(meta);
    return () => {
      try { document.head.removeChild(meta); } catch(e) {}
    };
  }, []);

  // === 儲存設定至 LocalStorage ===
  useEffect(() => { try { localStorage.setItem('kmb_custom_locations', JSON.stringify(locations)); } catch {} }, [locations]);
  useEffect(() => { try { localStorage.setItem('kmb_theme', JSON.stringify(isDarkMode)); } catch {} }, [isDarkMode]);
  useEffect(() => { try { localStorage.setItem('kmb_stand_mode', JSON.stringify(isStandMode)); } catch {} }, [isStandMode]);
  useEffect(() => { try { localStorage.setItem('kmb_left_mode', leftPanelMode); } catch {} }, [leftPanelMode]);
  useEffect(() => { try { localStorage.setItem('kmb_nearby_radius', nearbyRadius.toString()); } catch {} }, [nearbyRadius]);
  useEffect(() => { if (standMonitorId) try { localStorage.setItem('kmb_stand_monitor_id', standMonitorId); } catch {} }, [standMonitorId]);

  // 💡 分頁管理：強制將 ALL(最愛) 放第一格，NEARBY(附近) 放第二格，後續接自訂群組
  const availableGroups = useMemo(() => {
    const groupsSet = new Set(locations.map(loc => loc.groupName || '預設'));
    return ['ALL', 'NEARBY', ...Array.from(groupsSet)]; 
  }, [locations]);

  // 如果目前選取的 Tab 不在清單中，預設跳回 NEARBY
  useEffect(() => {
    if (activeTab !== 'ALL' && activeTab !== 'NEARBY' && !availableGroups.includes(activeTab)) {
      setActiveTab('NEARBY');
    }
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
        Object.values(warnData).forEach(w => {
          if (w.code && w.name) activeWarnings.push({ code: w.code, name: w.name });
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
      const processed = nearbyStops.map((stop, idx) => {
        const rawEtas = results[idx].data || [];
        const routeGroups = {};
        rawEtas.forEach(eta => {
          if (!eta.eta || !eta.route) return;
          const key = `${eta.route}-${eta.dir}-${eta.dest_tc}`;
          if (!routeGroups[key]) routeGroups[key] = { route: eta.route, dest: eta.dest_tc.includes('荃灣西') ? '荃灣西站' : eta.dest_tc, dir: eta.dir, etas: [] };
          routeGroups[key].etas.push(eta);
        });
        const routesDataList = Object.values(routeGroups).map(group => {
          group.etas.sort((a, b) => new Date(a.eta) - new Date(b.eta));
          return { route: group.route, dest: group.dest, etas: group.etas.slice(0, 2).map(e => ({ time: new Date(e.eta), rmk: e.rmk_tc !== "原定班次" ? e.rmk_tc : null })) };
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
    if (locations.length === 0) { setLocationsData([]); setLoading(false); return; }
    setLoading(true); setError(null);
    try {
      const uniqueStopIds = Array.from(new Set(locations.map(loc => loc.id)));
      const stopPromises = uniqueStopIds.map(stopId => fetch(`https://data.etabus.gov.hk/v1/transport/kmb/stop-eta/${stopId}`).then(res => res.ok ? res.json() : { data: [] }).catch(() => ({ data: [] })));
      const results = await Promise.all(stopPromises);
      const etasByStop = {};
      uniqueStopIds.forEach((stopId, idx) => { etasByStop[stopId] = results[idx].data || []; });
      const processedData = locations.map(loc => {
        const allEtas = etasByStop[loc.id] || [];
        const routesList = [];
        loc.routes.forEach(routeObj => {
          const validEtas = allEtas.filter(eta => eta.route === routeObj.route && eta.eta && (routeObj.dir ? eta.dir === routeObj.dir : true));
          if (validEtas.length > 0) {
            validEtas.sort((a, b) => new Date(a.eta) - new Date(b.eta));
            const primaryDest = validEtas[0].dest_tc || routeObj.dest || "目的地";
            routesList.push({ route: routeObj.route, dest: primaryDest.includes('荃灣西') ? '荃灣西站' : primaryDest, etas: validEtas.slice(0, 2).map(e => ({ time: new Date(e.eta), rmk: e.rmk_tc !== "原定班次" ? e.rmk_tc : null })) });
          } else {
            routesList.push({ route: routeObj.route, dest: routeObj.dest || "未有班次", etas: [] });
          }
        });
        routesList.sort((a, b) => a.route.localeCompare(b.route, undefined, { numeric: true }));
        return { ...loc, routesData: routesList };
      });
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
    if (!routeQuery) return [];
    const q = routeQuery.toUpperCase().trim();
    return allKmbRoutes
      .filter(r => r.route.toUpperCase().includes(q))
      .sort((a, b) => {
        if (a.route === q) return -1;
        if (b.route === q) return 1;
        return a.route.localeCompare(b.route, undefined, { numeric: true });
      })
      .slice(0, 15); 
  }, [allKmbRoutes, routeQuery]);

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

  const handleOpenSearchModal = async () => {
    setIsSettingsModalOpen(false); setShouldReopenSettings(true);
    setIsSearchModalOpen(true); setSearchStep(1); setRouteQuery(''); setSelectedRoute(null); setSelectedDirection(null); setSelectedStop(null);
    setCustomStopName(''); setCustomStopDesc(''); setCustomGroupName('預設'); setCustomGroupInput('');
    if (allKmbRoutes.length === 0) {
      setLoadingRoutes(true);
      try {
        const res = await fetch('https://data.etabus.gov.hk/v1/transport/kmb/route/');
        if (res.ok) { const d = await res.json(); setAllKmbRoutes(d.data || []); }
      } catch (e) { console.error("無法取得路線清單", e); } 
      finally { setLoadingRoutes(false); }
    }
  };

  const handleCloseSearchModal = () => {
    setIsSearchModalOpen(false);
    if (shouldReopenSettings) { setIsSettingsModalOpen(true); setShouldReopenSettings(false); }
  };

  const handleSelectRoute = (routeItem) => {
    setSelectedRoute(routeItem); setRouteDirections(allKmbRoutes.filter(r => r.route === routeItem.route)); setSearchStep(2);
  };

  const handleSelectDirection = async (directionItem) => {
    setSelectedDirection(directionItem); setSearchStep(3); setLoadingStops(true);
    try {
      const kDirection = directionItem.bound === 'I' ? 'inbound' : 'outbound';
      const res = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/route-stop/${directionItem.route}/${kDirection}/${directionItem.service_type}`);
      if (res.ok) {
        const d = await res.json();
        const stopList = d.data || [];
        const stopIds = stopList.map(s => s.stop);
        const nameCache = await fetchStopNamesInBatch(stopIds);
        setRouteStops(stopList.map(s => ({ ...s, name_tc: nameCache[s.stop] || s.stop })));
      }
    } catch (e) { console.error("無法取得巴士站清單", e); } 
    finally { setLoadingStops(false); }
  };

  const handleSelectStop = (stopItem) => {
    setSelectedStop(stopItem); setCustomStopName(stopItem.name_tc); setCustomStopDesc(`往 ${selectedDirection.dest_tc}`); setSearchStep(4);
  };

  const handleConfirmAddStop = () => {
    if (!selectedStop) return;
    const finalGroupName = customGroupName === 'NEW' ? (customGroupInput.trim() || '自訂') : customGroupName;
    const newRouteConfig = { route: selectedDirection.route, dir: selectedDirection.bound, dest: selectedDirection.dest_tc, serviceType: selectedDirection.service_type };
    
    const existingIndex = locations.findIndex(loc => loc.id === selectedStop.stop);
    let updatedLocations;
    
    if (existingIndex > -1) {
      updatedLocations = locations.map((loc, idx) => {
        if (idx === existingIndex) {
          const isRouteDuplicate = loc.routes.some(r => r.route === newRouteConfig.route && r.dir === newRouteConfig.dir);
          return {
            ...loc,
            name: customStopName.trim() || loc.name,
            desc: customStopDesc.trim() || loc.desc,
            groupName: finalGroupName,
            routes: isRouteDuplicate ? loc.routes : [...loc.routes, newRouteConfig]
          };
        }
        return loc;
      });
    } else {
      const newCard = {
        id: selectedStop.stop, filterId: finalGroupName.toUpperCase().replace(/\s+/g, ''), groupName: finalGroupName,
        name: customStopName.trim() || selectedStop.name_tc, desc: customStopDesc.trim() || `往 ${selectedDirection.dest_tc}`, routes: [newRouteConfig]
      };
      updatedLocations = [...locations, newCard];
    }

    setLocations(updatedLocations); 
    handleCloseSearchModal();
  };

  const fetchStopNamesInBatch = async (stopIds) => {
    let cache = {};
    try { cache = JSON.parse(localStorage.getItem('kmb_stop_names_cache') || '{}'); } catch {}
    const missingIds = stopIds.filter(id => !cache[id]);
    if (missingIds.length > 0) {
      const fetchSingle = async (id) => {
        try { const res = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/stop/${id}`); if (res.ok) { const d = await res.json(); return { id, name: d.data?.name_tc || id }; } } catch {}
        return { id, name: id };
      };
      const chunkSize = 10;
      for (let i = 0; i < missingIds.length; i += chunkSize) {
        const results = await Promise.all(missingIds.slice(i, i + chunkSize).map(fetchSingle));
        results.forEach(r => { cache[r.id] = r.name; });
      }
      try { localStorage.setItem('kmb_stop_names_cache', JSON.stringify(cache)); } catch {}
    }
    return cache;
  };

  // ========================================================
  // 🚌 核心升級：巴士路線行渲染
  // ========================================================
  const renderRow = (route, rIdx, isNearbySource = false, layoutType = 'LIST') => {
    const isEven = rIdx % 2 === 0;
    const rowBg = isEven ? theme.rowEven : theme.rowOdd;
    
    const primaryMins = route.etas[0] ? getEtaMinutes(route.etas[0].time) : null;
    const secondaryMins = route.etas[1] ? getEtaMinutes(route.etas[1].time) : null;
    const isMissed = primaryMins !== null && primaryMins < 0;
    const isImminent = primaryMins === 0;

    let etaColorStyle = { color: isDarkMode ? '#f4f4f5' : '#0f172a' }; 
    if (primaryMins !== null && primaryMins >= 0) {
      if (primaryMins <= 5) etaColorStyle = { color: '#e3342f' };       
      else if (primaryMins <= 10) etaColorStyle = { color: '#f97316' }; 
    }

    const isStand = layoutType === 'STAND';
    const routeNumSize = isStand ? 'text-4xl lg:text-5xl' : 'text-5xl sm:text-6xl md:text-7xl';
    const destSize = isStand ? 'text-xs' : 'text-sm sm:text-base';
    const primaryNumSize = isStand ? 'text-4xl lg:text-5xl' : 'text-5xl sm:text-6xl md:text-7xl';
    const primaryTextSize = isStand ? 'text-2xl' : 'text-3xl sm:text-4xl';
    const secondarySize = isStand ? 'text-lg' : 'text-2xl sm:text-3xl';
    const rowPadding = isStand ? 'px-4 py-3' : 'px-5 py-4 sm:py-5';
    const primaryEtaHeight = isStand ? 'h-[40px] lg:h-[48px]' : 'h-[50px] sm:h-[60px] md:h-[72px]';

    return (
      <div key={rIdx} className={`flex justify-between items-center ${rowPadding} transition-colors border-b border-gray-500/5 ${rowBg}`}>
        
        <div className="flex flex-col items-start justify-center flex-1 min-w-0 pr-3">
          <div className="flex items-center gap-2">
            <span className={`${routeNumSize} font-black tracking-tighter leading-none ios-num-fix ${theme.routeNum}`}>
              {route.route}
            </span>
          </div>
          <span className={`${destSize} font-bold mt-1.5 sm:mt-2 ${theme.routeDest} truncate w-full`}>
            往 {route.dest} {route.stopName && <span className="opacity-60 text-[0.85em] font-medium">({route.stopName})</span>}
          </span>
        </div>
        
        <div className="flex flex-col items-end justify-center shrink-0 min-w-[80px]">
          
          <div className={`flex items-center justify-end ${primaryEtaHeight}`}>
            {primaryMins === null ? (
              <span className={`${primaryNumSize} font-black leading-none ${theme.etaMissed}`}>-</span>
            ) : isMissed ? (
              <span className={`${primaryTextSize} font-black tracking-wide leading-none ${theme.etaMissed}`}>已開出</span>
            ) : isImminent ? (
              <span style={etaColorStyle} className={`${primaryTextSize} font-black tracking-wide animate-pulse leading-none ios-num-fix`}>即將到站</span>
            ) : (
              <span style={etaColorStyle} className={`${primaryNumSize} font-black tracking-tighter leading-none ios-num-fix`}>{primaryMins}</span>
            )}
          </div>
          
          <div className="flex items-end justify-end mt-1.5 sm:mt-2">
            {secondaryMins !== null && secondaryMins >= 0 ? (
              <span className={`${secondarySize} font-extrabold ${theme.etaSecondary} ios-num-fix leading-none`}>
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

  // === 📱 列表模式 ===
  const renderListMode = () => {
    const filteredGroups = groupedFavoritesData.filter(g => activeTab === 'ALL' || g.groupName === activeTab);

    return (
      <div className="w-full max-w-4xl mx-auto px-0 sm:px-3 pt-0 sm:pt-4 pb-24">
        {error && <div className="bg-red-50 text-red-600 p-2.5 text-center text-xs font-bold mx-3 my-3 rounded-lg">{error}</div>}
        
        {/* ================= 🛰️ 附近巴士站專屬分頁 ================= */}
        {activeTab === 'NEARBY' && (
          <div className="flex flex-col gap-4 px-3 sm:px-0 mt-3 sm:mt-0">
            {/* 提示使用者點擊定位 */}
            {(!userCoords || gpsLoading) ? (
              <div className={`p-8 rounded-2xl border text-center flex flex-col items-center justify-center gap-3 ${theme.emptyStateBg}`}>
                <MapPin className="w-8 h-8 text-blue-500 animate-bounce" />
                <h3 className="text-sm font-bold">探索附近巴士站</h3>
                <p className="text-gray-400 text-xs max-w-xs leading-relaxed">我們將使用 GPS 定位尋找你周圍最近的巴士站點與實時到站時間。</p>
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

            {/* 定位成功後載入周邊站點 */}
            {userCoords && nearbyStopsData.length > 0 ? (
              nearbyStopsData.map((loc, idx) => (
                <div key={idx} className={`rounded-xl overflow-hidden shadow-sm border ${theme.groupCardBg}`}>
                  <div className={`px-4 py-2.5 flex items-center justify-between border-b ${theme.groupHeaderBg}`}>
                    <div className="flex items-center gap-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-extrabold shadow-sm ${theme.pillBg}`}>{loc.name}</span>
                      <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">距離 {loc.distance} 米</span>
                    </div>
                    <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc.name + ' 巴士站')}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-blue-600 font-bold">🗺️ 地圖</a>
                  </div>
                  <div className="flex flex-col">
                    {loc.routesData.map((route, rIdx) => renderRow(route, rIdx, true, 'LIST'))}
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
                  
                  <div className={`py-4 flex justify-center border-b ${theme.groupHeaderBg}`}>
                    <span className="bg-[#e3342f] text-white px-6 py-1.5 rounded-full font-black text-sm md:text-base shadow-sm tracking-widest">
                      {group.groupName}
                    </span>
                  </div>

                  <div className={`flex justify-between px-5 py-2.5 text-sm md:text-base font-black border-b ${theme.groupHeaderText}`}>
                    <span>路線</span>
                    <span>分鐘</span>
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
    if (standMonitorId === 'NEARBY_STOPS') {
      nearbyStopsData.forEach(s => {
        const withStopName = s.routesData.map(r => ({ ...r, stopName: s.name }));
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
                  {weatherInfo.icon && <img src={`https://www.hko.gov.hk/images/HKOWxIconOutline/pic${weatherInfo.icon}.png`} alt="Weather" className="w-16 h-16 drop-shadow-xl" />}
                  <div className="flex flex-col">
                    <span className="text-4xl md:text-5xl font-black">{weatherInfo.temp}°C</span>
                    <span className="text-[10px] font-bold text-white/70">香港天文台</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 max-w-full">
                  {weatherInfo.warnings.map((warn, idx) => (
                    <div key={idx} className={`px-2 py-0.5 rounded font-black text-xs animate-pulse ${getWarningStyle(warn.code)}`}>{warn.name}</div>
                  ))}
                </div>
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
                {nearbyStopsData.length > 0 && <option value="NEARBY_STOPS">🛰️ 附近巴士站</option>}
                <option value="ALL_FAVORITES">★ 全部最愛</option>
                {groupedFavoritesData.map(g => <option key={g.groupName} value={g.groupName}>📁 分組: {g.groupName}</option>)}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-2 pointer-events-none opacity-60" />
            </div>
          </div>

          <div className={`flex justify-between px-4 py-2 text-[11px] font-black border-b shrink-0 ${theme.groupHeaderText}`}>
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
        a[href^="tel"], a[href^="tel"]:hover, a[href^="tel"]:active, a[href^="tel"]:focus { 
          color: inherit; 
          text-decoration: none; 
          pointer-events: none; 
        }
      `}</style>

      <header className={`px-4 py-3 flex items-center justify-between border-b shadow-sm z-20 shrink-0 transition-colors ${theme.topBar}`}>
        <div className="flex gap-1">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-1.5 text-white/80 hover:text-white rounded-full"><Sun className="w-4 h-4 hidden dark:block" /><Moon className="w-4 h-4 block dark:hidden" /></button>
          <button onClick={() => setIsStandMode(!isStandMode)} className={`p-1.5 rounded-full ${isStandMode ? 'bg-white text-red-600 shadow-md' : 'text-white/80 hover:text-white'}`}><MonitorSmartphone className="w-4 h-4" /></button>
          {isStandMode && (
            <button onClick={() => setLeftPanelMode(leftPanelMode === 'WEATHER' ? 'PHOTO' : 'WEATHER')} className="ml-1 p-1.5 rounded-full bg-white/20 text-white border border-white/20 flex items-center gap-1 px-3">
              {leftPanelMode === 'WEATHER' ? <><ImageIcon className="w-3.5 h-3.5" /><span className="text-xs font-bold hidden sm:inline">轉相簿</span></> : <><CloudSun className="w-3.5 h-3.5" /><span className="text-xs font-bold hidden sm:inline">轉天氣</span></>}
            </button>
          )}
        </div>
        <h1 className="text-sm md:text-base font-black tracking-widest text-white text-center flex-1 pr-6 md:pr-0">巴士到站看板</h1>
        <div className="flex items-center gap-1">
          <button onClick={() => { if (activeTab === 'NEARBY' && userCoords) fetchNearbyStopsLiveETA(); else fetchCustomLocationsData(); fetchWeather(); }} className="p-1.5 text-white/85 hover:text-white rounded-full">
            <RefreshCw className={`w-4 h-4 ${loading || gpsLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setIsSettingsModalOpen(true)} className="p-1.5 text-white/85 hover:text-white rounded-full hover:bg-white/10 transition-colors"><Settings className="w-4.5 h-4.5" /></button>
        </div>
      </header>

      <main className={`flex-1 w-full overflow-hidden ${isStandMode ? 'flex' : 'overflow-y-auto'}`}>
        {!isStandMode ? renderListMode() : renderStandMode()}
      </main>

      {!isStandMode && (
        <footer className={`fixed bottom-0 left-0 w-full p-2.5 shadow-xl border-t border-gray-500/10 transition-colors z-20 ${theme.bottomBar}`}>
          <div className="max-w-4xl mx-auto flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth items-center">
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

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-fade-in">
          <div className={`w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border ${theme.modalBg}`}>
            
            <div className="px-5 py-4 border-b border-gray-500/10 flex items-center justify-between shrink-0">
              <h3 className="font-extrabold text-base flex items-center gap-2 text-[#e3342f]">
                <Settings className="w-5 h-5 animate-spin-hover" />
                看板設定中心
              </h3>
              <button onClick={() => { setIsSettingsModalOpen(false); setBackupError(''); setBackupSuccess(''); setImportText(''); }} className="p-1 rounded-full hover:bg-gray-500/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex border-b border-gray-500/10 bg-slate-500/5 shrink-0 text-xs font-black">
              <button onClick={() => { setSettingsTab('FAVORITES'); setBackupError(''); setBackupSuccess(''); }} className={`flex-1 py-3 text-center transition-all ${settingsTab === 'FAVORITES' ? 'border-b-2 border-[#e3342f] text-[#e3342f]' : 'opacity-60'}`}>📁 最愛管理</button>
              <button onClick={() => { setSettingsTab('BACKUP'); setBackupError(''); setBackupSuccess(''); }} className={`flex-1 py-3 text-center transition-all ${settingsTab === 'BACKUP' ? 'border-b-2 border-[#e3342f] text-[#e3342f]' : 'opacity-60'}`}>💾 備份還原</button>
              <button onClick={() => { setSettingsTab('ADVANCED'); setBackupError(''); setBackupSuccess(''); }} className={`flex-1 py-3 text-center transition-all ${settingsTab === 'ADVANCED' ? 'border-b-2 border-[#e3342f] text-[#e3342f]' : 'opacity-60'}`}>⚙️ 進階設定</button>
            </div>

            <div className="flex-1 p-5 overflow-y-auto">
              {backupSuccess && <div className="mb-4 bg-green-500/10 border border-green-500/20 text-green-500 p-2.5 text-center text-xs font-bold rounded-lg animate-pulse">{backupSuccess}</div>}
              {backupError && <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-500 p-2.5 text-center text-xs font-bold rounded-lg">{backupError}</div>}

              {settingsTab === 'FAVORITES' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black opacity-60">您目前收藏了 {locations.length} 個巴士站：</span>
                    <button onClick={handleOpenSearchModal} className="bg-[#e3342f] hover:bg-red-600 text-white px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm flex items-center gap-1">
                      <Plus className="w-3.5 h-3.5 text-white" />手動新增路線
                    </button>
                  </div>
                  {locations.length === 0 ? (
                    <div className="py-12 text-center text-xs opacity-50 border border-dashed rounded-xl">目無自訂路線，請點擊右上方「手動新增路線」。</div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {locations.map((loc) => (
                        <div key={loc.id} className="p-3.5 rounded-xl border border-gray-500/10 bg-slate-500/5 flex flex-col gap-2 relative">
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-sm font-black">{loc.name}</span>
                              <span className="text-[10px] opacity-60">{loc.desc} (分組: {loc.groupName || '預設'})</span>
                            </div>
                            <button onClick={(e) => handleDeleteLocation(loc.id, e)} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-950/40 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                          </div>
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {loc.routes.map((r, rIdx) => (
                              <span key={rIdx} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg shadow-sm font-black text-xs border ${theme.badgeGroupItem}`}>
                                {r.route} <button onClick={(e) => handleDeleteRouteInLocation(loc.id, r.route, e)} className="text-red-500 hover:text-red-700 ml-1 font-bold text-[10px]">✕</button>
                              </span>
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
                  <div className="p-3.5 rounded-xl bg-slate-500/5 border flex flex-col gap-3">
                    <span className="text-xs font-black">📥 匯出最愛備份設定</span>
                    <p className="text-[11px] opacity-70 leading-relaxed font-bold">您可以將自訂巴士看板數據導出保存，便於同步至您的 iPad 或其他家人的裝置。</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={handleDownloadBackupFile} className="bg-[#e3342f] hover:bg-red-600 text-white py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1"><Download className="w-3.5 h-3.5" />下載備份檔 (.json)</button>
                      <button onClick={handleCopyBackupCode} className={`py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-1 transition-colors ${theme.controlBtn}`}><Copy className="w-3.5 h-3.5" />複製設定代碼</button>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-red-500/5 border border-red-500/10 flex flex-col gap-3">
                    <span className="text-xs font-black text-red-500">📤 覆蓋還原自訂最愛</span>
                    <p className="text-[11px] opacity-70 leading-relaxed font-bold">上傳先前保存的備份檔案，或者直接在下方貼上備份 JSON 代碼。注意這將覆蓋現有看板最愛。</p>
                    <div className="border border-dashed border-gray-500/25 p-3 rounded-lg flex flex-col items-center justify-center gap-2">
                      <input type="file" accept=".json" onChange={handleUploadFile} className="hidden" id="setting-backup-upload" />
                      <label htmlFor="setting-backup-upload" className="px-4 py-1.5 bg-[#e3342f] text-white hover:bg-red-600 rounded-lg text-xs font-bold cursor-pointer">選擇上傳設定檔 (.json)</label>
                    </div>
                    <textarea rows={3} placeholder='或在此處貼上備份 JSON 代碼...' value={importText} onChange={(e) => setImportText(e.target.value)} className={`w-full py-1.5 px-3 rounded-lg border font-mono text-[10px] resize-none focus:outline-none focus:ring-1 focus:ring-red-500 ${theme.inputBg}`} />
                    <button onClick={handleConfirmImport} className="bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-extrabold text-xs flex items-center justify-center gap-1 shadow-sm"><Check className="w-3.5 h-3.5" />確認匯入並覆蓋最愛</button>
                  </div>
                </div>
              )}

              {settingsTab === 'ADVANCED' && (
                <div className="flex flex-col gap-5">
                  <div className="p-3.5 rounded-xl border bg-slate-500/5 flex flex-col gap-3">
                    <span className="text-xs font-black flex items-center gap-1.5"><Sliders className="w-4 h-4 text-blue-500" />🛰️ 附近巴士站搜尋範圍設定</span>
                    <p className="text-[11px] opacity-70 leading-relaxed font-bold">微調 GPS 定位搜尋周圍巴士站點的最大允許半徑，目前半徑為：<strong className="text-blue-500 text-xs ml-1">{nearbyRadius} 米</strong></p>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold opacity-50">300米</span>
                      <input type="range" min="300" max="2000" step="100" value={nearbyRadius} onChange={(e) => setNearbyRadius(parseInt(e.target.value))} className="flex-1 accent-[#e3342f] cursor-pointer" />
                      <span className="text-[10px] font-bold opacity-50">2000米</span>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl border border-red-500/10 bg-red-500/5 flex flex-col gap-3">
                    <span className="text-xs font-black text-red-500 flex items-center gap-1.5"><RotateCcw className="w-4 h-4" />還原原廠預設值</span>
                    <p className="text-[11px] opacity-70 leading-relaxed font-bold">還原最愛看板設定回範例（預設峻巒總站、形點 II、大欖隧道配置），這將重置所有自訂設定。</p>
                    {!showResetConfirm ? (
                      <button onClick={() => setShowResetConfirm(true)} className="bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-bold text-xs">重設我的最愛站點</button>
                    ) : (
                      <div className="flex gap-2 animate-pulse">
                        <button onClick={handleResetToPreload} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-black text-xs">確定重設！(點擊執行)</button>
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
                    <label className="text-xs font-black opacity-70">輸入巴士路線名稱搜尋：</label>
                    <div className="relative">
                      <input type="text" placeholder="例如: 268M, 68F, 968, B1..." value={routeQuery} onChange={(e) => setRouteQuery(e.target.value)} className={`w-full py-2 px-3 rounded-lg border font-bold text-sm focus:outline-none focus:ring-1 focus:ring-red-500 ${theme.inputBg}`} autoFocus />
                      {routeQuery && <button onClick={() => setRouteQuery('')} className="absolute right-3 top-2.5 text-xs opacity-50">清除</button>}
                    </div>
                  </div>
                  {loadingRoutes ? (
                    <div className="py-10 text-center text-sm font-bold opacity-70 flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4 animate-spin text-red-500" />正在加載全港路線...</div>
                  ) : filteredRoutesList.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      <span className="text-[11px] font-bold opacity-60">搜尋建議：</span>
                      <div className="grid grid-cols-2 gap-2 max-h-[250px] overflow-y-auto pr-1">
                        {filteredRoutesList.map((r, idx) => (
                          <button key={idx} onClick={() => handleSelectRoute(r)} className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all hover:scale-[1.02] ${theme.controlBtn}`}>
                            <span className="text-lg font-black leading-none text-red-500">{r.route}</span>
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
                  <div className="bg-red-500/10 p-3.5 rounded-xl border border-red-500/20 text-center">
                    <span className="text-3xl font-black text-red-500 block mb-1">{selectedRoute.route}</span>
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
                  <div className="bg-slate-500/10 p-3 rounded-xl text-center text-xs">設定 <strong className="text-red-500">{selectedDirection.route}</strong> 往 <strong className="text-red-500">{selectedDirection.dest_tc}</strong> 的站點</div>
                  {loadingStops ? (
                    <div className="py-12 text-center text-sm font-bold opacity-70 flex flex-col items-center justify-center gap-2"><RefreshCw className="w-5 h-5 animate-spin text-red-500" /><span>正在獲取巴士站點資訊...</span></div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <span className="text-[11px] font-bold opacity-60">沿途巴士站：</span>
                      <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto pr-1">
                        {routeStops.map((stop, idx) => (
                          <button key={idx} onClick={() => handleSelectStop(stop)} className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${theme.controlBtn}`}>
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-black bg-slate-500/10 dark:bg-zinc-800 w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-slate-800 dark:text-zinc-200">{stop.seq}</span>
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
                    <span className="text-lg font-black">{selectedDirection.route} 號巴士</span>
                    <span className="text-sm font-bold opacity-80">於「{selectedStop.name_tc}」上車</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black opacity-70">顯示巴士站名稱 (選填)：</label>
                    <input type="text" placeholder={selectedStop.name_tc} value={customStopName} onChange={(e) => setCustomStopName(e.target.value)} className={`w-full py-2 px-3 rounded-lg border font-bold text-sm focus:outline-none focus:ring-1 focus:ring-red-500 ${theme.inputBg}`} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-black opacity-70">方向描述 (選填)：</label>
                    <input type="text" placeholder={`往 ${selectedDirection.dest_tc}`} value={customStopDesc} onChange={(e) => setCustomStopDesc(e.target.value)} className={`w-full py-2 px-3 rounded-lg border font-bold text-sm focus:outline-none focus:ring-1 focus:ring-red-500 ${theme.inputBg}`} />
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
