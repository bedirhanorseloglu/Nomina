"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const QUOTES = [
  { text: "Gelecek, bugünden hazırlananlara aittir.", author: "Malcolm X" },
  { text: "Başarı, hazırlık ve fırsatın buluştuğu noktadır.", author: "Bobby Unser" },
  { text: "Asla vazgeçme. Bugün zordur, yarın daha da zor olacak ama yarından sonra güneş doğacak.", author: "Jack Ma" },
  { text: "Sadece çok uzağa gitme riskini alanlar ne kadar uzağa gidebileceklerini görebilirler.", author: "T.S. Eliot" },
  { text: "Zorluklar, başarıyı değerli kılan baharatlardır.", author: "Truman Capote" },
  { text: "Yapabileceğiniz her şeye inanın ve yarı yolu geçmiş sayılın.", author: "Theodore Roosevelt" },
  { text: "Başlamak için harika olmanıza gerek yok, ama harika olmak için başlamanıza gerek var.", author: "Zig Ziglar" },
  { text: "Engeller, gözünüzü hedeften ayırdığınızda gördüğünüz o korkunç şeylerdir.", author: "Henry Ford" },
  { text: "Başarı, küçük çabaların her gün tekrarlanmasıyla elde edilir.", author: "Robert Collier" },
  { text: "Siz yolun kendisisiniz; başkalarının ayak izlerini takip etmeyi bırakın.", author: "Rumi" }
]

const WISHES = [
  "Harika bir çalışma günü dileriz!",
  "Bugün hedeflerine bir adım daha yaklaşıyorsun.",
  "Zihninin açık, enerjinin yüksek olduğu bir gün olsun.",
  "Başarı seninle olsun, iyi çalışmalar!",
  "Disiplin, özgürlüğe giden kapıdır. Bugün o kapıyı arala!"
]

export default function MotivationalQuote() {
  const [quote, setQuote] = useState({ text: "", author: "" })
  const [wish, setWish] = useState("")

  useEffect(() => {
    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)]
    const randomWish = WISHES[Math.floor(Math.random() * WISHES.length)]
    setQuote(randomQuote)
    setWish(randomWish)
  }, [])

  if (!quote.text) return null

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-accent/5 border border-accent/10 rounded-[2rem] p-6 md:p-8 relative overflow-hidden group shadow-sm shadow-accent/5"
    >
      {/* Decorative Elements */}
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-accent/5 rounded-full blur-2xl group-hover:bg-accent/10 transition-colors" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent/5 rounded-full blur-3xl" />
      
      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white shadow-lg shadow-accent/20">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H16.017C14.9124 8 14.017 7.10457 14.017 6V5C14.017 3.89543 14.9124 3 16.017 3H19.017C21.2261 3 23.017 4.79086 23.017 7V15C23.017 17.2091 21.2261 19 19.017 19H17.017L14.017 21ZM1.017 21L1.017 18C1.017 16.8954 1.91243 16 3.017 16H6.017C6.56928 16 7.017 15.5523 7.017 15V9C7.017 8.44772 6.56928 8 6.017 8H3.017C1.91243 8 1.017 7.10457 1.017 6V5C1.017 3.89543 1.91243 3 3.017 3H6.017C8.22614 3 10.017 4.79086 10.017 7V15C10.017 17.2091 8.22614 19 6.017 19H4.017L1.017 21Z"></path></svg>
           </div>
           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">{wish}</span>
        </div>

        <div className="flex flex-col gap-2">
           <p className="text-xl md:text-2xl font-black text-slate-900 leading-tight tracking-tight italic">
             "{quote.text}"
           </p>
           <div className="flex items-center gap-2 mt-1">
              <div className="w-4 h-px bg-slate-200" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{quote.author}</span>
           </div>
        </div>
      </div>
    </motion.div>
  )
}
