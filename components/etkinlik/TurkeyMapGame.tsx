"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { MapPoint, MapTopic } from "@/lib/mapData";
import { Check, RefreshCw, X, Trophy, Target, Play } from "lucide-react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { geoMercator, geoCentroid } from "d3-geo";
import { motion, AnimatePresence } from "framer-motion";

const GEO_URL = "/turkey-topo.json";

const MAP_CENTER: [number, number] = [35.2, 39.0];
const MAP_SCALE = 3000;
const VIEW_W = 1200;
const VIEW_H = 550;

function lngLatToPercent(lng: number, lat: number): { x: number; y: number } {
  const projection = geoMercator()
    .center(MAP_CENTER)
    .scale(MAP_SCALE)
    .translate([VIEW_W / 2, VIEW_H / 2]);
  const [px, py] = projection([lng, lat]) ?? [0, 0];
  return { x: (px / VIEW_W) * 100, y: (py / VIEW_H) * 100 };
}

// ── Type visuals ──
const TYPE_VISUALS: Record<string, { bg: string; border: string; text: string; glow: string; icon: string }> = {
  tektonik: { bg: "bg-[#1cb0f6]", border: "border-[#1899d6]", text: "text-[#1899d6]", glow: "shadow-blue-500/40", icon: "💥" },
  karstik: { bg: "bg-[#2bced6]", border: "border-[#20aeb5]", text: "text-[#20aeb5]", glow: "shadow-cyan-500/40", icon: "💧" },
  volkanik: { bg: "bg-[#ff4b4b]", border: "border-[#e04343]", text: "text-[#e04343]", glow: "shadow-red-500/40", icon: "🌋" },
  heyelan: { bg: "bg-[#ff9600]", border: "border-[#e08400]", text: "text-[#e08400]", glow: "shadow-orange-500/40", icon: "🪨" },
  aluvyal: { bg: "bg-[#58cc02]", border: "border-[#46a302]", text: "text-[#46a302]", glow: "shadow-emerald-500/40", icon: "🌿" },
  kiyi: { bg: "bg-[#00c1ac]", border: "border-[#00a392]", text: "text-[#00a392]", glow: "shadow-teal-500/40", icon: "🏖️" },
  karma: { bg: "bg-[#ce82ff]", border: "border-[#b16be0]", text: "text-[#b16be0]", glow: "shadow-purple-500/40", icon: "🔄" },
  kivrim: { bg: "bg-[#8965f0]", border: "border-[#6f50c8]", text: "text-[#6f50c8]", glow: "shadow-indigo-500/40", icon: "〰️" },
  kirik: { bg: "bg-[#ffc800]", border: "border-[#e0b000]", text: "text-[#e0b000]", glow: "shadow-yellow-500/40", icon: "⚡" },
  plato: { bg: "bg-[#58cc02]", border: "border-[#46a302]", text: "text-[#46a302]", glow: "shadow-lime-600/40", icon: "🌄" },
  tabaka: { bg: "bg-[#ff9600]", border: "border-[#e08400]", text: "text-[#e08400]", glow: "shadow-orange-500/40", icon: "🥞" },
  lav: { bg: "bg-[#ff4b4b]", border: "border-[#e04343]", text: "text-[#e04343]", glow: "shadow-red-500/40", icon: "🌋" },
  asinim: { bg: "bg-[#8965f0]", border: "border-[#6f50c8]", text: "text-[#6f50c8]", glow: "shadow-indigo-500/40", icon: "💨" },
  delta: { bg: "bg-[#58cc02]", border: "border-[#46a302]", text: "text-[#46a302]", glow: "shadow-emerald-500/40", icon: "🌱" },
  kiyiduzlugu: { bg: "bg-[#2bced6]", border: "border-[#20aeb5]", text: "text-[#20aeb5]", glow: "shadow-cyan-500/40", icon: "🏖️" },
  buzul: { bg: "bg-[#7dd3fc]", border: "border-[#38bdf8]", text: "text-[#0ea5e9]", glow: "shadow-sky-300/40", icon: "🧊" },
  traverten: { bg: "bg-[#d6d3d1]", border: "border-[#a8a29e]", text: "text-[#78716c]", glow: "shadow-stone-300/40", icon: "🧱" },
  baraj: { bg: "bg-[#475569]", border: "border-[#334155]", text: "text-[#334155]", glow: "shadow-slate-500/40", icon: "🏗️" },
};

const TYPE_LABELS: Record<string, string> = {
  tektonik: "Tektonik",
  karstik: "Karstik",
  volkanik: "Volkanik",
  heyelan: "Heyelan Set",
  aluvyal: "Alüvyal Set",
  kiyi: "Kıyı Set",
  karma: "Karma Yapılı",
  kivrim: "Kıvrım",
  kirik: "Kırık",
  plato: "Plato",
  tabaka: "Tabaka Düzü",
  lav: "Lav",
  asinim: "Aşınım",
  delta: "Delta Ovası",
  kiyiduzlugu: "Kıyı Düzlüğü Ovası",
  buzul: "Buzul (Sirk)",
  traverten: "Traverten Set",
  baraj: "Yapay Baraj",
};

function getTypeVisual(type: string) {
  return TYPE_VISUALS[type] ?? { bg: "bg-slate-500", border: "border-slate-400", text: "text-slate-600", glow: "shadow-slate-500/40", icon: "📌" };
}

function formatName(name: string) {
  return name.replace(/\s+(Dağları|Dağı|Dağ)\s*$/i, "");
}

// ── Progress Bar ──
function ProgressBar({ progress, total }: { progress: number; total: number }) {
  const pct = total > 0 ? (progress / total) * 100 : 0;
  
  return (
    <div className="flex-1 max-w-2xl mx-auto h-4 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden flex">
      <motion.div 
        className="h-full bg-[#58cc02] rounded-full relative"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <div className="absolute top-1 left-2 right-2 h-1 bg-white/30 rounded-full" />
      </motion.div>
    </div>
  );
}

// ── Clickable Spot ──
function ClickableSpot({ 
  lake, placed, isError, isActiveTarget, onClick, showHint 
}: { 
  lake: MapPoint; placed: boolean; isError: boolean; isActiveTarget: boolean; onClick: () => void; showHint?: boolean 
}) {
  const pos = useMemo(() => lngLatToPercent(lake.lng, lake.lat), [lake.lng, lake.lat]);
  const c = getTypeVisual(lake.type);

  if (placed) {
    return (
      <div
        key="placed"
        className="absolute flex flex-col items-center group hover:z-[60] cursor-pointer"
        style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)", zIndex: 20 }}
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          whileHover={{ scale: 1.15 }}
          className={`px-2 py-1 rounded-xl text-[10px] md:text-xs font-black shadow-sm flex flex-col items-center
            ${c.bg} text-white border-b-4 ${c.border} whitespace-nowrap`}
        >
          <div className="flex items-center gap-1">
            <span className="text-[14px]">{c.icon}</span>
            <span>{formatName(lake.name)}</span>
          </div>
          {lake.type === "karma" && lake.description && (
            <span className="text-[8px] font-bold opacity-90 -mt-0.5">{lake.description}</span>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div
      key="unplaced"
      className={`absolute flex flex-col items-center group cursor-pointer ${showHint && isActiveTarget ? 'z-[60]' : 'z-40'}`}
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)" }}
      onClick={onClick}
    >
      <motion.div
        animate={isError ? { x: [-6, 6, -6, 6, 0] } : (showHint && isActiveTarget ? { scale: [1, 1.4, 1] } : { scale: 1 })}
        transition={isError ? { duration: 0.4 } : (showHint && isActiveTarget ? { repeat: Infinity, duration: 1.5 } : { type: "spring", stiffness: 400, damping: 15 })}
        whileHover={{ scale: 1.2 }}
        className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-all border-b-[4px] shadow-sm
          ${isError
            ? `bg-[#ff4b4b] border-[#e04343] text-white`
            : showHint && isActiveTarget
              ? `bg-[#ffc800] border-[#e0b000] text-white ring-4 ring-[#ffc800]/50`
              : `bg-white dark:bg-slate-800 text-slate-400 border-gray-300 dark:border-slate-500 hover:border-[#1899d6] hover:bg-[#1cb0f6] hover:text-white`
          }`}
      >
        <div className={`w-2.5 h-2.5 rounded-full ${isError || (showHint && isActiveTarget) ? 'bg-white' : 'bg-gray-300 dark:bg-slate-500 group-hover:bg-white'}`} />
      </motion.div>
    </div>
  );
}

// ── Main Component ──
export default function TurkeyMapGame({ topic, onQuit }: { topic: MapTopic, onQuit?: () => void }) {
  const [placedItems, setPlacedItems] = useState<Record<string, boolean>>({});
  const [shuffledPoints, setShuffledPoints] = useState<MapPoint[]>([]);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [showHint, setShowHint] = useState(false);

  const initGame = useCallback(() => {
    // Karmaşık (rastgele) sıra
    setShuffledPoints([...topic.points].sort(() => Math.random() - 0.5));
    setPlacedItems({});
    setErrorId(null);
    setFailCount(0);
    setShowHint(false);
    setIsStarted(true);
  }, [topic]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const progress = Object.keys(placedItems).length;
  const total = topic.points.length;
  const isComplete = progress === total && total > 0;

  // Sıradaki ilk yerleştirilmemiş öğe aktif sorudur
  const activePoint = shuffledPoints.find(p => !placedItems[p.id]);
  const activeVisual = activePoint ? getTypeVisual(activePoint.type) : null;

  const handleSpotClick = (spotId: string) => {
    if (!activePoint || placedItems[spotId]) return;

    if (spotId === activePoint.id) {
      // Doğru
      setPlacedItems(prev => ({ ...prev, [spotId]: true }));
      setErrorId(null);
      setFailCount(0);
      setShowHint(false);
      // Play ding sound conceptually
    } else {
      // Yanlış
      setErrorId(spotId);
      setFailCount(prev => prev + 1);
      setTimeout(() => setErrorId(null), 600);
    }
  };

  return (
    <div className="flex flex-col w-full h-full relative">

      {/* ── Game Header ── */}
      <div className="flex items-center gap-4 py-4 px-4 sm:px-8 w-full max-w-5xl mx-auto z-10">
        <button 
          onClick={onQuit}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
        >
          <X className="w-8 h-8" />
        </button>
        <ProgressBar progress={progress} total={total} />
        <div className="w-8 h-8 flex items-center justify-center font-black text-gray-400">
          {progress}/{total}
        </div>
      </div>

      {/* ── Map Content ── */}
      <div className="flex-1 w-full overflow-hidden flex flex-col items-center justify-center relative z-0 pb-32">
        
        <div 
          className="relative w-full h-full flex items-center justify-center" 
          style={{ 
            maxHeight: "calc(100vh - 200px)", 
          }}
        >
          <div className="relative w-full" style={{ aspectRatio: `${VIEW_W}/${VIEW_H}`, maxHeight: "100%", maxWidth: "100%" }}>
          <ComposableMap
              width={VIEW_W} height={VIEW_H}
              projection="geoMercator"
              projectionConfig={{ center: MAP_CENTER, scale: MAP_SCALE }}
              style={{ width: "100%", height: "100%" }}
            >
              <defs>
                <linearGradient id="mapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#e5e7eb" />
                  <stop offset="100%" stopColor="#d1d5db" />
                </linearGradient>
              </defs>
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map(geo => {
                    const centroid = geoCentroid(geo);
                    return (
                      <g key={geo.rsmKey}>
                        <Geography
                          geography={geo}
                          fill="url(#mapGrad)"
                          stroke="#ffffff"
                          strokeWidth={0.8}
                          style={{
                            default: { outline: "none" },
                            hover: { fill: "#d1d5db", outline: "none", transition: "fill 0.2s" },
                            pressed: { outline: "none" },
                          }}
                        />
                        <Marker coordinates={centroid} className="pointer-events-none">
                          <text
                            textAnchor="middle"
                            y={3}
                            style={{ fontSize: "10px", fill: "rgba(107, 114, 128, 0.5)", fontWeight: 800, userSelect: "none" }}
                          >
                            {geo.properties.name}
                          </text>
                        </Marker>
                      </g>
                    );
                  })
                }
              </Geographies>
            </ComposableMap>

            <div className="absolute inset-0">
              {topic.points.map((point) => (
                <ClickableSpot
                  key={point.id}
                  lake={point}
                  placed={!!placedItems[point.id]}
                  isError={errorId === point.id}
                  isActiveTarget={activePoint?.id === point.id}
                  showHint={showHint}
                  onClick={() => handleSpotClick(point.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Drawer / Floating Card ── */}
      <AnimatePresence mode="wait">
        {!isComplete && activePoint && activeVisual && (
          <motion.div
            key={activePoint.id}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0, y: 20, transition: { duration: 0.2 } }}
            className="fixed bottom-0 left-0 w-full z-50 pointer-events-auto border-t-2 border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900"
          >
            <div className="max-w-4xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-6">
              
              <div className="flex items-center gap-6">
                <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center text-4xl shadow-sm ${activeVisual.bg} border-b-4 ${activeVisual.border} text-white`}>
                  {activeVisual.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black uppercase tracking-widest text-slate-400 mb-1">
                    Hedefini Bul
                  </span>
                  <div className="flex flex-col">
                    <h3 className={`text-3xl font-black ${activeVisual.text}`}>
                      {formatName(activePoint.name)}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:items-end">
                {failCount >= 3 && !showHint ? (
                  <button
                    onClick={() => setShowHint(true)}
                    className="px-6 py-3 rounded-2xl bg-[#ffc800] text-white font-black uppercase tracking-widest text-sm border-b-4 border-[#e0b000] hover:-translate-y-1 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2"
                  >
                    💡 İPUCU İSTER MİSİN?
                  </button>
                ) : (
                  <div className="flex flex-col items-center sm:items-end gap-1">
                    <div className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 font-bold text-slate-500 uppercase tracking-widest text-xs border-2 border-slate-200 dark:border-slate-700">
                      {TYPE_LABELS[activePoint.type] || `${activePoint.type} Türü`}
                    </div>
                    {activePoint.type === "karma" && activePoint.description && (
                      <span className={`text-xs font-bold opacity-80 ${activeVisual.text}`}>
                        ({activePoint.description})
                      </span>
                    )}
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Completion Modal ── */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-0 left-0 w-full z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t-2 border-gray-200 dark:border-slate-800 p-6 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.1)]"
          >
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
              
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-[#58cc02] rounded-[1.5rem] border-b-[6px] border-[#46a302] flex items-center justify-center animate-bounce shrink-0">
                  <Trophy className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-[#58cc02] mb-1">Harika İş Çıkardın!</h2>
                  <p className="text-slate-500 font-bold">
                    Tüm şekilleri yerleştirdin. Haritayı inceleyebilir veya devam edebilirsin.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full md:w-auto">
                <button
                  onClick={onQuit}
                  className="w-full md:w-auto px-8 py-4 rounded-2xl font-black text-[#1cb0f6] text-lg border-2 border-[#1cb0f6] bg-white hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  Kategorilere Dön
                </button>
                <button
                  onClick={initGame}
                  className="w-full md:w-auto px-8 py-4 rounded-2xl font-black text-white text-lg bg-[#1cb0f6] border-b-4 border-[#1899d6] hover:bg-[#1899d6] hover:border-[#1cb0f6] hover:translate-y-1 active:border-b-0 active:translate-y-2 transition-all flex items-center justify-center gap-2"
                >
                  Yeniden Oyna
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
