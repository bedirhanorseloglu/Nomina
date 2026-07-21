"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GoogleGenerativeAI } from "@google/generative-ai"
import ReactMarkdown from "react-markdown"
import Quiz from "@/components/Quiz"
import { PlaySquare, KeyRound, Sparkles, Send, Loader2, MonitorPlay, Bot, User, AlertCircle, Settings, CheckCircle2, Zap, ArrowRight, BookOpen } from "lucide-react"
import { fetchTranscript, extractVideoId } from "@/lib/youtube"
import FloatingNavbar from "@/components/layout/FloatingNavbar"

const QUICK_TIPS = [
  { icon: Zap, text: "Hap Bilgi Çıkar", color: "text-[#ff9500]", bg: "bg-[#ff9500]/10" },
  { icon: Sparkles, text: "Soru Tahminleri Yap", color: "text-[#1cb0f6]", bg: "bg-[#1cb0f6]/10" },
  { icon: BookOpen, text: "Konu Özeti İste", color: "text-[#af52de]", bg: "bg-[#af52de]/10" },
]

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

const QuizCodeBlock = ({ inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '')
  if (!inline && match && match[1] === 'quiz') {
    try {
      const quizData = JSON.parse(String(children).replace(/\n$/, ''))
      return <Quiz data={quizData} onSeek={(time) => window.dispatchEvent(new CustomEvent('seekTo', { detail: time }))} />
    } catch (e) {
      return (
        <div className="w-full rounded-2xl border-2 border-[#1cb0f6]/20 bg-[#1cb0f6]/5 p-8 flex flex-col items-center justify-center gap-4 my-4">
          <div className="relative">
            <div className="absolute inset-0 bg-[#1cb0f6] blur-lg opacity-30 rounded-full animate-pulse" />
            <Loader2 className="w-8 h-8 animate-spin text-[#1cb0f6] relative z-10" />
          </div>
          <div className="text-center">
            <p className="font-black text-[#1cb0f6] tracking-tight text-lg mb-1 animate-pulse">Test Hazırlanıyor</p>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Yapay zeka soruları kurguluyor...</p>
          </div>
        </div>
      )
    }
  }

  // Handle timestamps accidentally formatted as inline code
  if (typeof children === 'string' || (Array.isArray(children) && typeof children[0] === 'string')) {
    const text = String(children);
    const seekMatch = /^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\(#seek-.*?\)$/.exec(text);
    if (seekMatch) {
      const timeStr = seekMatch[1];
      return (
        <button 
          onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('seekTo', { detail: timeStr })); }}
          className="inline-flex items-center gap-1 bg-[#ff2d55]/10 text-[#ff2d55] px-1.5 py-0 rounded-md font-bold hover:bg-[#ff2d55]/20 transition-colors mx-0.5 text-xs"
        >
          <MonitorPlay className="w-3.5 h-3.5" /> {timeStr}
        </button>
      )
    }
  }

  return <code className="bg-slate-100 dark:bg-black/20 rounded px-1 py-0.5 text-[#ff2d55]" {...props}>{children}</code>
}

const markdownComponents = {
  h1: ({node, ...props}: any) => <h1 className="text-lg font-black text-[#1cb0f6] mt-4 mb-2 uppercase tracking-tight" {...props} />,
  h2: ({node, ...props}: any) => <h2 className="text-base font-black text-[#1cb0f6] mt-3 mb-1 uppercase tracking-tight" {...props} />,
  h3: ({node, ...props}: any) => <h3 className="text-[15px] font-black text-[#1cb0f6] mt-3 mb-1 uppercase" {...props} />,
  p: ({node, ...props}: any) => <p className="mb-2 leading-relaxed" {...props} />,
  ul: ({node, ...props}: any) => <ul className="list-disc pl-5 mb-3 space-y-1" {...props} />,
  ol: ({node, ...props}: any) => <ol className="list-decimal pl-5 mb-3 space-y-1" {...props} />,
  li: ({node, ...props}: any) => <li className="marker:text-[#1cb0f6]" {...props} />,
  strong: ({node, ...props}: any) => <strong className="font-black text-slate-900 dark:text-white" {...props} />,
  code: QuizCodeBlock,
  a: ({node, href, children, ...props}: any) => {
    let isTimestamp = false;
    let timeStr = "";
    
    if (href?.startsWith('#seek-')) {
      isTimestamp = true;
      timeStr = href.replace('#seek-', '');
    } else if (href === '#' || href?.startsWith('#seek')) {
      const childText = Array.isArray(children) ? children.join('') : String(children);
      if (/^\d{1,2}:\d{2}(?::\d{2})?$/.test(childText)) {
        isTimestamp = true;
        timeStr = childText;
      }
    }

    if (isTimestamp) {
      return (
        <button 
          onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('seekTo', { detail: timeStr })); }}
          className="inline-flex items-center gap-1 bg-[#ff2d55]/10 text-[#ff2d55] px-1.5 py-0 rounded-md font-bold hover:bg-[#ff2d55]/20 transition-colors mx-0.5 text-xs"
        >
          <MonitorPlay className="w-3.5 h-3.5" /> {children}
        </button>
      )
    }
    return <a href={href} target="_blank" rel="noreferrer" className="text-[#1cb0f6] underline underline-offset-2 font-bold" {...props}>{children}</a>
  }
}

export default function NotebookPage() {
  const [apiKey, setApiKey] = useState("")
  const [isApiKeySet, setIsApiKeySet] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const [videoId, setVideoId] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<string>("")
  const [isFetchingTranscript, setIsFetchingTranscript] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [showManualInput, setShowManualInput] = useState(false)
  const [manualTranscript, setManualTranscript] = useState("")

  const [chatInput, setChatInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatSessionRef = useRef<any>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const seekTo = (timeStr: string) => {
    const parts = timeStr.split(':')
    let seconds = 0
    if (parts.length === 2) {
      seconds = parseInt(parts[0]) * 60 + parseInt(parts[1])
    } else if (parts.length === 3) {
      seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2])
    }
    
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: 'seekTo',
        args: [seconds, true]
      }), '*')
      iframeRef.current.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: 'playVideo',
        args: []
      }), '*')
    }
  }

  useEffect(() => {
    const savedKey = localStorage.getItem("gemini_api_key")
    if (savedKey) {
      setApiKey(savedKey)
      setIsApiKeySet(true)
    }

    const handleSeekEvent = (e: any) => {
      if (e.detail) seekTo(e.detail);
    };
    window.addEventListener('seekTo', handleSeekEvent);
    return () => window.removeEventListener('seekTo', handleSeekEvent);
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) return
    localStorage.setItem("gemini_api_key", apiKey.trim())
    setIsApiKeySet(true)
    setShowSettings(false)
    chatSessionRef.current = null // Reset session to use the new API key
  }

  const handleLoadVideo = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!urlInput.trim() || isFetchingTranscript) return

    setError(null)
    const extractedId = extractVideoId(urlInput)
    if (!extractedId) {
      setError("Geçerli bir YouTube linki girin.")
      return
    }

    setVideoId(extractedId)
    setIsFetchingTranscript(true)
    setTranscript("")
    setMessages([])
    
    try {
      const text = await fetchTranscript(extractedId)
      setTranscript(text)
      chatSessionRef.current = null // Reset chat session when new video is loaded
      setMessages([{ role: "model", text: "Videonun altyazısı başarıyla çekildi! Ben bir yapay zeka asistanıyım. Videoyla ilgili her türlü soruyu bana sorabilirsin, senin için özetleyebilirim veya test hazırlayabilirim." }])
    } catch (err: any) {
      setError(err.message || "Altyazı çekilemedi.")
    } finally {
      setIsFetchingTranscript(false)
    }
  }

  const handleManualSubmit = () => {
    if (!manualTranscript.trim() || !urlInput.trim()) return
    const extractedId = extractVideoId(urlInput)
    if (!extractedId) {
      setError("Geçerli bir YouTube linki girin.")
      return
    }
    setVideoId(extractedId)
    setTranscript(manualTranscript)
    setError(null)
    setShowManualInput(false)
    chatSessionRef.current = null
    setMessages([{ role: "model", text: "Videonun altyazısı manuel olarak başarıyla eklendi! Ben bir yapay zeka asistanıyım. Videoyla ilgili her türlü soruyu bana sorabilirsin." }])
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!chatInput.trim() || !apiKey || !transcript) return

    const userText = chatInput.trim()
    setChatInput("")

    // Check if the user pasted an API key directly into the chat
    // Gemini keys usually start with AIza or AQ. and are 39-50+ chars long.
    if (/^[A-Za-z0-9\-\_\.]{35,60}$/.test(userText)) {
      localStorage.setItem("gemini_api_key", userText)
      setApiKey(userText)
      setIsApiKeySet(true)
      chatSessionRef.current = null // Reset session to use the new API key
      setMessages(prev => [...prev, { role: "model", text: `✅ **Yeni API anahtarınız başarıyla tanımlandı!**

Bağlantınız yenilendi. Test çözmeye veya soru sormaya hemen devam edebilirsiniz.` }])
      return
    }

    setMessages(prev => [...prev, { role: "user", text: userText }])
    setIsChatLoading(true)

    try {
      if (!chatSessionRef.current) {
        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ 
          model: "gemini-3.5-flash",
          systemInstruction: `Sen dünya standartlarında (Khanmigo, Duolingo Max ayarında) bir KPSS Eğitim Yapay Zekasısın.
Sıradan bir bot değilsin; pedagojik formasyona sahip, öğrenciyi düşünmeye sevk eden, motive eden bir 'Süper Eğitmen'sin.

TEMEL KURALLAR:
1. Sokratik Yöntem: Eğer öğrenci bir konuyu anlamadıysa, direkt cevabı yapıştırmak yerine adım adım ipuçları vererek çözüme ulaşmasını sağla.
2. Hafıza Teknikleri (Şifreler): Tarih, Coğrafya, Vatandaşlık gibi konularda akılda kalıcılığı artırmak için akrostişler ve şifreler paylaş.
3. Zaman Damgası (Timestamp): Videodan bir bilgi aktarırken KESİNLİKLE zaman damgasını kullan. Örneğin: "Hoca bu uyarıyı [05:23](#) süresinde yapıyor." Bu damgaları mutlaka markdown linki şeklinde \`[MM:SS](#)\` yazmalısın.
4. Kaliteli Soru Üretimi (ÖSYM / KPSS Formatı):
   - Videodan soru veya test üretirken, SADECE KPSS müfredatına uygun, ÖSYM tarzı analitik sorular hazırla.
   - Videodaki hocanın "Burası çok önemli", "Dikkat", "Sınavda çıkar", "Yıldız atın" şeklinde vurguladığı kritik bilgileri filtrele ve soruları BURADAN sor.
   - Hocanın verdiği anılardan, gereksiz tarihsel teferruatlardan veya sınavda sorulma ihtimali olmayan yan detaylardan KESİNLİKLE soru çıkarma.
   - Seçeneklerdeki çeldiriciler güçlü ve mantıklı olmalı, absürt veya bariz yanlış seçenekler koyma.
5. Konu Anlatımı ve Özetler (KPSS Formatı):
   - Kullanıcı bir konuyu özetlemeni veya anlatmanı istediğinde, gereksiz akademik veya ansiklopedik detaylara girme; bilgileri KPSS müfredatına göre süz.
   - Sadece sınavda çıkma ihtimali yüksek olan, soru değeri taşıyan yerlere odaklan.
   - Kritik noktaları kalın harflerle veya listeler halinde vurgula.
6. İnteraktif Testler (Quiz): Kullanıcı test, soru veya quiz isterse, cevabını MUTLAKA aşağıdaki JSON formatında ve \`\`\`quiz kod bloğu içinde ver (Başka hiçbir açıklama yazmadan doğrudan quiz bloğunu ver):
\`\`\`quiz
[
  {
    "question": "Soru metni",
    "options": ["A şıkkı", "B şıkkı", "C şıkkı", "D şıkkı"],
    "answerIndex": 1,
    "explanation": "Doğru cevap B çünkü... (Hoca bu konuyu [MM:SS](#seek-MM:SS) dakikasında özellikle vurgulamıştır.)"
  }
]
\`\`\`
`
        })
        chatSessionRef.current = model.startChat({
          history: [
            { role: "user", parts: [{ text: `Aşağıdaki video metnini (altyazı) incele. Tüm sorularıma bu metne göre cevap ver:\n\n${transcript}` }] },
            { role: "model", parts: [{ text: "Video metnini dikkatle inceledim ve analiz ettim. Eğitimine yardımcı olmak için hazırım!" }] }
          ]
        })
      }

      const result = await chatSessionRef.current.sendMessageStream(userText)
      
      setMessages(prev => [...prev, { role: "model", text: "" }])
      setIsStreaming(true)
      
      let fullText = ""
      for await (const chunk of result.stream) {
        fullText += chunk.text()
        setMessages(prev => {
          const newMessages = [...prev]
          newMessages[newMessages.length - 1].text = fullText
          return newMessages
        })
        setIsChatLoading(false) // Disable loading animation once we start getting tokens
      }
      setIsStreaming(false)
    } catch (err: any) {
      console.error("Gemini API Error:", err)
      
      let errorMessage = `Bir hata oluştu: ${err.message || "Bilinmeyen hata"}\n\nEğer "API key not valid" hatası alıyorsanız, sağ üstteki çark ikonuna tıklayıp API anahtarınızı güncelleyin.`;
      
      if (err.message && (err.message.includes("429") || err.message.toLowerCase().includes("quota") || err.message.toLowerCase().includes("rate limit"))) {
         errorMessage = `🚨 **Günlük Sınır Doldu!** (Hata 429)

Şu an kullandığınız altyapının ücretsiz limitini doldurdunuz. Ancak merak etmeyin, sistemi **tamamen ücretsiz** kullanmaya devam edebilirsiniz!

Bunu yapabilmek için tek yapmanız gereken yeni bir anahtar (API Key) oluşturmak.

**Adım Adım Ne Yapmalısınız?**
1. **[Buraya Tıklayarak Google AI Studio](https://aistudio.google.com/app/apikey)** sayfasına gidin.
2. Açılan ekranda sol üstteki **"Create API key"** butonuna tıklayıp yeni bir kod (anahtar) oluşturun.
3. Ekranda beliren o uzun şifreli kodu kopyalayın.
4. Şimdi bu sayfaya geri dönün ve **kopyaladığınız kodu doğrudan aşağıdaki sohbet kutusuna yapıştırıp gönderin.**

İşte bu kadar! Asistan yeni anahtarınızı otomatik tanıyacak ve kaldığınız yerden devam edebileceksiniz.`;
      } else if (err.message && err.message.includes("403")) {
         errorMessage = `🚫 **Erişim Reddedildi!** (Hata 403)

Kullandığınız Google hesabının veya API anahtarının yapay zeka hizmetlerine erişimi engellenmiş. Bu genellikle hesabın yeni olması, bölge kısıtlamaları veya Google Cloud güvenlik politikalarından kaynaklanır.

**Çözüm:** 
Lütfen **tamamen farklı ve eski/aktif bir Google hesabı (Gmail)** ile [Google AI Studio](https://aistudio.google.com/app/apikey) sayfasına giriş yapıp yepyeni bir API anahtarı oluşturun ve o kodu doğrudan bu sohbete yapıştırın.`;
      }
      
      setMessages(prev => [...prev, { role: "model", text: errorMessage }])
    } finally {
      setIsChatLoading(false)
      setIsStreaming(false)
    }
  }

  // Settings / API Key View
  if (!isApiKeySet || showSettings) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 p-6 flex flex-col items-center justify-center relative overflow-hidden">
        <FloatingNavbar />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#1cb0f6]/10 blur-[100px] rounded-full pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="bg-white dark:bg-[#1e293b]/90 backdrop-blur-2xl border border-gray-100 dark:border-white/10 p-8 rounded-[2rem] shadow-2xl w-full max-w-md relative z-10"
        >
          {showSettings && isApiKeySet && (
            <button 
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              Kapat
            </button>
          )}
          <div className="w-20 h-20 bg-gradient-to-br from-[#1cb0f6] to-[#1899d6] rounded-[1.5rem] flex items-center justify-center mb-6 mx-auto shadow-lg shadow-[#1cb0f6]/30 rotate-3">
            <KeyRound className="w-10 h-10 text-white -rotate-3" />
          </div>
          <h1 className="text-3xl font-black text-center mb-3 tracking-tight">Erişim İzni</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8 font-medium">
            Akıllı asistanı kullanabilmek için Google Gemini API anahtarına ihtiyacın var. Sadece tarayıcında, güvenle saklanır.
          </p>

          <div className="space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-[#1cb0f6] ml-2 mb-2 block">Gemini API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-50 dark:bg-black/20 border-2 border-slate-200 dark:border-white/10 rounded-2xl px-4 py-4 outline-none focus:border-[#1cb0f6] transition-all font-mono text-sm"
              />
            </div>
            
            <button
              onClick={handleSaveApiKey}
              className="w-full bg-[#58cc02] hover:bg-[#46a302] text-white font-black text-lg py-4 rounded-2xl shadow-[0_5px_0_#46a302] active:shadow-none active:translate-y-[5px] transition-all"
            >
              Kaydet ve Başla
            </button>

            <div className="text-center pt-2">
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-[#1cb0f6] hover:text-[#1899d6] font-bold group">
                Ücretsiz Anahtar Al <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  const processText = (text: string) => {
    // 1. Convert stray [MM:SS] to markdown links [MM:SS](#seek-MM:SS) if they are not already linked
    let t = text.replace(/\[(\d{1,2}:\d{2}(?::\d{2})?)\](?!\()/g, '[$1](#seek-$1)');
    // 2. Convert [MM:SS](#) or [MM:SS](anything) into [MM:SS](#seek-MM:SS)
    t = t.replace(/\[(\d{1,2}:\d{2}(?::\d{2})?)\]\([^)]+\)/g, '[$1](#seek-$1)');
    return t;
  };

  return (
    <div className="h-screen overflow-hidden bg-[#f7f9fc] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <FloatingNavbar />
      
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 lg:p-8 pt-[80px] lg:pt-[90px] flex flex-col relative min-h-0">

        <AnimatePresence mode="wait">
          {!videoId ? (
            /* EMPTY STATE (Hero Section) */
            <motion.div 
              key="empty-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="flex-1 flex flex-col items-center justify-center mt-10 md:mt-20 max-w-3xl mx-auto w-full"
            >
              <div className="relative mb-8 group">
                <div className="absolute inset-0 bg-[#1cb0f6] blur-3xl opacity-20 rounded-full animate-pulse group-hover:opacity-40 transition-opacity" />
                <div className="relative w-28 h-28 bg-gradient-to-br from-[#1cb0f6] to-[#1899d6] rounded-[2rem] flex items-center justify-center shadow-xl shadow-[#1cb0f6]/20 rotate-3 hover:rotate-6 transition-all duration-300">
                  <Bot className="w-14 h-14 text-white -rotate-3" />
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-black text-center mb-4 tracking-tighter text-slate-800 dark:text-white">
                Video <span className="text-[#1cb0f6]">Asistanı</span>
              </h1>
              <p className="text-lg text-slate-500 dark:text-slate-400 text-center mb-10 font-medium max-w-xl">
                YouTube linkini yapıştır, dersin tamamını saniyeler içinde okuyup analiz edeyim. Sorularını yanıtlamak için hazırım!
              </p>

              {showManualInput ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full relative z-10">
                  <div className="bg-white dark:bg-[#1e293b] p-4 sm:p-5 rounded-[2rem] border-2 border-slate-200 dark:border-white/10 shadow-lg flex flex-col gap-3">
                    <div className="flex items-center gap-2 mb-1 px-1">
                      <AlertCircle className="w-5 h-5 text-[#ff2d55]" />
                      <p className="font-bold text-sm text-[#ff2d55]">YouTube otomatik çekimi engelledi.</p>
                    </div>
                    <p className="text-xs font-medium text-slate-500 px-1 mb-2">Videonun altındaki "Transkripti Göster" kısmından metni kopyalayıp buraya yapıştırın:</p>
                    <textarea 
                      value={manualTranscript}
                      onChange={(e) => setManualTranscript(e.target.value)}
                      placeholder="Örn: 0:00 Merhaba arkadaşlar bugünkü dersimizde..."
                      className="w-full h-32 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#1cb0f6] text-sm resize-none font-medium"
                    />
                    <div className="flex gap-2 mt-1">
                      <button onClick={() => setShowManualInput(false)} className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-xl transition-colors text-sm">İptal</button>
                      <button onClick={handleManualSubmit} disabled={!manualTranscript.trim()} className="flex-[2] bg-[#1cb0f6] hover:bg-[#1899d6] disabled:bg-slate-300 text-white font-bold py-3 rounded-xl transition-colors shadow-[0_4px_0_#1899d6] active:shadow-none active:translate-y-1 text-sm">Metni Analiz Et</button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleLoadVideo} className="w-full relative group z-10">
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#1cb0f6] to-[#af52de] rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                  <div className="relative flex items-center bg-white dark:bg-[#1e293b] p-2 rounded-[2rem] border-2 border-slate-200 dark:border-white/10 shadow-lg">
                    <div className="w-12 h-12 flex items-center justify-center shrink-0">
                      <MonitorPlay className="w-6 h-6 text-[#ff2d55]" />
                    </div>
                    <input
                      type="text"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://youtube.com/watch?v=..."
                      className="flex-1 bg-transparent border-none px-2 py-4 outline-none text-lg placeholder:text-slate-400"
                    />
                    <button
                      type="submit"
                      disabled={isFetchingTranscript || !urlInput}
                      className="bg-[#1cb0f6] hover:bg-[#1899d6] disabled:bg-slate-300 disabled:shadow-none text-white font-bold px-8 py-4 rounded-[1.5rem] shadow-[0_4px_0_#1899d6] active:shadow-none active:translate-y-1 transition-all flex items-center gap-2"
                    >
                      {isFetchingTranscript ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6" />}
                      <span className="hidden sm:inline">İncele</span>
                    </button>
                  </div>
                </form>
              )}

              {error && !showManualInput && (
                <div className="mt-6 flex flex-col items-center gap-3 w-full">
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full bg-[#ff2d55]/10 text-[#ff2d55] border-2 border-[#ff2d55]/20 px-6 py-4 rounded-2xl flex items-center gap-3">
                    <AlertCircle className="w-6 h-6 shrink-0" />
                    <div className="flex-1">
                      <p className="font-bold leading-tight">{error}</p>
                    </div>
                  </motion.div>
                  {urlInput && (
                    <button 
                      onClick={() => setShowManualInput(true)} 
                      className="text-[#1cb0f6] font-bold text-sm underline underline-offset-4 hover:text-[#1899d6] transition-colors"
                    >
                      Manuel Olarak Altyazı Ekle
                    </button>
                  )}
                </div>
              )}

              <div className="mt-12 flex flex-wrap justify-center gap-3">
                {QUICK_TIPS.map((tip, idx) => (
                  <div key={idx} className={`flex items-center gap-2 px-4 py-2 rounded-xl ${tip.bg} ${tip.color} border border-white/5`}>
                    <tip.icon className="w-4 h-4" />
                    <span className="font-bold text-sm">{tip.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            /* WORKSPACE (Video loaded) */
            <motion.div 
              key="workspace"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col w-full min-h-0 gap-4"
            >
              {/* Workspace Content */}
              <div className="flex-1 flex flex-col lg:flex-row gap-6 lg:gap-8 min-h-0 h-full overflow-y-auto lg:overflow-hidden">
                {/* LEFT PANEL: Video & Context */}
                <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col gap-4 lg:overflow-y-auto pr-2 pb-4 scrollbar-thin scrollbar-thumb-slate-200 min-h-0 shrink-0">
                  {/* Top Header & Settings */}
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#1cb0f6] to-[#1899d6] rounded-xl flex items-center justify-center shadow-sm">
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="font-black text-xl tracking-tight text-slate-800 dark:text-white">Video Asistanı</h2>
                        <p className="text-xs font-bold text-slate-500">KPSS 2026</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setShowSettings(true)}
                      className="w-10 h-10 shrink-0 rounded-xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 shadow-sm flex items-center justify-center hover:border-[#1cb0f6] transition-all group"
                      title="API Ayarları"
                    >
                      <Settings className="w-5 h-5 text-slate-400 group-hover:text-[#1cb0f6] group-hover:rotate-45 transition-all duration-300" />
                    </button>
                  </div>

                  {/* URL Input */}
                  <form onSubmit={handleLoadVideo} className="flex gap-2 w-full">
                    <div className="flex-1 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1 flex items-center focus-within:border-[#1cb0f6] transition-colors">
                      <input 
                        type="text" 
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="Yeni YouTube URL'si yapıştır..."
                        className="w-full bg-transparent border-none outline-none text-sm font-medium"
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={!urlInput || isFetchingTranscript}
                      className="px-4 shrink-0 bg-[#1cb0f6] hover:bg-[#1899d6] disabled:bg-slate-300 text-white rounded-xl font-bold transition-colors flex items-center justify-center"
                    >
                      {isFetchingTranscript ? <Loader2 className="w-4 h-4 animate-spin" /> : "Aç"}
                    </button>
                  </form>

                  {error && !showManualInput && (
                    <div className="flex flex-col gap-2">
                      <div className="bg-[#ff2d55]/10 text-[#ff2d55] border border-[#ff2d55]/20 p-3 rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <p className="font-bold text-sm">{error}</p>
                      </div>
                      <button 
                        onClick={() => setShowManualInput(true)} 
                        className="text-[#1cb0f6] font-bold text-sm underline underline-offset-4 hover:text-[#1899d6] transition-colors self-start"
                      >
                        Manuel Olarak Altyazı Ekle
                      </button>
                    </div>
                  )}

                  {showManualInput && videoId && (
                    <div className="bg-white dark:bg-[#1e293b] p-4 rounded-2xl border-2 border-[#1cb0f6]/20 shadow-sm flex flex-col gap-3">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="w-5 h-5 text-[#ff2d55]" />
                        <p className="font-bold text-sm text-[#ff2d55]">YouTube otomatik çekimi engelledi.</p>
                      </div>
                      <p className="text-xs font-medium text-slate-500">Videonun altındaki "Transkripti Göster" kısmından metni kopyalayıp buraya yapıştırın:</p>
                      <textarea 
                        value={manualTranscript}
                        onChange={(e) => setManualTranscript(e.target.value)}
                        placeholder="Örn: 0:00 Merhaba arkadaşlar..."
                        className="w-full h-32 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-[#1cb0f6] text-sm resize-none font-medium"
                      />
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setShowManualInput(false)} className="flex-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 font-bold py-2.5 rounded-xl transition-colors text-sm">İptal</button>
                        <button type="button" onClick={handleManualSubmit} disabled={!manualTranscript.trim()} className="flex-[2] bg-[#1cb0f6] hover:bg-[#1899d6] disabled:bg-slate-300 text-white font-bold py-2.5 rounded-xl transition-colors shadow-[0_4px_0_#1899d6] active:shadow-none active:translate-y-1 text-sm">Metni Analiz Et</button>
                      </div>
                    </div>
                  )}

                  {/* Video Player */}
                  <div className="bg-white dark:bg-[#1e293b] p-2 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm w-full shrink-0">
                    <div className="relative w-full h-0 pb-[56.25%] rounded-xl overflow-hidden bg-black pointer-events-auto">
                    <iframe
                      ref={iframeRef}
                      key={`youtube-${videoId}`}
                      className="absolute top-0 left-0 w-full h-full border-0"
                      src={`https://www.youtube-nocookie.com/embed/${videoId}?controls=1&rel=0&enablejsapi=1`}
                      title="YouTube video player"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>

                {/* Transcript Loading State */}
                <AnimatePresence>
                  {isFetchingTranscript && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 24 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      className="border-2 border-[#1cb0f6]/30 bg-[#1cb0f6]/5 rounded-[2rem] p-6 shadow-sm relative overflow-hidden"
                    >
                      <div className="flex flex-col items-center justify-center py-2 gap-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-[#1cb0f6] blur-xl opacity-20 rounded-full animate-pulse" />
                          <Loader2 className="w-8 h-8 animate-spin text-[#1cb0f6] relative z-10" />
                        </div>
                        <p className="font-bold text-[#1cb0f6] animate-pulse">Yapay zeka videonun içeriğini çıkarıyor...</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* RIGHT PANEL: Chat UI */}
              <div className="flex-1 bg-white dark:bg-[#1e293b] border-2 border-slate-200 dark:border-white/5 rounded-[2rem] shadow-xl flex flex-col overflow-hidden relative min-h-[500px] lg:min-h-0 h-full">
                {/* Header (Compacted) */}
                <div className="bg-slate-50 dark:bg-black/20 border-b-2 border-slate-200 dark:border-white/5 px-4 py-2.5 flex justify-between items-center z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#1cb0f6] rounded-lg flex items-center justify-center text-white shadow-sm">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                      <h2 className="font-black text-sm tracking-tight leading-none">Eğitim Asistanı</h2>
                      <p className="text-[10px] font-bold text-[#58cc02] uppercase tracking-widest flex items-center gap-1 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#58cc02] animate-pulse" /> Çevrimiçi
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scroll-smooth bg-[#f8fafc] dark:bg-transparent">
                  {messages.map((msg, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      key={idx} 
                      className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                    >
                      {msg.role === "model" && (
                        <div className="w-8 h-8 rounded-full bg-[#1cb0f6] text-white flex items-center justify-center shrink-0 mt-1">
                          <Bot className="w-5 h-5" />
                        </div>
                      )}
                      <div className={`p-4 rounded-2xl shadow-sm ${
                        msg.role === "user" 
                          ? "bg-[#1cb0f6] text-white rounded-tr-sm" 
                          : "bg-white dark:bg-[#2a364a] border border-slate-100 dark:border-white/5 text-slate-700 dark:text-slate-200 rounded-tl-sm text-[14px]"
                      }`}>
                        {msg.role === "user" ? (
                          <div className="whitespace-pre-wrap font-medium leading-relaxed">{msg.text}</div>
                        ) : (
                          <ReactMarkdown components={markdownComponents}>
                            {processText(msg.text)}
                          </ReactMarkdown>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  
                  {isChatLoading && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3 max-w-[85%] mr-auto">
                      <div className="w-8 h-8 rounded-full bg-[#1cb0f6] text-white flex items-center justify-center shrink-0 mt-1">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div className="p-4 rounded-2xl bg-white dark:bg-[#2a364a] border border-slate-100 dark:border-white/5 rounded-tl-sm shadow-sm flex items-center gap-1.5 h-[50px]">
                        <motion.span animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut", delay: 0 }} className="w-2 h-2 rounded-full bg-[#1cb0f6]" />
                        <motion.span animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut", delay: 0.3 }} className="w-2 h-2 rounded-full bg-[#1cb0f6]" />
                        <motion.span animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 0.9, ease: "easeInOut", delay: 0.6 }} className="w-2 h-2 rounded-full bg-[#1cb0f6]" />
                      </div>
                    </motion.div>
                  )}
                  <div ref={chatEndRef} className="h-2" />
                </div>

                {/* Quick Actions & Input Area */}
                <div className="flex flex-col bg-white dark:bg-[#1e293b] border-t border-slate-100 dark:border-white/5 z-10 p-3">
                  <div className="flex gap-1 overflow-x-auto scrollbar-none mb-2">
                    <button onClick={() => setChatInput("Bana bu video içeriğinden 3 soruluk bir test hazırla")} className="whitespace-nowrap px-2.5 py-1 bg-[#1cb0f6]/10 text-[#1cb0f6] hover:bg-[#1cb0f6]/20 font-bold text-[11px] rounded-lg transition-colors">🎯 Test Hazırla</button>
                    <button onClick={() => setChatInput("En kritik 5 hap bilgiyi özetler misin?")} className="whitespace-nowrap px-2.5 py-1 bg-[#ff9500]/10 text-[#ff9500] hover:bg-[#ff9500]/20 font-bold text-[11px] rounded-lg transition-colors">⚡ Hap Bilgi Çıkar</button>
                    <button onClick={() => setChatInput("Bu konuyu akılda tutmak için şifre veya hafıza taktiği var mı?")} className="whitespace-nowrap px-2.5 py-1 bg-[#af52de]/10 text-[#af52de] hover:bg-[#af52de]/20 font-bold text-[11px] rounded-lg transition-colors">🧠 Hafıza Taktikleri</button>
                  </div>
                  
                  <form onSubmit={handleSendMessage} className="relative flex items-end gap-2">
                    <div className="flex-1 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 focus-within:border-[#1cb0f6] rounded-xl transition-colors p-0.5">
                      <textarea
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        disabled={!transcript || isChatLoading}
                        placeholder={transcript ? "Videoyla ilgili detaylı bir soru sor..." : "Önce video yükleyin..."}
                        className="w-full bg-transparent border-none px-3 py-2 outline-none resize-none max-h-32 min-h-[40px] text-sm font-medium disabled:opacity-50"
                        rows={1}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={!chatInput.trim() || !transcript || isChatLoading}
                      className="bg-[#1cb0f6] hover:bg-[#1899d6] disabled:bg-slate-300 disabled:shadow-none text-white w-10 h-10 rounded-xl shadow-sm active:shadow-none active:translate-y-0.5 transition-all flex items-center justify-center shrink-0"
                    >
                      <Send className="w-4 h-4 ml-0.5" />
                    </button>
                  </form>
                  <p className="text-[9px] text-center text-slate-400 mt-2 font-bold uppercase tracking-wider">
                    Shift + Enter ile alt satır. Asistan hata yapabilir.
                  </p>
                </div>
              </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
