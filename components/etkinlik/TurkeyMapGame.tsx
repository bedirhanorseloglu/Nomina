"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { MapPoint, MapTopic } from "@/lib/mapData";
import { Check, RefreshCw, MapPin, Trophy, Target, Play } from "lucide-react";
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
  tektonik: { bg: "bg-blue-500", border: "border-blue-400", text: "text-blue-100", glow: "shadow-blue-500/40", icon: "🌊" },
  karstik: { bg: "bg-cyan-500", border: "border-cyan-400", text: "text-cyan-100", glow: "shadow-cyan-500/40", icon: "💧" },
  volkanik: { bg: "bg-red-500", border: "border-red-400", text: "text-red-100", glow: "shadow-red-500/40", icon: "🌋" },
  heyelan: { bg: "bg-amber-500", border: "border-amber-400", text: "text-amber-100", glow: "shadow-amber-500/40", icon: "🪨" },
  aluvyal: { bg: "bg-emerald-500", border: "border-emerald-400", text: "text-emerald-100", glow: "shadow-emerald-500/40", icon: "🌿" },
  kiyi: { bg: "bg-teal-500", border: "border-teal-400", text: "text-teal-100", glow: "shadow-teal-500/40", icon: "🏖️" },
  karma: { bg: "bg-purple-500", border: "border-purple-400", text: "text-purple-100", glow: "shadow-purple-500/40", icon: "🔄" },
  kivrim: { bg: "bg-indigo-500", border: "border-indigo-400", text: "text-indigo-100", glow: "shadow-indigo-500/40", icon: "〰️" },
  kirik: { bg: "bg-orange-500", border: "border-orange-400", text: "text-orange-100", glow: "shadow-orange-500/40", icon: "⚡" },
  plato: { bg: "bg-lime-600", border: "border-lime-500", text: "text-lime-100", glow: "shadow-lime-600/40", icon: "🌄" },
};

function getTypeVisual(type: string) {
  return TYPE_VISUALS[type] ?? { bg: "bg-slate-500", border: "border-slate-400", text: "text-slate-100", glow: "shadow-slate-500/40", icon: "📌" };
}

function formatName(name: string) {
  return name.replace(/\s+(Dağları|Dağı|Dağ|Gölü|Göl)\s*$/i, "");
}

// ── Progress Ring ──
function ProgressRing({ progress, total }: { progress: number; total: number }) {
  const pct = total > 0 ? (progress / total) * 100 : 0;
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 52 52">
        <circle cx="26" cy="26" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-200 dark:text-slate-700" />
        <motion.circle
          cx="26" cy="26" r={r} fill="none"
          stroke="url(#progressGrad)" strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-black text-slate-800 dark:text-white leading-none">{progress}</span>
        <span className="text-[8px] font-bold text-slate-400">/ {total}</span>
      </div>
    </div>
  );
}

// ── Clickable Spot ──
function ClickableSpot({ 
  lake, placed, isError, isActiveTarget, onClick 
}: { 
  lake: MapPoint; placed: boolean; isError: boolean; isActiveTarget: boolean; onClick: () => void 
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
          className={`px-1.5 py-0.5 rounded text-[9px] md:text-[10px] font-bold shadow-sm flex items-center gap-1
            ${c.bg} text-white border border-white/20 whitespace-nowrap`}
        >
          <span className="text-[12px]">{c.icon}</span>
          <span>{formatName(lake.name)}</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      key="unplaced"
      className="absolute flex flex-col items-center group cursor-pointer"
      style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%, -50%)", zIndex: 40 }}
      onClick={onClick}
    >
      <motion.div
        animate={isError ? { x: [-4, 4, -4, 4, 0], backgroundColor: "#ef4444", borderColor: "#b91c1c" } : { scale: 1 }}
        transition={isError ? { duration: 0.4 } : { type: "spring", stiffness: 400, damping: 15 }}
        whileHover={{ scale: 1.3 }}
        className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center transition-all border-[2px] shadow-sm
          ${isError
            ? `text-white shadow-red-500/50 ring-4 ring-red-500/20`
            : `bg-white/80 dark:bg-slate-800/80 text-slate-400 border-slate-300 dark:border-slate-500 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900 hover:text-blue-500`
          }`}
      >
        <div className={`w-2 h-2 rounded-full ${isError ? 'bg-white' : 'bg-slate-300 dark:bg-slate-500 group-hover:bg-blue-500'}`} />
      </motion.div>
    </div>
  );
}

// ── Main Component ──
export default function TurkeyMapGame({ topic }: { topic: MapTopic }) {
  const [placedItems, setPlacedItems] = useState<Record<string, boolean>>({});
  const [shuffledPoints, setShuffledPoints] = useState<MapPoint[]>([]);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [isStarted, setIsStarted] = useState(false);

  const initGame = useCallback(() => {
    // Karmaşık (rastgele) sıra
    setShuffledPoints([...topic.points].sort(() => Math.random() - 0.5));
    setPlacedItems({});
    setErrorId(null);
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
    } else {
      // Yanlış
      setErrorId(spotId);
      setTimeout(() => setErrorId(null), 600); // 600ms sonra kırmızı animasyonu kaldır
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full mx-auto relative min-h-[85vh]">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl z-10 relative
          bg-gradient-to-r from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60
          backdrop-blur-xl border border-white/20 dark:border-white/5 shadow-lg shadow-slate-200/50 dark:shadow-black/20"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-white leading-tight">{topic.title}</h2>
            <p className="text-xs font-medium text-slate-400 leading-tight">{topic.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ProgressRing progress={progress} total={total} />
          <button
            onClick={initGame}
            className="p-2.5 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-700/50 dark:hover:bg-slate-600/50
              text-slate-500 hover:text-slate-700 dark:text-slate-400 transition-all hover:rotate-180 duration-500"
            title="Yeniden Başlat"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* ── Map Content (Full Screen) ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full rounded-3xl overflow-hidden min-h-[60vh] lg:min-h-[75vh] flex items-center justify-center relative z-0
          bg-gradient-to-br from-sky-50 to-blue-50 dark:from-slate-800/80 dark:to-slate-900/80
          border border-white/40 dark:border-white/5 shadow-xl shadow-sky-100/50 dark:shadow-black/20 p-2 lg:p-8"
      >
        <div 
          className="relative w-full" 
          style={{ 
            aspectRatio: `${VIEW_W}/${VIEW_H}`, 
            maxHeight: "100%", 
            maxWidth: `calc(100vh * ${VIEW_W} / ${VIEW_H})` 
          }}
        >
          <ComposableMap
              width={VIEW_W} height={VIEW_H}
              projection="geoMercator"
              projectionConfig={{ center: MAP_CENTER, scale: MAP_SCALE }}
              style={{ width: "100%", height: "100%" }}
            >
              <defs>
                <linearGradient id="mapGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#e2e8f0" />
                  <stop offset="100%" stopColor="#cbd5e1" />
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
                          strokeWidth={0.6}
                          style={{
                            default: { outline: "none" },
                            hover: { fill: "#cbd5e1", outline: "none", transition: "fill 0.2s" },
                            pressed: { outline: "none" },
                          }}
                        />
                        <Marker coordinates={centroid} className="pointer-events-none">
                          <text
                            textAnchor="middle"
                            y={3}
                            style={{ fontSize: "8px", fill: "rgba(71, 85, 105, 0.6)", fontWeight: 600, userSelect: "none" }}
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
                  onClick={() => handleSpotClick(point.id)}
                />
              ))}
            </div>
          </div>
      </motion.div>

      {/* ── Active Question Floating Card ── */}
      <AnimatePresence mode="wait">
        {!isComplete && activePoint && activeVisual && (
          <motion.div
            key={activePoint.id}
            initial={{ y: 50, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ scale: 0.8, opacity: 0, y: -20, transition: { duration: 0.2 } }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
          >
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-2xl shadow-blue-900/20 rounded-full px-6 py-4 flex items-center gap-5">
              <div className="flex flex-col items-end border-r border-slate-200 dark:border-slate-700 pr-5">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Hedefiniz</span>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  Haritada Bulun <Target className="w-3.5 h-3.5" />
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-inner ${activeVisual.bg} text-white`}>
                  {activeVisual.icon}
                </div>
                <div className="flex flex-col">
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white leading-tight">
                    {formatName(activePoint.name)}
                  </h3>
                  <p className={`text-xs font-bold uppercase tracking-wider ${activeVisual.text.replace('100', '500')}`}>
                    {activePoint.type}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Completion Modal ── */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center border border-white/20"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/40">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">Tebrikler!</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-8">
                Tüm öğelerin yerini haritada başarıyla buldunuz. Görsel hafızanız harika!
              </p>
              <button
                onClick={initGame}
                className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" /> Yeniden Oyna
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
