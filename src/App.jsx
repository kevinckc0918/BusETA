import React, { useState, useEffect, useCallback } from 'react';
import { Bus, RefreshCw, MapPin, AlertCircle, Navigation, Map, LocateFixed, Compass, Clock } from 'lucide-react';

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

  const LOCATIONS = [
    {
      ids: ["6386333EDAC64C96"], 
      region: "楊屋村",
      name: "楊屋村 (西行)",
      desc: "往 元朗市中心",
      routes: ['54', '64K', '251C', '76K', '77K', '68', '68F'],
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
      ids: ["C3D2F84C0F0FF415"],
      region: "灣仔",
      name: "菲林明道",
      desc: "往 元朗(西)",
      routes: ['968', 'N368'],
      lat: 22.2782, lng: 114.1738
    },
    {
      ids: ["E74202351AF7F37D"], 
      ctbIds: ["002430"], // 🔥 已更新為正確的盧押道城巴 ID
      region: "灣仔",
      name: "盧押道",
      desc: "往 寶達",
      routes: ['601'],
      lat: 22.2774, lng: 114.1711
    },
    {
      ids: ["04B6438688E12AC0"], 
      ctbIds: ["003039"], // 🔥 已更新為正確的祥和苑城巴 ID
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
          setTimeout(() => setActiveTab('灣仔'), 2000);
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
        // 1. 九巴 API
        const kmbFetches = (loc.ids || []).map(id => {
          return fetch(`https://data.etabus.gov.hk/v1/transport/kmb/stop-eta/${id}`)
            .then(res => res.ok ? res.json() : { data: [] })
            .catch(() => ({ data: [] }));
        });

        // 2. 城巴 API (需要 ID + Route)
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

  return (
    <div className="min-h-screen bg-gray-200 text-gray-800 font-sans pb-6">
      
      <header className="bg-red-600 p-3 shadow-md sticky top-0 z-20 flex justify-between items-center">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-2 text-white drop-shadow-sm">
            <Bus className="w-5 h-5 md:w-6 md:h-6" />
            <h1 className="text-lg md:text-xl font-bold tracking-wide text-white">楊屋村巴士到站</h1>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <span className="text-xs text-red-100 hidden md:inline-block font-medium">
              最後更新: {lastUpdated ? formatTime(lastUpdated) : '--:--'}
            </span>
            
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
              
              <div className="bg-gray-100 border-b border-gray-200 px-3 md:px-4 py-2.5 md:py-3 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-500" />
                <h2 className="font-bold text-gray-800 text-lg md:text-xl">{loc.name}</h2>
                <span className="text-xs md:text-sm text-gray-500 ml-auto bg-gray-200/80 px-2.5 py-1 rounded-md flex items-center gap-1 font-bold">
                  {loc.distance ? `${loc.distance.toFixed(1)} km` : loc.desc}
                </span>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 landscape:grid-cols-4 gap-2 md:gap-3 p-2 md:p-4 bg-gray-50">
                {loc.routesData.map((route, rIdx) => {
                  const hasAnyRmk = route.etas.some(e => e.rmk);

                  return (
                    <div key={rIdx} className="bg-white p-2 md:p-3 rounded-lg md:rounded-xl border border-gray-200 shadow-sm hover:border-red-300 transition-colors flex flex-col gap-2 md:gap-3">
                      
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <span className="bg-red-600 text-white font-black px-2 py-1 md:px-2.5 md:py-1 rounded-md text-sm md:text-base lg:text-lg min-w-[2.5rem] md:min-w-[3rem] text-center shadow-sm tracking-wide">
                          {route.route}
                        </span>
                        <Navigation className="w-3.5 h-3.5 md:w-5 md:h-5 text-gray-300 shrink-0 hidden sm:block" />
                        <span className="font-bold text-gray-800 text-sm md:text-base lg:text-lg truncate flex-1 tracking-tight">
                          {route.dest}
                        </span>
                      </div>

                      <div className="flex gap-1.5 md:gap-2 w-full h-[60px] md:h-[80px] lg:h-[90px]">
                        {route.etas.map((eta, eIdx) => {
                          const etaData = getCompactEta(eta.time);
                          const mins = etaData.val;
                          
                          let boxStyle = 'bg-gray-50 border-gray-200 text-gray-400';
                          let textStyle = 'text-gray-600';

                          if (mins >= 0 && mins <= 5) {
                            boxStyle = 'bg-red-50 border-red-200 shadow-sm';
                            textStyle = 'text-red-600';
                          } else if (mins > 5 && mins <= 10) {
                            boxStyle = 'bg-amber-50 border-amber-200 shadow-sm';
                            textStyle = 'text-amber-600';
                          }

                          return (
                            <div 
                              key={eIdx}
                              className={`flex-1 flex flex-col items-center justify-center rounded-md border ${boxStyle} overflow-hidden transition-all duration-300 relative`}
                            >
                              {hasAnyRmk && eta.rmk && (
                                <div className="absolute top-1 w-full flex justify-center px-1">
                                  <span className={`text-[8px] md:text-[9px] font-bold px-1 rounded-sm truncate max-w-full ${
                                    eta.co === 'CTB' ? 'text-blue-600 bg-blue-100/90' : 'text-red-600 bg-red-100/90'
                                  }`}>
                                    {eta.rmk}
                                  </span>
                                </div>
                              )}

                              <span className={`${showDetailedTime ? 'text-2xl md:text-3xl' : 'text-4xl md:text-5xl lg:text-[4rem]'} font-black leading-none tracking-tighter ${textStyle} transition-all duration-300 ${!showDetailedTime ? 'h-full flex items-center justify-center' : ''}`}>
                                {etaData.text}
                              </span>
                              
                              {showDetailedTime && (
                                <span className="text-[10px] md:text-xs text-gray-400 leading-none mt-1 font-medium transition-all duration-300">
                                  {formatTime(eta.time)}
                                </span>
                              )}
                            </div>
                          );
                        })}
                        
                        {Array.from({ length: Math.max(0, 2 - route.etas.length) }).map((_, i) => (
                          <div key={`empty-${i}`} className="flex-1 flex items-center justify-center rounded-md border border-dashed border-gray-200 bg-gray-50/50">
                            <span className="text-gray-300 text-sm">-</span>
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
