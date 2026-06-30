import React, { useState, useEffect, useCallback } from 'react';
import { Bus, RefreshCw, MapPin, AlertCircle, Navigation, Map, LocateFixed, Compass, Clock, Search, Copy, X } from 'lucide-react';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [locationsData, setLocationsData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  
  const [activeTab, setActiveTab] = useState('附近');
  const [userLocation, setUserLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  
  const [showDetailedTime, setShowDetailedTime] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

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
      name: "元朗廣場 (青山公路)",
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
      name: "大欖隧道轉車站 (B1)",
      desc: "往 元朗公園 (北行)",
      routes: ['68E'],
      lat: 22.4176, lng: 114.0622
    },
    {
      ids: ["211D93217331B040"],
      region: "大欖隧道",
      name: "大欖隧道轉車站 (A3)",
      desc: "往 港島 (南行)",
      routes: ['968', 'N368'],
      lat: 22.4177, lng: 114.0627
    },
    {
      ids: ["C3D2F84C0F0FF415", "CC1A19B90FFC1703"], 
      region: "灣仔",
      name: "菲林明道",
      desc: "往 元朗(西)",
      routes: ['968', 'P968', 'N368'], 
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

  const REGIONS = ['附近', '楊屋村', '元朗西', '大欖隧道', '灣仔', '觀塘'];

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
        setGpsError('您的瀏覽器不支援定位功能');
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
          console.error(err);
          setGpsError('無法獲取位置，請允許瀏覽器定位權限');
          setLocating(false);
          setTimeout(() => setActiveTab('楊屋村'), 2000);
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

        return {
          ...loc,
          routesData: routesList
        };
      });

      setLocationsData(processedData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError('獲取數據失敗，請檢查網絡。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const getCompactEta = (etaDate) => {
    const now = new Date();
    const diffMs = etaDate - now;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 0) return { text: '已走', val: -1 }; 
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
        .map(loc => ({
          ...loc,
          distance: getDistance(userLocation.lat, userLocation.lng, loc.lat, loc.lng)
        }))
        .filter(loc => loc.distance < 5) 
        .sort((a, b) => a.distance - b.distance); 
    }
  } else {
    displayLocations = locationsData.filter(loc => loc.region === activeTab);
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
            return {
              co: 'KMB',
              dir: s.bound === 'O' ? '去程' : '回程',
              seq: s.seq,
              id: s.stop,
              name: detail.data?.name_tc || '未知站名'
            };
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
            return {
              co: 'CTB',
              dir: s.dir === 'O' ? '去程' : '回程',
              seq: s.seq,
              id: s.stop,
              name: detail.data?.name_tc || '未知站名'
            };
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
        console.error(err);
        alert("搜尋失敗，請檢查網絡或路線是否存在");
      } finally {
        setFetching(false);
      }
    };

    const copyToClipboard = (id, co) => {
      navigator.clipboard.writeText(id);
      alert(`已複製 ${co} ID: ${id}`);
    };

    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
        <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
          
          <div className="bg-gray-100 border-b border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
              <h2 className="text-lg md:text-xl font-bold text-gray-800 tracking-wide">全能路線尋站系統</h2>
            </div>
            <button 
              onClick={() => setShowSearchModal(false)}
              className="p-1.5 bg-gray-200 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors"
            >
              <X className="w-5 h-5 md:w-6 md:h-6" />
            </button>
          </div>

          <div className="p-4 md:p-6 flex flex-col flex-1 overflow-hidden">
            <p className="text-sm text-gray-500 mb-4">
              請輸入路線（例如：601、A36），系統會搵出沿線所有九巴及城巴車站嘅真實 ID。
            </p>
            
            <div className="flex gap-2 mb-4 shrink-0">
              <input 
                type="text" 
                value={routeInput}
                onChange={(e) => setRouteInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && searchRoute()}
                placeholder="輸入巴士路線..."
                className="border border-gray-300 rounded-lg px-4 py-2.5 flex-1 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 text-lg font-bold"
              />
              <button 
                onClick={searchRoute}
                disabled={fetching}
                className="bg-red-600 text-white px-5 md:px-8 py-2.5 rounded-lg font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:bg-red-300 whitespace-nowrap shadow-sm"
              >
                {fetching ? <RefreshCw className="w-5 h-5 animate-spin" /> : '搜尋'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
              {fetching && (
                <div className="py-12 text-center text-gray-500 flex flex-col items-center justify-center h-full">
                  <RefreshCw className="w-10 h-10 animate-spin mb-3 text-red-500" />
                  <p className="font-medium">正在連線巴士公司伺服器...</p>
                </div>
              )}
              
              {!fetching && stops.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-4">
                  {stops.map(stop => (
                    <div key={`${stop.co}-${stop.dir}-${stop.seq}`} className={`p-3 rounded-lg border flex flex-col justify-between transition-colors shadow-sm ${stop.co === 'KMB' ? 'bg-red-50 border-red-100 hover:border-red-300' : 'bg-blue-50 border-blue-100 hover:border-blue-300'}`}>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${stop.co === 'KMB' ? 'bg-red-600' : 'bg-blue-600'}`}>
                            {stop.co}
                          </span>
                          <span className={`text-xs font-bold bg-white px-1.5 py-0.5 rounded border ${stop.co === 'KMB' ? 'text-red-700 border-red-200' : 'text-blue-700 border-blue-200'}`}>
                            {stop.dir} - #{stop.seq}
                          </span>
                        </div>
                        <h3 className="font-bold text-base text-gray-800 mt-2 leading-tight">{stop.name}</h3>
                      </div>
                      <div className={`mt-4 flex items-center justify-between bg-white px-2 py-1.5 rounded border shadow-sm ${stop.co === 'KMB' ? 'border-red-200' : 'border-blue-200'}`}>
                        <code className={`text-sm font-mono font-bold ${stop.co === 'KMB' ? 'text-red-800' : 'text-blue-800'}`}>{stop.id}</code>
                        <button 
                          onClick={() => copyToClipboard(stop.id, stop.co)}
                          className={`px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1 transition-colors ${stop.co === 'KMB' ? 'bg-red-100 hover:bg-red-200 text-red-700' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'}`}
                        >
                          <Copy className="w-3 h-3" /> 複製
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {!fetching && stops.length === 0 && routeInput && (
                <div className="py-12 text-center text-gray-400 h-full flex flex-col items-center justify-center">
                  <Bus className="w-12 h-12 opacity-20 mb-3" />
                  <p>搵唔到資料，請確認路線是否正確。</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-800 font-sans pb-6">
      
      {showSearchModal && <SearchModal />}

      <header className="bg-red-600 p-3 shadow-md sticky top-0 z-20 flex justify-between items-center">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-2 text-white drop-shadow-sm">
            <Bus className="w-5 h-5 md:w-6 md:h-6" />
            <h1 className="text-lg md:text-xl font-bold tracking-wide text-white">楊屋村巴士到站</h1>
          </div>
          <div className="flex items-center gap-1.5 md:gap-3">
            <span className="text-xs text-red-100 hidden md:inline-block font-medium">
              最後更新: {lastUpdated ? formatTime(lastUpdated) : '--:--'}
            </span>
            
            <button 
              onClick={() => setShowSearchModal(true)} 
              className="p-1.5 md:p-2 rounded-full text-white bg-red-500/50 hover:bg-red-500 transition-colors"
              title="搜尋車站 ID"
            >
              <Search className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            <button 
              onClick={() => setShowDetailedTime(!showDetailedTime)} 
              className={`p-1.5 md:p-2 rounded-full transition-colors flex items-center gap-1 ${showDetailedTime ? 'bg-red-800 text-white shadow-inner' : 'text-white bg-red-500/50 hover:bg-red-500'}`}
              title="切換確實時間"
            >
              <Clock className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            <button 
              onClick={fetchData} 
              disabled={loading}
              className="p-1.5 md:p-2 rounded-full text-white hover:bg-red-500 transition-colors bg-red-500/50"
            >
              <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-[56px] md:top-[64px] z-10 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-2 py-2 flex gap-2 whitespace-nowrap scrollbar-hide">
          {REGIONS.map(region => (
            <button
              key={region}
              onClick={() => setActiveTab(region)}
              className={`px-4 py-2.5 rounded-full text-sm md:text-base font-bold flex items-center gap-1.5 transition-all ${
                activeTab === region 
                  ? 'bg-red-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {region === '附近' ? <LocateFixed className="w-4 h-4" /> : <Map className="w-4 h-4" />}
              {region}
            </button>
          ))}
        </div>
      </div>

      <main className="w-full max-w-7xl mx-auto p-2 md:p-4 space-y-4">
        
        {error && (
          <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-start gap-2 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {activeTab === '附近' && (
          <div className="mb-2">
            {locating && (
              <div className="flex items-center justify-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg text-sm">
                <Compass className="w-4 h-4 animate-spin" /> 正在獲取您的位置...
              </div>
            )}
            {gpsError && (
              <div className="flex items-center justify-center gap-2 text-orange-600 bg-orange-50 p-3 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4" /> {gpsError}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-4">
          
          {!loading && !locating && visibleLocations.length === 0 && (
            <div className="py-20 text-center text-gray-400 flex flex-col items-center justify-center bg-white rounded-xl shadow-sm border border-gray-200">
              <Bus className="w-12 h-12 opacity-20 mb-3" />
              <p className="text-lg font-medium text-gray-500">
                {activeTab === '附近' && userLocation ? '附近 5 公里內沒有設定的車站，或暫無班次' : '該地區目前無即將到站班次'}
              </p>
              <p className="text-sm mt-1">可能是非服務時間，請切換地區或稍後再試</p>
            </div>
          )}

          {visibleLocations.map((loc, locIdx) => (
            <div key={locIdx} className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
              
              <div className="bg-gray-50 border-b border-gray-200 px-3 md:px-4 py-2.5 md:py-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 md:w-5 md:h-5 text-red-500" />
                <h2 className="font-bold text-gray-800 text-base md:text-xl">{loc.name}</h2>
                <span className="text-[10px] md:text-sm text-gray-500 ml-auto bg-gray-200/80 px-2 py-1 md:px-2.5 rounded-md flex items-center gap-1 font-bold">
                  {loc.distance ? `${loc.distance.toFixed(1)} km` : loc.desc}
                </span>
              </div>

              {/* 🔥 關鍵修改：強制 portrait (直向) 時 2 格，landscape (橫向) 或 lg 以上時 4 格 */}
              <div className="grid grid-cols-2 portrait:grid-cols-2 landscape:grid-cols-4 lg:grid-cols-4 gap-2 md:gap-4 p-2 md:p-4 bg-white">
                {loc.routesData.map((route, rIdx) => {
                  const hasAnyRmk = route.etas.some(e => e.rmk);

                  const isLWB = route.route.startsWith('A') || route.route.startsWith('E') || route.route.startsWith('NA');
                  const routeBadgeColor = route.etas[0]?.co === 'CTB' ? 'bg-blue-600' : (isLWB ? 'bg-orange-500' : 'bg-red-600');

                  return (
                    <div key={rIdx} className="bg-white p-1.5 md:p-3 rounded-lg md:rounded-xl border border-gray-200 shadow-sm hover:border-red-300 transition-colors flex flex-col gap-1.5 md:gap-3">
                      
                      {/* 🔥 橫向螢幕微調：目的地文字唔好太大避免截斷 */}
                      <div className="flex items-center gap-1 md:gap-2 mb-0.5">
                        <span className={`text-white font-black px-1.5 py-0.5 md:px-3 md:py-1 rounded text-xs portrait:text-sm landscape:text-xs md:text-xl min-w-[2.2rem] md:min-w-[4rem] text-center shadow-sm tracking-wide ${routeBadgeColor}`}>
                          {route.route}
                        </span>
                        <Navigation className="w-3.5 h-3.5 md:w-5 md:h-5 text-gray-300 shrink-0 hidden sm:block" />
                        <span className="font-bold text-gray-700 text-[11px] portrait:text-[13px] landscape:text-[11px] md:text-xl truncate flex-1 tracking-tight">
                          {route.dest}
                        </span>
                      </div>

                      {/* 🔥 橫向螢幕微調：方格高度稍微縮減 */}
                      <div className="flex gap-1 md:gap-3 w-full h-[60px] portrait:h-[65px] landscape:h-[55px] sm:h-[70px] md:h-[100px] lg:h-[110px]">
                        {route.etas.map((eta, eIdx) => {
                          const etaData = getCompactEta(eta.time);
                          const mins = etaData.val;
                          
                          let boxStyle = 'bg-white border-gray-200';
                          let textStyle = 'text-slate-600';

                          if (mins >= 0 && mins <= 5) {
                            boxStyle = 'bg-red-50/80 border-red-100 shadow-sm';
                            textStyle = 'text-red-600';
                          } else if (mins > 5 && mins <= 10) {
                            boxStyle = 'bg-amber-50 border-amber-100 shadow-sm';
                            textStyle = 'text-amber-600';
                          }

                          const isText = isNaN(etaData.text);
                          // 🔥 橫向螢幕微調：字體縮細少少，確保一行四個都塞得落
                          const giantClass = isText 
                            ? 'text-[1.5rem] portrait:text-[1.6rem] landscape:text-[1.3rem] sm:text-[1.8rem] md:text-[3rem] lg:text-[3.5rem]' 
                            : 'text-[3.2rem] portrait:text-[3.5rem] landscape:text-[2.8rem] sm:text-[4rem] md:text-[5.5rem] lg:text-[6.8rem]';

                          return (
                            <div 
                              key={eIdx}
                              className={`flex-1 flex flex-col items-center justify-center rounded-md border ${boxStyle} overflow-hidden transition-all duration-300 relative`}
                            >
                              {hasAnyRmk && eta.rmk && (
                                <div className="absolute top-0.5 md:top-1 w-full flex justify-center px-1 z-10">
                                  <span className={`text-[7px] md:text-[9px] font-bold px-1 py-0.5 rounded-sm truncate max-w-full ${
                                    eta.co === 'CTB' ? 'text-blue-600 bg-blue-100/90' : 'text-red-600 bg-red-100/90'
                                  }`}>
                                    {eta.rmk}
                                  </span>
                                </div>
                              )}

                              <div className={`flex items-center justify-center w-full transition-all duration-300 ${!showDetailedTime ? 'h-full' : 'mt-1 flex-1'}`}>
                                <span 
                                  className={`${showDetailedTime ? 'text-lg portrait:text-xl landscape:text-base md:text-3xl leading-none' : `${giantClass} leading-[0.85]`} tracking-tighter ${textStyle} transition-all duration-300`}
                                  style={{ 
                                    fontFamily: '"Arial Black", Impact, "PingFang HK", "Microsoft JhengHei", sans-serif',
                                    fontWeight: 900 
                                  }}
                                >
                                  {etaData.text}
                                </span>
                              </div>
                              
                              {showDetailedTime && (
                                <span className="text-[9px] md:text-sm text-gray-400 leading-none mb-1 md:mb-2 font-medium transition-all duration-300">
                                  {formatTime(eta.time)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                        
                        {Array.from({ length: Math.max(0, 2 - route.etas.length) }).map((_, i) => (
                          <div key={`empty-${i}`} className="flex-1 flex items-center justify-center rounded-md border border-gray-100 bg-white">
                            <span className="text-gray-200 text-sm">-</span>
                          </div>
                        ))}
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
