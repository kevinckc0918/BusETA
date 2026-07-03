import React, { useState, useEffect, useCallback } from 'react';
import { Bus, RefreshCw, AlertCircle, Navigation, MapPin, Compass, Clock, Search, Copy, X, Moon, Sun, MonitorSmartphone, Minimize } from 'lucide-react';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [locationsData, setLocationsData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  
  const [activeTab, setActiveTab] = useState('全部');
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  
  const [showDetailedTime, setShowDetailedTime] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 暗黑主題狀態
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('busTheme');
        if (savedTheme === 'light') return false; 
      }
    } catch (e) {}
    return false; // 預設光亮模式
  });

  useEffect(() => {
    try {
      localStorage.setItem('busTheme', isDarkMode ? 'dark' : 'light');
      document.body.style.backgroundColor = isDarkMode ? '#111827' : '#ffffff';
    } catch (e) {}
  }, [isDarkMode]);

  const t = (lightClass, darkClass) => isDarkMode ? darkClass : lightClass;

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(e => console.error(e));
      } else {
        if (document.exitFullscreen) document.exitFullscreen().then(() => setIsFullscreen(false));
      }
    } catch (e) {}
  };

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const LOCATIONS = [
    {
      ids: ["6386333EDAC64C96", "2E73B26A07205432"], 
      region: "楊屋村",
      name: "楊屋村 (西行)",
      desc: "往 元朗市中心 / 機場",
      routes: ['54', '64K', '251C', '76K', '77K', '68', '68F', 'A36'],
      ignoreDest: ['康樂路', '八鄉'],
      lat: 22.4357, lng: 114.0483
    },
    {
      ids: ["36DC37F6A54BA5E0"], 
      region: "楊屋村",
      name: "東成里 (東/南行)",
      desc: "往 峻巒 / 青衣", 
      routes: ['68E', '68', '68F'], 
      lat: 22.4371, lng: 114.0478
    },
    {
      ids: ["DAFFF59B0718B464", "FAB0AB2B6DCEE7F2", "C7ACD35D5D7C153B"],
      region: "元朗西",
      name: "元朗（西）總站",
      desc: "往 港島 / 錦田 / 大埔",
      routes: ['968', 'N368', '54', '64K'],
      ignoreDest: ['元朗'],
      lat: 22.4442, lng: 114.0256
    },
    {
      ids: ["6E85D42922E5A10C"], 
      region: "元朗西",
      name: "元朗廣場",
      desc: "往 錦田 / 大埔",
      routes: ['54', '64K', '251C'],
      lat: 22.4446, lng: 114.0227
    },
    {
      ids: ["4EE417C5EF5FEF4E"], 
      region: "元朗西",
      name: "元朗喜利徑",
      desc: "往 上水",
      routes: ['76K'],
      lat: 22.4443, lng: 114.0242
    },
    {
      ids: ["E481F7170B1F6FC3"],
      region: "大欖隧道",
      name: "大欖隧道 (B1)",
      desc: "往 元朗公園 (北行)",
      routes: ['68E'],
      lat: 22.4176, lng: 114.0622
    },
    {
      ids: ["211D93217331B040"],
      region: "大欖隧道",
      name: "大欖隧道 (A3)",
      desc: "往 港島 (南行)",
      routes: ['968', 'N368'],
      lat: 22.4177, lng: 114.0627
    },
    {
      ids: ["C3D2F84C0F0FF415", "CC1A19B90FFC1703", "C88DEC0AF0D1102B"], 
      region: "灣仔",
      name: "菲林明道",
      desc: "往 元朗(西)",
      routes: ['968', 'P968', 'N368'], 
      ignoreDest: ['中環', '港澳', '銅鑼灣', '天后'],
      lat: 22.2782, lng: 114.1738
    },
    {
      ids: ["E74202351AF7F37D"], 
      ctbIds: ["002430"], 
      region: "灣仔",
      name: "盧押道",
      desc: "往 寶達",
      routes: ['601', '601P'],
      lat: 22.2774, lng: 114.1711
    },
    {
      ids: ["04B6438688E12AC0"], 
      ctbIds: ["003039"], 
      region: "觀塘",
      name: "祥和苑",
      desc: "往 港島 (金鐘/上環)",
      routes: ['601P'],
      lat: 22.3197, lng: 114.2274
    }
  ];

  const TABS = ['全部', '附近', '楊屋村', '元朗西', '大欖', '灣仔', '觀塘'];

  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    if (activeTab === '附近') {
      if (!navigator.geolocation) {
        setGpsError('不支援定位');
        return;
      }
      setLocating(true);
      setGpsError(null);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocating(false);
        },
        (err) => {
          setGpsError('無法獲取位置');
          setLocating(false);
          setTimeout(() => setActiveTab('全部'), 2000);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  }, [activeTab]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchPromises = LOCATIONS.map(loc => {
        const kmbFetches = (loc.ids || []).map(id => {
          return fetch(`https://data.etabus.gov.hk/v1/transport/kmb/stop-eta/${id}`)
            .then(res => res.ok ? res.json() : { data: [] })
            .catch(() => ({ data: [] }));
        });

        const ctbFetches = [];
        if (loc.ctbIds && loc.ctbIds.length > 0) {
          loc.ctbIds.forEach(id => {
            loc.routes.forEach(route => {
              ctbFetches.push(
                fetch(`https://rt.data.gov.hk/v2/transport/citybus/eta/CTB/${id}/${route}`)
                  .then(res => res.ok ? res.json() : { data: [] })
                  .catch(() => ({ data: [] }))
              );
            });
          });
        }
        
        return Promise.all([...kmbFetches, ...ctbFetches]).then(results => {
          const mergedData = results.flatMap(res => res.data || []);
          return { data: mergedData };
        });
      });

      const results = await Promise.all(fetchPromises);

      const processedData = LOCATIONS.map((loc, idx) => {
        const allEtas = results[idx].data || [];
        const groupedRoutes = {};

        allEtas.forEach(eta => {
          const etaRoute = eta.route || eta.route_no || eta.Route; 
          if (loc.routes.includes(etaRoute) && eta.eta) {
            if (loc.ignoreDest && loc.ignoreDest.some(destWord => eta.dest_tc && eta.dest_tc.includes(destWord))) {
              return; 
            }
            const key = etaRoute; 
            if (!groupedRoutes[key]) {
              groupedRoutes[key] = {
                route: etaRoute,
                dest: eta.dest_tc || loc.desc.replace('往 ', ''), 
                etas: []
              };
            }
            const etaTimeMs = new Date(eta.eta).getTime();
            const isDuplicate = groupedRoutes[key].etas.some(existingEta => 
              Math.abs(existingEta.time.getTime() - etaTimeMs) < 60000
            );

            if (!isDuplicate) {
              groupedRoutes[key].etas.push({
                time: new Date(eta.eta),
                rmk: eta.rmk_tc && eta.rmk_tc !== "原定班次" && eta.rmk_tc !== "九巴時段" ? eta.rmk_tc : null,
                co: eta.co || (eta.dir ? 'CTB' : 'KMB') 
              });
            }
          }
        });

        const routesList = Object.values(groupedRoutes).map(group => {
          group.etas.sort((a, b) => a.time - b.time);
          group.etas = group.etas.slice(0, 2); 
          return group;
        });
        routesList.sort((a, b) => a.route.localeCompare(b.route, undefined, { numeric: true }));

        return { ...loc, routesData: routesList };
      });

      setLocationsData(processedData);
      setLastUpdated(new Date());
    } catch (err) {
      setError('獲取數據失敗，請檢查網絡。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const getCompactEta = (etaDate) => {
    const now = new Date();
    const diffMs = etaDate - now;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 0) return { text: '已開出', val: -1 }; 
    if (diffMins === 0) return { text: '即將', val: 0 };
    return { text: diffMins.toString(), val: diffMins }; 
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('zh-HK', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  let displayLocations = [];
  if (activeTab === '附近') {
    if (userLocation) {
      displayLocations = locationsData
        .map(loc => ({ ...loc, distance: getDistance(userLocation.lat, userLocation.lng, loc.lat, loc.lng) }))
        .filter(loc => loc.distance < 5) 
        .sort((a, b) => a.distance - b.distance); 
    }
  } else if (activeTab === '全部') {
    displayLocations = locationsData;
  } else {
    displayLocations = locationsData.filter(loc => loc.region.includes(activeTab));
  }

  const visibleLocations = displayLocations.filter(loc => loc.routesData.length > 0);

  const SearchModal = () => {
    const [routeInput, setRouteInput] = useState('');
    const [stops, setStops] = useState([]);
    const [fetching, setFetching] = useState(false);

    const searchRoute = async () => {
      if (!routeInput) return;
      setFetching(true);
      setStops([]);
      
      try {
        let allStops = [];
        const kmbOutRes = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/route-stop/${routeInput}/outbound/1`).then(r=>r.json()).catch(()=>({data:[]}));
        const kmbInRes = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/route-stop/${routeInput}/inbound/1`).then(r=>r.json()).catch(()=>({data:[]}));
        
        const kmbStopsData = [...(kmbOutRes.data || []), ...(kmbInRes.data || [])];
        if (kmbStopsData.length > 0) {
          const kmbPromises = kmbStopsData.map(async (s) => {
            const detail = await fetch(`https://data.etabus.gov.hk/v1/transport/kmb/stop/${s.stop}`).then(r=>r.json()).catch(()=>({data:{}}));
            return { co: 'KMB', dir: s.bound === 'O' ? '去程' : '回程', seq: s.seq, id: s.stop, name: detail.data?.name_tc || '未知站名' };
          });
          const resolvedKmb = await Promise.all(kmbPromises);
          allStops = [...allStops, ...resolvedKmb];
        }

        const ctbOutRes = await fetch(`https://rt.data.gov.hk/v2/transport/citybus/route-stop/CTB/${routeInput}/outbound`).then(r=>r.json()).catch(()=>({data:[]}));
        const ctbInRes = await fetch(`https://rt.data.gov.hk/v2/transport/citybus/route-stop/CTB/${routeInput}/inbound`).then(r=>r.json()).catch(()=>({data:[]}));
        
        const ctbStopsData = [...(ctbOutRes.data || []), ...(ctbInRes.data || [])];
        if (ctbStopsData.length > 0) {
          const ctbPromises = ctbStopsData.map(async (s) => {
            const detail = await fetch(`https://rt.data.gov.hk/v2/transport/citybus/stop/${s.stop}`).then(r=>r.json()).catch(()=>({data:{}}));
            return { co: 'CTB', dir: s.dir === 'O' ? '去程' : '回程', seq: s.seq, id: s.stop, name: detail.data?.name_tc || '未知站名' };
          });
          const resolvedCtb = await Promise.all(ctbPromises);
          allStops = [...allStops, ...resolvedCtb];
        }
        
        allStops.sort((a, b) => {
          if (a.co !== b.co) return a.co.localeCompare(b.co);
          if (a.dir !== b.dir) return a.dir.localeCompare(b.dir);
          return a.seq - b.seq;
        });

        setStops(allStops);
      } catch (err) {
        alert("搜尋失敗");
      } finally {
        setFetching(false);
      }
    };

    const copyToClipboard = (id, co) => {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = id;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert(`已複製 ${co} ID: ${id}`);
      } catch (err) {
        alert(`無法自動複製，請手動抄寫 ID: ${id}`);
      }
    };

    return (
      <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm transition-colors ${t('bg-black/60', 'bg-black/80')}`}>
        <div className={`rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors ${t('bg-white', 'bg-gray-800')}`}>
          <div className={`border-b p-4 flex items-center justify-between transition-colors ${t('bg-gray-100 border-gray-200', 'bg-gray-900 border-gray-700')}`}>
            <div className="flex items-center gap-2">
              <Search className={`w-5 h-5 ${t('text-[#C63C31]', 'text-red-500')}`} />
              <h2 className={`text-lg font-bold tracking-wide ${t('text-gray-800', 'text-gray-100')}`}>路線尋站系統</h2>
            </div>
            <button onClick={() => setShowSearchModal(false)} className={`p-1.5 rounded-full transition-colors ${t('bg-gray-200 hover:bg-red-100 text-gray-600 hover:text-red-600', 'bg-gray-800 hover:bg-red-900/40 text-gray-300 hover:text-red-400')}`}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 flex flex-col flex-1 overflow-hidden">
            <div className="flex gap-2 mb-4 shrink-0">
              <input type="text" value={routeInput} onChange={(e) => setRouteInput(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === 'Enter' && searchRoute()} placeholder="輸入巴士路線..." className={`border rounded-lg px-4 py-2 flex-1 outline-none text-lg font-bold ${t('border-gray-300 bg-white text-gray-800 focus:border-[#C63C31]', 'border-gray-600 bg-gray-700 text-gray-100 focus:border-red-500')}`} />
              <button onClick={searchRoute} disabled={fetching} className={`text-white px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2 disabled:opacity-50 ${t('bg-[#C63C31] hover:bg-red-800', 'bg-red-700 hover:bg-red-600')}`}>
                {fetching ? <RefreshCw className="w-5 h-5 animate-spin" /> : '搜尋'}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {!fetching && stops.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
                  {stops.map(stop => (
                    <div key={`${stop.co}-${stop.dir}-${stop.seq}`} className={`p-3 rounded-lg border flex flex-col justify-between shadow-sm ${stop.co === 'KMB' ? t('bg-red-50 border-red-100', 'bg-red-900/10 border-red-900/30') : t('bg-blue-50 border-blue-100', 'bg-blue-900/10 border-blue-900/30')}`}>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${stop.co === 'KMB' ? t('bg-[#E32636]', 'bg-red-700') : t('bg-blue-600', 'bg-blue-700')}`}>{stop.co}</span>
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${stop.co === 'KMB' ? t('bg-white text-red-700 border-red-200', 'bg-gray-800 text-red-400 border-red-800') : t('bg-white text-blue-700 border-blue-200', 'bg-gray-800 text-blue-400 border-blue-800')}`}>{stop.dir} - #{stop.seq}</span>
                        </div>
                        <h3 className={`font-bold text-base mt-2 leading-tight ${t('text-gray-800', 'text-gray-200')}`}>{stop.name}</h3>
                      </div>
                      <div className={`mt-3 flex items-center justify-between px-2 py-1.5 rounded border shadow-sm ${stop.co === 'KMB' ? t('bg-white border-red-200', 'bg-gray-900 border-red-900/50') : t('bg-white border-blue-200', 'bg-gray-900 border-blue-900/50')}`}>
                        <code className={`text-sm font-mono font-bold ${stop.co === 'KMB' ? t('text-red-800', 'text-red-400') : t('text-blue-800', 'text-blue-400')}`}>{stop.id}</code>
                        <button onClick={() => copyToClipboard(stop.id, stop.co)} className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 ${stop.co === 'KMB' ? t('bg-red-100 text-red-700', 'bg-red-900/40 text-red-300') : t('bg-blue-100 text-blue-700', 'bg-blue-900/40 text-blue-300')}`}><Copy className="w-3 h-3" /> 複製</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={t("min-h-screen bg-white text-gray-800 font-sans transition-colors duration-300", "min-h-screen bg-[#111827] text-gray-100 font-sans transition-colors duration-300")}>
      
      {showSearchModal && <SearchModal />}

      {/* 頂部紅色 Header */}
      <header className={`p-2.5 md:p-3 shadow-md sticky top-0 z-20 flex justify-between items-center transition-colors duration-300 ${t('bg-[#CA3F32]', 'bg-red-950 border-b border-red-900')}`}>
        <div className="w-full max-w-4xl mx-auto flex justify-between items-center relative">
          <div className="flex items-center gap-1 md:gap-3">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-1.5 rounded-full transition-colors ${t('text-white/90 hover:text-white', 'text-red-200 hover:text-white')}`}>
              {isDarkMode ? <Sun className="w-5 h-5 md:w-6 md:h-6" /> : <Moon className="w-5 h-5 md:w-6 md:h-6" />}
            </button>
            <button onClick={toggleFullscreen} className={`p-1.5 rounded-full hidden sm:block transition-colors ${t('text-white/90 hover:text-white', 'text-red-200 hover:text-white')}`}>
              {isFullscreen ? <Minimize className="w-5 h-5 md:w-6 md:h-6" /> : <MonitorSmartphone className="w-5 h-5 md:w-6 md:h-6" />}
            </button>
          </div>

          <h1 className="text-lg md:text-2xl font-bold tracking-widest text-white absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap drop-shadow-sm">
            楊屋村巴士到站預報
          </h1>

          <div className="flex items-center gap-1 md:gap-3">
            <button onClick={() => setShowSearchModal(true)} className={`p-1.5 rounded-full transition-colors ${t('text-white/90 hover:text-white', 'text-red-200 hover:text-white')}`}>
              <Search className="w-5 h-5 md:w-6 md:h-6" />
            </button>
            <button onClick={fetchData} disabled={loading} className={`p-1.5 rounded-full transition-colors ${t('text-white/90 hover:text-white', 'text-red-200 hover:text-white')} ${loading ? 'opacity-50' : ''}`}>
              <RefreshCw className={`w-5 h-5 md:w-6 md:h-6 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* 主要內容區 */}
      <main className="w-full max-w-4xl mx-auto pb-20 transition-colors duration-300">
        
        {error && (
          <div className={`p-2 m-2 rounded-lg flex items-start gap-2 text-sm ${t('bg-red-50 border border-red-200 text-red-700', 'bg-red-900/30 border border-red-800 text-red-400')}`}>
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {activeTab === '附近' && (
          <div className="m-2">
            {locating && <div className={`p-2 rounded flex items-center justify-center gap-2 text-sm ${t('text-blue-600 bg-blue-50', 'text-blue-400 bg-blue-900/20')}`}><Compass className="w-4 h-4 animate-spin" /> 正在獲取位置...</div>}
            {gpsError && <div className={`p-2 rounded flex items-center justify-center gap-2 text-sm ${t('text-orange-600 bg-orange-50', 'text-orange-400 bg-orange-900/20')}`}><AlertCircle className="w-4 h-4" /> {gpsError}</div>}
          </div>
        )}

        {!loading && !locating && visibleLocations.length === 0 && (
          <div className={`py-12 mt-4 text-center flex flex-col items-center justify-center transition-colors duration-300 ${t('text-gray-400', 'text-gray-500')}`}>
            <Bus className="w-10 h-10 opacity-20 mb-2" />
            <p className={`text-base font-medium ${t('text-gray-500', 'text-gray-400')}`}>該地區目前無即將到站班次</p>
          </div>
        )}

        {/* 渲染每個車站 */}
        {visibleLocations.map(loc => (
          <div key={loc.name} className="mb-0">
            
            {/* 置中紅色藥丸車站名 */}
            <div className={`flex justify-center py-2 sticky top-[48px] md:top-[56px] z-10 ${t('bg-white/95', 'bg-[#111827]/95')} backdrop-blur-sm`}>
              <span className={`px-4 py-1 md:px-5 md:py-1.5 rounded-full text-xs md:text-sm font-bold tracking-widest shadow-sm ${t('bg-[#C63C31] text-white', 'bg-red-900 text-red-100 border border-red-800')}`}>
                {loc.name}
              </span>
            </div>

            {/* 🔥 已加大字體：表頭 (路線 | 分鐘) */}
            <div className={`flex justify-between items-center px-4 md:px-6 py-1.5 md:py-2 border-b border-t text-sm md:text-base font-bold tracking-widest transition-colors ${t('bg-white border-gray-100 text-[#C63C31]', 'bg-[#111827] border-gray-800 text-red-500')}`}>
              <span>路線</span>
              <span>分鐘</span>
            </div>

            <div className="flex flex-col">
              {loc.routesData.map((route, index) => {
                const eta1 = route.etas[0] ? getCompactEta(route.etas[0].time) : null;
                const eta2 = route.etas[1] ? getCompactEta(route.etas[1].time) : null;
                
                // 白、淺粉紅相間底色
                const rowBg = index % 2 === 0 ? t('bg-white', 'bg-[#111827]') : t('bg-[#FCEAEF]', 'bg-[#2A1620]');

                const isLWB = route.route.startsWith('A') || route.route.startsWith('E') || route.route.startsWith('NA');
                const coName = route.etas[0]?.co === 'CTB' ? '城巴' : (isLWB ? '龍運' : '九巴');
                const coBadgeClass = route.etas[0]?.co === 'CTB' 
                  ? t('bg-blue-600 text-white', 'bg-blue-800 text-gray-100') 
                  : (isLWB ? t('bg-[#F7931E] text-white', 'bg-[#c47112] text-gray-100') : t('bg-[#E32636] text-white', 'bg-red-800 text-gray-100'));

                return (
                  <div key={`${route.route}-${index}`} className={`flex justify-between items-center px-3 md:px-5 py-1.5 md:py-2 border-b transition-colors duration-300 ${t('border-gray-50', 'border-gray-800/50')} ${rowBg}`}>
                    
                    {/* 左＋中 Wrapper */}
                    <div className="flex items-center flex-1 min-w-0 pr-2">
                      
                      {/* 左側：路線及標籤 */}
                      <div className="flex flex-col shrink-0 w-[45%] sm:w-[40%] max-w-[150px]">
                        <div className="flex items-start gap-1.5">
                          {/* 取消粗體字 */}
                          <span className={`text-[3.25rem] md:text-[4rem] leading-[0.8] tracking-tight ${t('text-black', 'text-white')}`}>
                            {route.route}
                          </span>
                          <span className={`px-1.5 py-[2px] rounded text-[8px] md:text-[9px] font-bold shadow-sm whitespace-nowrap self-start mt-1.5 ${coBadgeClass}`}>
                            {coName}
                          </span>
                        </div>
                        {/* 隱藏車站名稱，只顯示特殊備註 */}
                        {route.etas[0]?.rmk && (
                          <div className={`text-[9px] md:text-[11px] truncate leading-tight mt-1 pr-1 ${t('text-gray-500', 'text-gray-400')}`}>
                            {route.etas[0].rmk}
                          </div>
                        )}
                      </div>

                      {/* 中間：目的地 */}
                      <div className="flex-1 min-w-0 pl-1">
                        <div className={`text-[13px] md:text-base font-bold truncate tracking-tight ${t('text-[#2C3E50]', 'text-gray-300')}`}>
                          往 {route.dest}
                        </div>
                      </div>

                    </div>

                    {/* 右側：分鐘數 */}
                    <div className="flex flex-col items-end justify-center shrink-0 min-w-[50px]">
                      {eta1 && (
                        eta1.val < 0 ? (
                          <span className={`text-xl md:text-2xl tracking-tighter leading-[0.8] ${t('text-gray-400', 'text-gray-500')}`}>
                            已開出
                          </span>
                        ) : eta1.val === 0 ? (
                          <span className={`text-[2.75rem] md:text-[3.5rem] tracking-tighter leading-[0.8] ${t('text-[#C63C31]', 'text-red-500')}`}>
                            即將
                          </span>
                        ) : (
                          // 轉回純黑色數字，取消粗體
                          <span className={`text-[3rem] md:text-[4rem] tracking-tighter leading-[0.85] ${t('text-black', 'text-white')}`}>
                            {eta1.text}
                          </span>
                        )
                      )}
                      
                      {eta2 && (
                        <div className={`text-[11px] md:text-sm mt-1 tracking-tighter leading-none ${t('text-gray-500', 'text-gray-400')}`}>
                          {eta2.val < 0 ? '已開出' : eta2.text}
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </main>

      {/* 底部導航欄 */}
      <div className={`fixed bottom-0 w-full z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-colors duration-300 ${t('bg-[#CA3F32]', 'bg-gray-900 border-t border-gray-800')}`}>
        <div className="max-w-4xl mx-auto px-2 py-2 md:py-3 flex gap-2 overflow-x-auto scrollbar-hide items-center justify-start sm:justify-center">
          {TABS.map(tab => {
            const isActive = activeTab === tab;
            return (
               <button
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={`px-5 py-2 md:px-8 md:py-2.5 rounded-md md:rounded-lg text-sm md:text-base font-bold tracking-widest whitespace-nowrap transition-all duration-200 ${
                   isActive 
                     ? t('bg-white text-[#CA3F32] shadow-sm', 'bg-red-900 text-white shadow-sm border-transparent') 
                     : t('bg-transparent text-white border border-white/50 hover:bg-white/10', 'bg-transparent text-gray-400 border border-gray-700 hover:bg-gray-800')
                 }`}
               >
                 {tab}
               </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
