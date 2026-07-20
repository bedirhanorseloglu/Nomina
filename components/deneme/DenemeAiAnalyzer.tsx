import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Loader2, Bot, AlertTriangle } from "lucide-react";
import { DenemeRecord } from "@/lib/denemeUtils";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from "react-markdown";

interface DenemeAiAnalyzerProps {
  isOpen: boolean;
  onClose: () => void;
  denemeler: DenemeRecord[];
}

export default function DenemeAiAnalyzer({ isOpen, onClose, denemeler }: DenemeAiAnalyzerProps) {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Format denemeler to a readable string for the AI prompt
  const formatDenemelerForPrompt = () => {
    if (denemeler.length === 0) return "Henüz girilmiş bir deneme bulunmamaktadır.";
    
    // Sadece en son 10 denemeyi alalım ki token sınırı aşılmasın
    const recentDenemeler = [...denemeler]
      .sort((a, b) => b.date - a.date)
      .slice(0, 10);
      
    let promptData = "Öğrencinin son denemeleri:\n\n";
    
    recentDenemeler.forEach((d, index) => {
      promptData += `${index + 1}. ${d.examType === "genel" ? "Genel Deneme" : "Branş Denemesi"}\n`;
      promptData += `Tarih: ${new Date(d.date).toLocaleDateString("tr-TR")}\n`;
      d.scores.forEach(s => {
        const net = s.correct - (s.wrong / 4);
        promptData += `- ${s.subjectId}: ${s.correct} Doğru, ${s.wrong} Yanlış (Net: ${net})\n`;
      });
      promptData += "\n";
    });
    
    return promptData;
  };

  const startAnalysis = async () => {
    const apiKey = localStorage.getItem("gemini_api_key");
    if (!apiKey) {
      setError("Lütfen profil ayarlarınızdan Gemini API anahtarınızı girin.");
      return;
    }

    if (denemeler.length === 0) {
      setError("Analiz yapabilmek için en az 1 deneme girmiş olmalısınız.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-3.5-flash",
        systemInstruction: `Sen dünya standartlarında bir KPSS Eğitim Yapay Zekasısın. 
Görevin, öğrencinin gönderdiği deneme sınavı (genel ve branş) sonuçlarını detaylıca analiz etmektir.
- Hangi konularda veya derslerde zayıf olduğunu tespit et.
- Hangi alanlara ağırlık vermesi gerektiği ile ilgili eyleme geçirilebilir, motive edici ve yapılandırılmış (madde madde) bir çalışma programı ve stratejisi sun.
- Lütfen markdown formatını kullanarak tablolar, listeler ve kalın yazılar ile görsel olarak zengin bir yanıt ver.
- Doğrudan samimi bir öğretmen gibi konuş (örneğin "Harika gidiyorsun!", "Şuraya biraz daha dikkat etmeliyiz" gibi).`
      });

      const prompt = formatDenemelerForPrompt();
      const result = await model.generateContentStream(prompt);
      
      let fullText = "";
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        setAnalysis(fullText);
        setIsAnalyzing(false); // Stop the loading spinner as soon as the first chunk arrives
      }
    } catch (err: any) {
      if (err.message && err.message.includes("403")) {
        setError("API Anahtarınızın erişimi reddedildi (Hata 403). Lütfen farklı bir Google hesabı ile AI Studio'dan yeni bir anahtar alın.");
      } else if (err.message && err.message.includes("429")) {
        setError("Günlük API limitiniz doldu (Hata 429). Lütfen yeni bir API anahtarı kullanın.");
      } else if (err.message && err.message.includes("503")) {
        setError("Google Gemini sunucuları şu anda aşırı yoğun veya geçici olarak hizmet dışı (Hata 503). Lütfen birkaç dakika sonra tekrar deneyin.");
      } else if (err.message && err.message.includes("404")) {
        setError("Kullanılan yapay zeka modeli bulunamadı (Hata 404). Sistem yöneticisiyle iletişime geçin.");
      } else {
        setError("Analiz sırasında Google kaynaklı geçici bir hata oluştu. Lütfen tekrar deneyin.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setAnalysis(null);
      setError(null);
      setIsAnalyzing(false);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop with sophisticated blur */}
          <motion.div
            className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Content - Premium Glassmorphism */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] bg-white/90 dark:bg-[#0b1121]/90 backdrop-blur-xl shadow-2xl border border-white/50 dark:border-white/10 flex flex-col overflow-hidden"
          >
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-400/10 dark:bg-blue-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-400/10 dark:bg-purple-500/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between p-6 sm:p-8 border-b border-slate-200/50 dark:border-white/5">
              <div className="flex items-center gap-4">
                <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30 overflow-hidden group">
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                  <Bot className="w-7 h-7 text-white drop-shadow-md z-10 group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                    AI Deneme Analizi
                  </h2>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    Kişiselleştirilmiş Performans Koçun
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="group relative w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-slate-500 transition-all hover:rotate-90 duration-300"
              >
                <X className="w-5 h-5 group-hover:text-slate-800 dark:group-hover:text-white transition-colors" />
              </button>
            </div>

            {/* Body */}
            <div className="relative z-10 flex-1 overflow-y-auto p-6 sm:p-10 custom-scrollbar">
              {!analysis && !isAnalyzing && !error && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-8 py-16">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />
                    <div className="relative w-28 h-28 rounded-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-2xl">
                      <Sparkles className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="max-w-lg">
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Hazırsan Başlayalım!</h3>
                    <p className="text-base font-medium text-slate-500 dark:text-slate-400 mb-10 leading-relaxed">
                      Geçmiş deneme sonuçlarını derinlemesine inceleyerek, sana özel ve tamamen hedefe yönelik bir strateji haritası çıkaracağız.
                    </p>
                    <button
                      onClick={startAnalysis}
                      className="group relative px-8 py-4 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black shadow-2xl shadow-slate-900/20 dark:shadow-white/10 transition-all hover:-translate-y-1 active:translate-y-0 overflow-hidden flex items-center gap-3 mx-auto"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <Sparkles className="w-5 h-5 relative z-10" />
                      <span className="relative z-10 text-lg">Hemen Analiz Et</span>
                    </button>
                  </div>
                </div>
              )}

              {isAnalyzing && !analysis && (
                <div className="flex flex-col items-center justify-center h-full space-y-8 py-24">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-slate-200/50 dark:border-slate-700/50"></div>
                    <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-blue-600 dark:border-blue-400 border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-purple-600 dark:border-purple-400 border-l-transparent animate-spin animation-delay-200" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                    <Bot className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-pulse" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Verilerin İşleniyor</h3>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                      Yapay zeka deneme geçmişini inceliyor, zayıf noktalarını tespit edip sana özel bir rota çiziyor...
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-6 border border-red-100 dark:border-red-500/20 shadow-inner">
                    <AlertTriangle className="w-10 h-10 text-red-500" />
                  </div>
                  <p className="text-base font-bold text-slate-700 dark:text-slate-300 mb-8 max-w-sm leading-relaxed">{error}</p>
                  <button
                    onClick={startAnalysis}
                    className="px-8 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-xl hover:-translate-y-1 active:translate-y-0"
                  >
                    Tekrar Dene
                  </button>
                </div>
              )}

              {analysis && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="prose prose-slate prose-sm sm:prose-base dark:prose-invert max-w-none 
                    prose-headings:font-black prose-headings:tracking-tight prose-headings:text-slate-900 dark:prose-headings:text-white 
                    prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:leading-relaxed 
                    prose-li:text-slate-600 dark:prose-li:text-slate-300 
                    prose-strong:text-blue-600 dark:prose-strong:text-blue-400 prose-strong:font-black 
                    prose-a:text-blue-500 hover:prose-a:text-blue-600 
                    prose-table:border-collapse prose-table:w-full prose-table:rounded-2xl prose-table:overflow-hidden prose-table:shadow-sm
                    prose-th:bg-slate-100 dark:prose-th:bg-slate-800 prose-th:p-4 prose-th:font-black prose-th:text-slate-700 dark:prose-th:text-slate-300 prose-th:text-left
                    prose-td:p-4 prose-td:border-b border-slate-100 dark:prose-td:border-white/5 
                    bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-md p-8 sm:p-10 rounded-[2.5rem] shadow-xl border border-white dark:border-white/10"
                >
                  <ReactMarkdown>{analysis}</ReactMarkdown>
                </motion.div>
              )}
            </div>
            
            {/* Footer */}
            {analysis && (
              <div className="relative z-10 p-5 sm:p-6 border-t border-slate-200/50 dark:border-white/5 bg-white/90 dark:bg-[#0b1121]/90 backdrop-blur-md flex justify-end">
                <button
                  onClick={startAnalysis}
                  className="group relative px-6 py-3 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-blue-600 dark:hover:bg-blue-500 text-slate-700 dark:text-slate-300 hover:text-white font-bold text-sm transition-all flex items-center gap-2 border border-transparent shadow-sm hover:shadow-blue-500/25 overflow-hidden"
                >
                  <Sparkles className="w-4 h-4 text-blue-500 group-hover:text-white transition-colors relative z-10" />
                  <span className="relative z-10">Yeni Analiz İste</span>
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
