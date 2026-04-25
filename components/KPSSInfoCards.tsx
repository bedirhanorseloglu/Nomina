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
      <div className="space-y-4">
        <p className="text-lg font-medium text-text-main">KPSS = Devlet memuru olmak için yapılan merkezi sınav.</p>
        <div className="space-y-3">
          <p className="text-muted">Tek sınav değil, bir süreçtir. 3 aşama:</p>
          <ol className="space-y-4">
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold">1</span>
              <div>
                <p className="font-bold text-text-main">KPSS sınavına girersin</p>
                <p className="text-sm text-muted">ÖSYM tarafından belirlenen tarihte oturumlara katılırsın.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold">2</span>
              <div>
                <p className="font-bold text-text-main">Puan alırsın</p>
                <p className="text-sm text-muted">Sınav sonucunda eğitim durumuna ve girdiğin oturumlara göre puanların hesaplanır.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-bold">3</span>
              <div>
                <p className="font-bold text-text-main">Tercih yapıp atanırsın</p>
                <p className="text-sm text-muted">Merkezi yerleştirmeler veya kurum alımları ile göreve başlarsın.</p>
              </div>
            </li>
          </ol>
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
      <div className="space-y-4">
        <div className="p-4 bg-accent/5 border-l-4 border-accent rounded-r-lg">
          <p className="text-sm font-medium text-text-main">Lisans mezunları için:</p>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            <li>→ KPSS Lisans (Genel Yetenek + Genel Kültür)</li>
            <li>→ Mühendis, öğretmen, iktisatçı, hukukçu — herkes girer</li>
          </ul>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-border-custom rounded-xl bg-surface/50">
            <h4 className="font-bold text-accent mb-2">Genel Yetenek (GY)</h4>
            <p className="text-sm text-text-main">60 soru</p>
            <ul className="text-xs text-muted mt-1">
              <li>• Türkçe (30)</li>
              <li>• Matematik (30)</li>
            </ul>
          </div>
          <div className="p-4 border border-border-custom rounded-xl bg-surface/50">
            <h4 className="font-bold text-accent mb-2">Genel Kültür (GK)</h4>
            <p className="text-sm text-text-main">60 soru</p>
            <ul className="text-xs text-muted mt-1">
              <li>• Tarih, Coğrafya</li>
              <li>• Vatandaşlık, Güncel Bilgiler</li>
            </ul>
          </div>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-card/40 border border-border-custom rounded-xl">
          <div className="text-center flex-1">
            <p className="text-xs text-muted uppercase">Toplam</p>
            <p className="text-xl font-bold text-text-main">120 Soru</p>
          </div>
          <div className="w-px h-10 bg-border-custom" />
          <div className="text-center flex-1">
            <p className="text-xs text-muted uppercase">Süre</p>
            <p className="text-xl font-bold text-text-main">130 Dakika</p>
          </div>
        </div>
        <p className="text-xs text-center text-muted italic">Sınavdan sonra KPSS Puanın oluşur.</p>
      </div>
    )
  },
  {
    id: "puan",
    label: "Puan Türleri",
    icon: "📊",
    title: "Puan Türleri",
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted">Sınavdan sonra tek puan yok, birden fazla puan türü oluşur. Yazılım mühendisi için kritik puan:</p>
        
        <div className="p-5 bg-accent2/5 border border-accent2/20 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 text-4xl opacity-10">⭐</div>
          <h4 className="text-xl font-bold text-accent2 mb-2">P3 PUANI</h4>
          <p className="text-xs text-muted uppercase tracking-widest mb-3">Senin Kader Puanın</p>
          <div className="p-3 bg-card/60 rounded-lg border border-border-custom mb-3">
            <p className="text-sm font-mono text-text-main">P3 = %50 Genel Yetenek + %50 Genel Kültür</p>
          </div>
          <p className="text-sm text-text-main font-medium">→ Bilgisayar/Yazılım/Bilişim kadrolarına bu puanla girilir.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-border-custom rounded-xl bg-surface/50">
            <h4 className="font-bold text-text-main mb-1">P1 Puanı</h4>
            <p className="text-xs text-muted">GY + GK (genel kamu kadroları, en geniş havuz)</p>
          </div>
          <div className="p-4 border border-red-500/20 rounded-xl bg-red-500/5">
            <h4 className="font-bold text-red-500 mb-1 flex items-center gap-2">
              <span>⚠️</span> P2 ve P10
            </h4>
            <p className="text-xs text-muted">Seni ilgilendirmez — öğretmen adaylarına özgüdür.</p>
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
        <div className="space-y-3">
          <h4 className="font-bold text-text-main flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-accent/20 text-accent flex items-center justify-center text-xs">1</span>
            Merkezi Atama <span className="text-xs font-normal text-muted">(En temiz yol)</span>
          </h4>
          <div className="pl-8 space-y-2">
            <p className="text-sm text-muted">Kurumlar kadro açar, ÖSYM tercih ekranı açar. Sınav yok, mülakat yok. Sadece puana göre atanırsın.</p>
            <div className="flex items-center gap-3 p-3 bg-accent/5 border border-accent/10 rounded-lg">
              <span className="text-xl">📅</span>
              <p className="text-xs text-text-main"><strong>Yılda 2 kez:</strong> Kasım + Temmuz</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-bold text-text-main flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-accent2/20 text-accent2 flex items-center justify-center text-xs">2</span>
            Kurum Sınavı / Mülakatlı Alım
          </h4>
          <div className="pl-8 space-y-2">
            <p className="text-sm text-muted">Bazı kurumlar (TÜBİTAK, Bakanlıklar vb.) kendi alımını yapar. KPSS burada sadece ön elemedir.</p>
            <div className="flex flex-wrap gap-2">
              {["KPSS", "Başvuru", "Yazılı/Mülakat", "Atama"].map((step, i) => (
                <div key={step} className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-surface border border-border-custom rounded">{step}</span>
                  {i < 3 && <span className="text-muted">→</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "yazilim",
    label: "Yazılım Mezunu İçin",
    icon: "💻",
    title: "Yazılım Mezunu Nereye Atanır?",
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            "Bilgisayar Mühendisi", "Yazılım Mühendisi", "Bilişim Personeli",
            "Sistem Uzmanı", "Programcı", "Memur (Genel)"
          ].map(job => (
            <div key={job} className="p-2 border border-border-custom rounded-lg bg-surface/50 text-[10px] md:text-xs text-text-main text-center">
              • {job}
            </div>
          ))}
        </div>
        
        <div className="p-4 bg-accent2/10 border border-accent2/20 rounded-xl">
          <h4 className="text-sm font-bold text-accent2 flex items-center gap-2 mb-2">
            <span>⚠️</span> Kritik Gerçek — KPSS Bir Yarış
          </h4>
          <div className="space-y-1">
            <div className="flex justify-between text-xs border-b border-accent2/10 pb-1">
              <span>85+ Puan</span> <span className="font-bold text-text-main">İyi Şans</span>
            </div>
            <div className="flex justify-between text-xs border-b border-accent2/10 pb-1">
              <span>90+ Puan</span> <span className="font-bold text-text-main">Yüksek İhtimal</span>
            </div>
            <div className="flex justify-between text-xs pt-1">
              <span>95+ Puan</span> <span className="font-bold text-accent">Garantiye Yakın</span>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <h4 className="font-bold text-text-main text-sm">Strateji (Yazılım Mezunu İçin)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-2 bg-accent/5 rounded-lg border border-accent/10">
              <span className="text-lg">✅</span>
              <div>
                <p className="text-xs font-bold text-text-main">Güçlü Başlangıç</p>
                <p className="text-[10px] text-muted">Matematik (Lisans altyapısı)</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 bg-accent2/5 rounded-lg border border-accent2/10">
              <span className="text-lg">⚠️</span>
              <div>
                <p className="text-xs font-bold text-text-main">Dikkat</p>
                <p className="text-[10px] text-muted">Türkçe (Pratik şart)</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 bg-surface rounded-lg border border-border-custom">
              <span className="text-lg">📚</span>
              <div>
                <p className="text-xs font-bold text-text-main">En Çok Yatırım</p>
                <p className="text-[10px] text-muted">Tarih ve Coğrafya</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 bg-surface rounded-lg border border-border-custom">
              <span className="text-lg">⚡</span>
              <div>
                <p className="text-xs font-bold text-text-main">Hızlı Kazanım</p>
                <p className="text-[10px] text-muted">Vatandaşlık / Anayasa</p>
              </div>
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
      <div className="space-y-4">
        <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl">
          <p className="text-xs text-text-main">
            <strong className="text-accent">⭐ ÖNEMLİ NOT:</strong> Yazılım mühendisleri kamuda mühendis kadrosuna atanmak için sadece çift yıllarda yapılan B Grubu sınavına girerek <strong>KPSS-P3</strong> puanı almalıdır.
          </p>
        </div>

        <div className="bg-surface/50 border border-border-custom rounded-xl overflow-hidden">
          <div className="bg-card px-4 py-2 border-b border-border-custom flex items-center justify-between">
            <span className="text-xs font-bold text-text-main">📅 2026 RESMİ TAKVİM</span>
          </div>
          <div className="p-4 space-y-2">
            {[
              { date: "1–13 Temmuz 2026", label: "Sınav Başvuruları" },
              { date: "22–23 Temmuz 2026", label: "Geç Başvuru Günleri" },
              { date: "6 Eylül 2026", label: "Sınav Günü (GY-GK)", highlight: true },
              { date: "7 Ekim 2026", label: "Sonuçların Açıklanması" },
              { date: "Temmuz 2026", label: "Merkezi Atama 1. Dönem" },
              { date: "Aralık 2026", label: "Merkezi Atama 2. Dönem" },
            ].map((item, i) => (
              <div key={i} className={`flex justify-between text-xs py-1 ${item.highlight ? 'text-accent font-bold' : 'text-muted'}`}>
                <span>{item.label}</span>
                <span>{item.date}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1 pt-2">
          {[1, 2, 3, 4, 5].map(step => (
            <div key={step} className="flex flex-col items-center">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 5 ? 'bg-accent text-bg' : 'bg-surface border border-border-custom text-muted'}`}>
                {step}
              </div>
              {step === 5 && <span className="text-[10px] mt-1 text-accent font-bold">Atan!</span>}
            </div>
          ))}
        </div>
        <p className="text-[10px] text-center text-muted">P3 puanın 2 yıl geçerlidir (2026 ve 2027 atamaları).</p>
      </div>
    )
  }
]

export default function KPSSInfoCards() {
  const [activeTab, setActiveTab] = useState(tabs[0].id)

  return (
    <div className="mb-8 space-y-6">
      {/* Tab Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar no-scrollbar scroll-smooth">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2 border ${
              activeTab === tab.id
                ? "bg-accent text-white border-accent shadow-lg shadow-accent/20"
                : "bg-surface border-border-custom text-muted hover:border-accent/30 hover:text-text-main"
            }`}
          >
            <span>{tab.icon}</span>
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
                initial={{ opacity: 0, y: 20, x: 10 }}
                animate={{ opacity: 1, y: 0, x: 0 }}
                exit={{ opacity: 0, y: -20, x: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-card/40 backdrop-blur-md border border-border-custom rounded-2xl p-6 md:p-8 shadow-xl"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-2xl">
                    {tab.icon}
                  </div>
                  <h2 className="font-heading text-2xl font-bold text-text-main tracking-tight">
                    {tab.title}
                  </h2>
                </div>
                
                <div className="max-w-3xl">
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
