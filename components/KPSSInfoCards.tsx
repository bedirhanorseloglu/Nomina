"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const tabs = [
  {
    id: "nedir",
    label: "KPSS Nedir?",
    icon: "❓",
    title: "KPSS Nedir?",
    content: (
      <div className="space-y-6">
        <div className="p-5 bg-white dark:bg-slate-800 border-2 border-b-4 border-slate-200 dark:border-slate-700 rounded-[1.5rem]">
          <p className="text-base font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-3">
            <span className="text-2xl">🏛️</span> KPSS, devlet memuru olmak için yapılan merkezi bir sınavdır.
          </p>
        </div>
        <div className="space-y-4">
          <p className="font-bold text-slate-400 uppercase tracking-widest text-xs px-2">Süreç 3 Aşamadan Oluşur:</p>
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-5 bg-white dark:bg-slate-800 rounded-[1.5rem] border-2 border-b-4 border-slate-200 dark:border-slate-700">
              <span className="flex-shrink-0 w-10 h-10 rounded-2xl bg-[#1cb0f6] text-white flex items-center justify-center font-bold text-lg border-b-4 border-[#1899d6]">1</span>
              <div className="pt-0.5">
                <p className="font-bold text-slate-700 dark:text-slate-200 text-base">Sınava Girersin</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">ÖSYM tarafından belirlenen tarihte oturumlara katılırsın.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-5 bg-white dark:bg-slate-800 rounded-[1.5rem] border-2 border-b-4 border-slate-200 dark:border-slate-700">
              <span className="flex-shrink-0 w-10 h-10 rounded-2xl bg-[#58cc02] text-white flex items-center justify-center font-bold text-lg border-b-4 border-[#58a700]">2</span>
              <div className="pt-0.5">
                <p className="font-bold text-slate-700 dark:text-slate-200 text-base">Puan Alırsın</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">Sınav sonucunda eğitim durumuna ve girdiğin oturumlara göre puanların hesaplanır.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-5 bg-white dark:bg-slate-800 rounded-[1.5rem] border-2 border-b-4 border-slate-200 dark:border-slate-700">
              <span className="flex-shrink-0 w-10 h-10 rounded-2xl bg-[#ff4b4b] text-white flex items-center justify-center font-bold text-lg border-b-4 border-[#ea2b2b]">3</span>
              <div className="pt-0.5">
                <p className="font-bold text-slate-700 dark:text-slate-200 text-base">Tercih Yapıp Atanırsın</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">Merkezi yerleştirmeler veya kurum alımları ile göreve başlarsın.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "yapi",
    label: "Sınav Yapısı",
    icon: "🏗️",
    title: "Sınav Yapısı",
    content: (
      <div className="space-y-6">
        <div className="p-5 bg-white dark:bg-slate-800 border-2 border-b-4 border-slate-200 dark:border-slate-700 rounded-[1.5rem]">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2 mb-3 uppercase tracking-wide">Lisans mezunları için:</h4>
          <ul className="space-y-3 text-sm text-slate-700 dark:text-slate-200 font-semibold">
            <li className="flex items-center gap-3"><span className="text-lg">🎓</span> KPSS Lisans (Genel Yetenek + Genel Kültür)</li>
            <li className="flex items-center gap-3"><span className="text-lg">👩‍💻</span> Mühendis, öğretmen, iktisatçı, hukukçu — herkes girer</li>
          </ul>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 border-2 border-b-4 border-slate-200 dark:border-slate-700 rounded-[1.5rem] bg-white dark:bg-slate-800">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-bold text-slate-700 dark:text-slate-200 text-base">Genel Yetenek (GY)</h4>
              <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 rounded-xl text-orange-600 font-bold text-xs">60 Soru</span>
            </div>
            <ul className="text-sm text-slate-600 dark:text-slate-400 font-medium space-y-3">
              <li className="flex items-center gap-3"><div className="w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-sm">📝</div> Türkçe (30)</li>
              <li className="flex items-center gap-3"><div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-sm">🔢</div> Matematik (30)</li>
            </ul>
          </div>
          <div className="p-5 border-2 border-b-4 border-slate-200 dark:border-slate-700 rounded-[1.5rem] bg-white dark:bg-slate-800">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-bold text-slate-700 dark:text-slate-200 text-base">Genel Kültür (GK)</h4>
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl text-emerald-600 font-bold text-xs">60 Soru</span>
            </div>
            <ul className="text-sm text-slate-600 dark:text-slate-400 font-medium space-y-3">
              <li className="flex items-center gap-3"><div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-sm">🌍</div> Tarih, Coğrafya</li>
              <li className="flex items-center gap-3"><div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-sm">⚖️</div> Vatandaşlık, Güncel</li>
            </ul>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-5 bg-white dark:bg-slate-800 border-2 border-b-4 border-slate-200 dark:border-slate-700 rounded-[1.5rem]">
          <div className="text-center flex-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Toplam</p>
            <p className="text-2xl font-bold text-slate-700 dark:text-slate-200">120 Soru</p>
          </div>
          <div className="w-0.5 h-10 bg-slate-200 dark:bg-slate-700 mx-2" />
          <div className="text-center flex-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Süre</p>
            <p className="text-2xl font-bold text-[#1cb0f6]">130 Dk</p>
          </div>
        </div>
        <p className="text-xs text-center text-slate-400 font-medium pt-1">Sınavdan sonra KPSS Puanın oluşur.</p>
      </div>
    )
  },
  {
    id: "puan",
    label: "Puan Türleri",
    icon: "📊",
    title: "Puan Türleri",
    content: (
      <div className="space-y-6">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 px-1">Sınavdan sonra tek bir puan türü hesaplanmaz. Yazılım mezunları için en kritik puan P3'tür:</p>
        
        <div className="p-6 bg-white dark:bg-slate-800 border-2 border-b-4 border-slate-200 dark:border-slate-700 rounded-[1.5rem] relative overflow-hidden">
          <div className="absolute -top-6 -right-6 text-9xl opacity-5 select-none">⭐</div>
          <div className="relative z-10">
            <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mb-1.5">Senin Kader Puanın</p>
            <h4 className="text-2xl sm:text-3xl font-bold text-slate-700 dark:text-white mb-5 flex items-center gap-3">
              P3 PUANI
            </h4>
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-slate-100 dark:border-slate-800 mb-4 inline-block">
              <p className="text-sm sm:text-base font-semibold text-slate-600 dark:text-slate-300">
                P3 = <span className="text-[#1cb0f6]">%50 GY</span> + <span className="text-[#58cc02]">%50 GK</span>
              </p>
            </div>
            <div className="block">
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl inline-flex items-center gap-2 border border-slate-100 dark:border-slate-800">
                <span className="text-lg">🚀</span> Bilgisayar, Yazılım ve Bilişim kadrolarına bu puanla girilir.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 border-2 border-b-4 border-slate-200 dark:border-slate-700 rounded-[1.5rem] bg-white dark:bg-slate-800">
            <h4 className="font-bold text-slate-700 dark:text-slate-200 text-lg mb-1.5">P1 Puanı</h4>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">GY ağırlıklı genel kamu kadroları puan türüdür.</p>
          </div>
          <div className="p-5 border-2 border-b-4 border-slate-200 dark:border-slate-700 rounded-[1.5rem] bg-white dark:bg-slate-800">
            <h4 className="font-bold text-slate-700 dark:text-slate-200 text-lg mb-1.5 flex items-center gap-2">
              <span className="text-xl">⚠️</span> P2 ve P10
            </h4>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Öğretmen ve alan adaylarına özgüdür. Seni ilgilendirmez.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "atanma",
    label: "Atanma Yolları",
    icon: "🛤️",
    title: "Nasıl Atanırsın?",
    content: (
      <div className="space-y-6">
        <div className="p-5 bg-white dark:bg-slate-800 rounded-[1.5rem] border-2 border-b-4 border-slate-200 dark:border-slate-700">
          <h4 className="font-bold text-slate-700 dark:text-white text-lg flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
            <div className="flex items-center gap-3">
               <span className="w-10 h-10 rounded-xl bg-[#1cb0f6] text-white flex items-center justify-center text-lg font-bold border-b-4 border-[#1899d6]">1</span>
               Merkezi Atama 
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-lg sm:ml-auto w-max">EN TEMİZ YOL 🌟</span>
          </h4>
          <div className="sm:pl-[3.5rem] space-y-3">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Kurumlar kadro açar, ÖSYM tercih ekranı açar. Sınav veya mülakat yoktur. Sadece puan üstünlüğüne göre atanırsın.</p>
            <div className="flex items-center gap-3 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl inline-flex">
              <span className="text-2xl">📅</span>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Yılda 2 Kez</p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Kasım ve Temmuz</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 rounded-[1.5rem] border-2 border-b-4 border-slate-200 dark:border-slate-700">
          <h4 className="font-bold text-slate-700 dark:text-white text-lg flex items-center gap-3 mb-3">
            <span className="w-10 h-10 rounded-xl bg-[#ff4b4b] text-white flex items-center justify-center text-lg font-bold border-b-4 border-[#ea2b2b]">2</span>
            Kurum Sınavı / Mülakatlı Alım
          </h4>
          <div className="sm:pl-[3.5rem] space-y-3">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Bazı kurumlar kendi alımını yapar. KPSS burada mülakata çağrılmak için bir ön elemedir.</p>
            <div className="flex flex-wrap gap-1.5 items-center">
              {["KPSS", "Başvuru", "Yazılı/Mülakat", "Atama"].map((step, i) => (
                <div key={step} className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300">{step}</span>
                  {i < 3 && <span className="text-slate-300 dark:text-slate-600 font-bold text-sm">→</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  },

  {
    id: "takvim",
    label: "Takvim & Süreç",
    icon: "⏳",
    title: "Resmi Tarihler & Süreç",
    content: (
      <div className="space-y-6">
        <div className="p-4 bg-white dark:bg-slate-800 border-2 border-b-4 border-slate-200 dark:border-slate-700 rounded-[1.2rem]">
          <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
            <strong className="text-orange-500 font-bold flex items-center gap-2 mb-1.5 text-sm"><span className="text-xl">⚠️</span> ÖNEMLİ NOT</strong> 
            Yazılım mühendisleri kamuda mühendis kadrosuna atanmak için sadece <span className="font-bold underline decoration-2 decoration-orange-400 underline-offset-2">çift yıllarda</span> yapılan B Grubu sınavına girerek <strong className="font-bold text-slate-700 dark:text-slate-200">KPSS-P3</strong> puanı almalıdır.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 border-2 border-b-4 border-slate-200 dark:border-slate-700 rounded-[1.2rem] overflow-hidden">
          <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-3 border-b-2 border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <span className="text-xl">📅</span> 2026 RESMİ TAKVİM
            </span>
          </div>
          <div className="p-2 sm:p-4 space-y-1">
            {[
              { date: "1–13 Temmuz 2026", label: "Sınav Başvuruları" },
              { date: "22–23 Temmuz 2026", label: "Geç Başvuru Günleri" },
              { date: "6 Eylül 2026", label: "Sınav Günü (GY-GK)", highlight: true },
              { date: "7 Ekim 2026", label: "Sonuçların Açıklanması" },
              { date: "Temmuz 2026", label: "Merkezi Atama 1. Dönem" },
              { date: "Aralık 2026", label: "Merkezi Atama 2. Dönem" },
            ].map((item, i) => (
              <div key={i} className={`flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg ${item.highlight ? 'bg-[#1cb0f6]/10 border border-[#1cb0f6]/20' : ''}`}>
                <span className={`text-[13px] font-medium ${item.highlight ? 'text-[#1cb0f6] font-bold' : 'text-slate-500 dark:text-slate-400'}`}>{item.label}</span>
                <span className={`text-[13px] font-semibold ${item.highlight ? 'text-[#1cb0f6]' : 'text-slate-700 dark:text-slate-300'}`}>{item.date}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-5 border-t-2 border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {[1, 2, 3, 4, 5].map((step, idx) => (
              <div key={step} className="flex items-center gap-1.5">
                <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center text-sm font-bold ${step === 5 ? 'bg-[#58cc02] border-[#58a700] border-b-4 text-white' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                  {step === 5 ? '🎯' : step}
                </div>
                {idx < 4 && <div className="w-4 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />}
              </div>
            ))}
          </div>
          <p className="text-[11px] font-semibold text-center text-slate-400 mt-4 tracking-wide">P3 Puanın 2 Yıl Geçerlidir (2026 ve 2027 Atamaları İçin)</p>
        </div>
      </div>
    )
  }
]

export default function KPSSInfoCards() {
  const [activeTab, setActiveTab] = useState(tabs[0].id)

  return (
    <div className="mb-8 space-y-4">
      {/* Tab Bar */}
      <div className="flex items-center gap-3 overflow-x-auto pb-4 pt-2 px-1 custom-scrollbar no-scrollbar scroll-smooth">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-5 py-2.5 rounded-[1.5rem] text-sm font-black transition-all flex items-center gap-2 border-2 ${
              activeTab === tab.id
                ? "bg-[#1cb0f6] text-white border-[#1cb0f6] border-b-4 translate-y-[-2px] shadow-sm"
                : "bg-slate-50 dark:bg-slate-800/50 text-slate-400 border-slate-100 dark:border-slate-700 hover:border-[#1cb0f6]/50 hover:text-[#1cb0f6] hover:bg-[#1cb0f6]/5"
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          {tabs.map((tab) => (
            activeTab === tab.id && (
              <motion.div
                key={tab.id}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-white dark:bg-[#1e293b]/80 backdrop-blur-md border-2 border-slate-100 dark:border-white/5 rounded-[2rem] p-6 md:p-8 shadow-sm"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-3xl border-2 border-slate-100 dark:border-slate-700 shadow-sm">
                    {tab.icon}
                  </div>
                  <h2 className="font-heading text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                    {tab.title}
                  </h2>
                </div>
                
                <div className="w-full">
                  {tab.content}
                </div>
              </motion.div>
            )
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
