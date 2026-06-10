"use client";

import React, { useState, useMemo } from "react";
import { ComposableMap, Geographies, Geography, Line, Marker } from "react-simple-maps";
import { RIVER_PATHS, RiverPath } from "@/lib/riverData";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Check, MapPin, RefreshCw } from "lucide-react";
import confetti from "canvas-confetti";

const GEO_URL = "/turkey-topo.json";

// We'll shuffle and use all rivers on the map
const GAME_RIVERS = [...RIVER_PATHS].sort(() => Math.random() - 0.5);

interface RiverMapGameProps {
  onRestart: () => void;
}

export default function RiverMapGame({ onRestart }: RiverMapGameProps) {
  const [targetIndex, setTargetIndex] = useState(0);
  const [placedIds, setPlacedIds] = useState<string[]>([]);
  const [fails, setFails] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [errorId, setErrorId] = useState<string | null>(null);

  const targetRiver = GAME_RIVERS[targetIndex];

  const handleRiverClick = (river: RiverPath) => {
    if (isGameOver) return;
    if (placedIds.includes(river.id)) return;

    if (river.id === targetRiver.id) {
      // Correct!
      setPlacedIds((prev) => [...prev, river.id]);
      setFails(0);
      setShowHint(false);

      if (targetIndex === GAME_RIVERS.length - 1) {
        setIsGameOver(true);
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      } else {
        setTargetIndex(targetIndex + 1);
      }
    } else {
      // Wrong!
      const newFails = fails + 1;
      setFails(newFails);
      setErrorId(river.id);
      setTimeout(() => setErrorId(null), 500);
      
      if (newFails >= 3) {
        setShowHint(true);
      }
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Target Header */}
      {!isGameOver ? (
        <div className="mb-6 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest text-xs rounded-xl mb-4">
            <MapPin className="w-4 h-4" /> HARİTADA BUL
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white text-center">
            {targetRiver.name} nerede?
          </h2>
          {showHint && (
            <motion.p 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="text-amber-500 font-bold mt-2"
            >
              İpucu: Haritada parlayan nehre tıkla!
            </motion.p>
          )}
        </div>
      ) : (
        <div className="mb-6 flex flex-col items-center">
          <div className="w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center text-white border-b-4 border-yellow-600 mb-4 shadow-lg shadow-yellow-500/30">
            <Trophy className="w-10 h-10" />
          </div>
          <h2 className="text-4xl font-black text-slate-800 dark:text-white mb-2">Harika İş Çıkardın!</h2>
          <p className="text-slate-500 font-medium">Tüm nehirlerin yerini öğrendin.</p>
          <button
            onClick={onRestart}
            className="mt-6 px-6 py-3 bg-[#58cc02] text-white font-black uppercase tracking-widest rounded-2xl shadow-sm border-b-4 border-[#46a302] active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" /> Tekrar Oyna
          </button>
        </div>
      )}

      {/* Map Container */}
      <div className="w-full aspect-[2/1] relative bg-[#82d8ff] dark:bg-[#0f233b] rounded-[2rem] border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden mt-4">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [35.2, 39.0], scale: 3000 }}
          className="w-full h-full"
        >
          {/* Turkey Base */}
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#fde68a" // land color
                  stroke="#d97706" // border
                  strokeWidth={0.5}
                  className="outline-none dark:fill-[#1e293b] dark:stroke-slate-600"
                />
              ))
            }
          </Geographies>

          {/* Rivers */}
          {GAME_RIVERS.map((river) => {
            const isPlaced = placedIds.includes(river.id);
            const isTarget = river.id === targetRiver?.id;
            
            // Define colors
            let strokeColor = "#1e40af"; // default hidden blue
            let strokeWidth = 2;
            let opacity = 0.5;

            if (isPlaced) {
              strokeColor = "#2563eb"; // vivid blue when placed
              strokeWidth = 4;
              opacity = 1;
            } else if (errorId === river.id) {
              strokeColor = "#ef4444"; // red for error
              strokeWidth = 4;
              opacity = 1;
            } else if (isTarget && showHint) {
              strokeColor = "#58cc02"; // glowing green hint
              strokeWidth = 6;
              opacity = 1;
            }

            return (
              <g key={river.id} onClick={() => handleRiverClick(river)} className="cursor-pointer outline-none">
                <Line
                  from={river.coordinates[0]}
                  to={river.coordinates[river.coordinates.length - 1]}
                  coordinates={river.coordinates}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-all ${errorId === river.id ? "duration-75" : "duration-300 hover:stroke-[#3b82f6] hover:stroke-[6px]"}`}
                  style={{ opacity }}
                />
              </g>
            );
          })}
        </ComposableMap>

        {/* Labels overlay */}
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ center: [35.2, 39.0], scale: 3000 }}
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {GAME_RIVERS.map((river) => {
            if (!placedIds.includes(river.id)) return null;
            const midPoint = river.coordinates[Math.floor(river.coordinates.length / 2)];
            return (
              <Marker key={`marker-${river.id}`} coordinates={midPoint}>
                <g transform="translate(0, -10)">
                  <rect x="-30" y="-12" width="60" height="16" rx="4" fill="white" className="dark:fill-slate-800" stroke="#3b82f6" strokeWidth="2" />
                  <text textAnchor="middle" y="-1" style={{ fontFamily: "inherit", fontSize: "10px", fontWeight: "bold", fill: "#1e293b" }} className="dark:fill-white">
                    {river.name}
                  </text>
                </g>
              </Marker>
            );
          })}
        </ComposableMap>
      </div>
    </div>
  );
}
