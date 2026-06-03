"use client";

import { useAuth } from "@/contexts/AuthContext";
import { motion, useScroll, useTransform } from "framer-motion";
import { Target, Trophy, TrendingUp, Sparkles, BookOpen, Clock, ShieldCheck, Users } from "lucide-react";
import { useState, useRef } from "react";

export default function LandingPage() {
  const { signInWithGoogle } = useAuth();
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacityFade = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  };

  const itemAnim = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-slate-50 font-sans selection:bg-accent/20 overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200/50 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-emerald-400 text-white flex items-center justify-center text-lg font-black shadow-lg shadow-accent/20">
              K
            </div>
            <span className="text-xl font-black tracking-tight text-slate-800">
              KPSS 2026
            </span>
          </div>
          <button
            onClick={signInWithGoogle}
            className="hidden sm:flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-full font-bold hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-900/20"
          >
            Giriş Yap / Kayıt Ol
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 px-6 overflow-hidden min-h-[90vh] flex flex-col items-center justify-center">
        {/* Floating Background Shapes */}
        <motion.div 
          animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }} 
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-[10%] w-32 h-32 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" 
        />
        <motion.div 
          animate={{ y: [0, 30, 0], rotate: [0, -10, 0] }} 
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-40 right-[15%] w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" 
        />
        
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/10 blur-[100px] rounded-full pointer-events-none" />
        
        <motion.div 
          style={{ y: heroY, opacity: opacityFade }}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 20 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200/50 shadow-sm text-sm font-bold text-slate-600 mb-8 hover:shadow-md transition-shadow cursor-default"
          >
            <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            Türkiye'nin En Modern KPSS Platformu
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, type: "spring", damping: 25 }}
            className="text-5xl sm:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-8"
          >
            KPSS'ye Hazırlanmanın <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-emerald-400 inline-block hover:scale-105 transition-transform cursor-default">
              Oyunlaştırılmış
            </span> Yolu.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl text-slate-500 font-medium max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Sıradan takip programlarını unutun. Deneme analizleri, rekabetçi liderlik tabloları ve oyunlaştırılmış hedeflerle çalışmayı bağımlılık haline getirin.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <button
              onClick={signInWithGoogle}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="w-full sm:w-auto relative group overflow-hidden rounded-full bg-accent text-white px-8 py-4 font-black text-lg transition-all hover:scale-105 active:scale-95 shadow-[0_20px_40px_-15px_rgba(59,130,246,0.5)]"
            >
              <div className={`absolute inset-0 bg-white/20 transition-transform duration-300 ${isHovered ? 'translate-x-0' : '-translate-x-full'}`} />
              <span className="relative flex items-center gap-2">
                Hemen Ücretsiz Başla <TrendingUp className="w-5 h-5" />
              </span>
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
            className="relative mx-auto max-w-5xl group"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-50 z-10 h-full w-full pointer-events-none opacity-80" />
            <motion.img 
              whileHover={{ y: -10, rotateX: 2 }}
              src="/landing_hero.png" 
              alt="KPSS Dashboard Mockup" 
              className="w-full h-auto rounded-[2rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] border-4 border-white/80 object-cover transform-gpu transition-all duration-700" 
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Visual Showcase Section */}
      <section className="py-20 bg-slate-50 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-amber-400/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 relative">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative z-10"
            >
              <img src="/landing_leaderboard.png" alt="Leaderboard Gamification" className="w-full rounded-[2rem] shadow-2xl border-4 border-white rotate-2 hover:rotate-0 transition-transform duration-500" />
            </motion.div>
          </div>
          <div className="order-1 md:order-2 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 font-bold text-sm">
              <Trophy className="w-4 h-4" /> Rekabet Et, Yüksel
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">Oyunlaştırma ile Çalışmak Artık Zevkli.</h2>
            <p className="text-lg text-slate-500 font-medium leading-relaxed">
              Sadece netlerini girme, binlerce rakibinin arasında Elmas Lige çıkmak için savaş! Rozetler kazan, serini koru ve her denemede kendi sınırlarını zorla.
            </p>
          </div>
        </div>
      </section>

      {/* Analytics & Mobile Showcase Section */}
      <section className="py-24 bg-white overflow-hidden relative border-t border-slate-100">
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-blue-400/10 blur-[100px] rounded-full pointer-events-none -translate-y-1/2" />
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 font-bold text-sm">
              <TrendingUp className="w-4 h-4" /> Gelişmiş Analitik
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">Netlerinizi Kusursuz Şekilde Analiz Edin.</h2>
            <p className="text-lg text-slate-500 font-medium leading-relaxed mb-6">
              Hangi branşta yükseliyorsunuz, hangi konuda geriliyorsunuz? Dribbble kalitesindeki muazzam grafiklerle gelişiminizi bir bakışta anlayın.
            </p>
            <motion.img 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              src="/landing_analytics.png" 
              alt="Analytics Graph Mockup" 
              className="w-full rounded-[2rem] shadow-2xl border-4 border-slate-50 hover:scale-[1.02] transition-transform duration-500" 
            />
          </div>
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative z-10"
            >
              <img src="/landing_mobile.png" alt="Mobile App Mockup" className="w-[85%] mx-auto rounded-[2.5rem] shadow-2xl border-8 border-slate-100 -rotate-3 hover:rotate-0 transition-transform duration-500" />
            </motion.div>
            <div className="absolute top-1/2 right-0 bg-white p-6 rounded-3xl shadow-xl border border-slate-100 w-64 -translate-y-1/2 translate-x-12 hidden lg:block">
              <h4 className="font-black text-slate-800 mb-2">Her Yerde Sizinle</h4>
              <p className="text-sm text-slate-500 font-medium">Bulut senkronizasyonu sayesinde telefonda, tablette ve bilgisayarda kesintisiz deneyim.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Badges Showcase Section */}
      <section className="py-24 bg-slate-900 overflow-hidden relative text-white">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative z-10"
            >
              <img src="/landing_badges.png" alt="3D Gamification Badges" className="w-full rounded-[2rem] shadow-2xl border-4 border-white/10 hover:scale-[1.05] transition-transform duration-500" />
            </motion.div>
          </div>
          <div className="order-1 md:order-2 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-purple-500/20 border border-purple-400/30 text-purple-300 font-bold text-sm">
              <Sparkles className="w-4 h-4" /> Koleksiyonunu Tamamla
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">Emeklerinizin Karşılığı Olan 3D Rozetler.</h2>
            <p className="text-lg text-slate-300 font-medium leading-relaxed">
              Çalıştıkça XP kazanın. İlk 1000 soruyu çözdüğünüzde veya matematikte rekor kırdığınızda profilinize muazzam 3D rozetler eklensin.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50 border-t border-slate-200/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl sm:text-5xl font-black text-slate-900 mb-4"
            >
              Neden Bizimle Çalışmalısın?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-slate-500 font-medium text-lg"
            >
              Başarıya giden yolda ihtiyacın olan her şey tek bir ekranda.
            </motion.p>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <motion.div variants={itemAnim}>
              <FeatureCard 
                icon={<Target className="w-6 h-6 text-blue-500" />}
                title="Detaylı İstatistikler"
                desc="Çözdüğünüz denemelerin netlerini grafiklerle görün, eksik olduğunuz konuları anında tespit edin."
                color="bg-blue-50"
              />
            </motion.div>
            <motion.div variants={itemAnim}>
              <FeatureCard 
                icon={<Trophy className="w-6 h-6 text-amber-500" />}
                title="Liderlik ve Rekabet"
                desc="Türkiye genelindeki diğer KPSS öğrencileriyle yarışın, altın lige tırmanmak için daha çok çalışın."
                color="bg-amber-50"
              />
            </motion.div>
            <motion.div variants={itemAnim}>
              <FeatureCard 
                icon={<BookOpen className="w-6 h-6 text-purple-500" />}
                title="Konu Takibi"
                desc="Tüm KPSS müfredatını % ilerleme barlarıyla takip edin, biten konuları işaretleyip rahatlayın."
                color="bg-purple-50"
              />
            </motion.div>
            <motion.div variants={itemAnim}>
              <FeatureCard 
                icon={<Clock className="w-6 h-6 text-emerald-500" />}
                title="Zaman Yönetimi"
                desc="Kalan süreyi saniye saniye görün, günlük planlayıcı ile çalışma rutininizi düzene sokun."
                color="bg-emerald-50"
              />
            </motion.div>
            <motion.div variants={itemAnim}>
              <FeatureCard 
                icon={<ShieldCheck className="w-6 h-6 text-rose-500" />}
                title="Bulut Senkronizasyonu"
                desc="Verileriniz güvenle bulutta saklanır. Telefondan, tabletten veya bilgisayardan anında erişin."
                color="bg-rose-50"
              />
            </motion.div>
            <motion.div variants={itemAnim}>
              <FeatureCard 
                icon={<Users className="w-6 h-6 text-cyan-500" />}
                title="Büyük Bir Topluluk"
                desc="Gelişmiş kullanıcı profilleri sayesinde rakiplerinizin başarılarını inceleyin ve kıyaslama yapın."
                color="bg-cyan-50"
              />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-900 text-slate-400 text-center text-sm font-medium">
        <p>© 2026 KPSS Komuta Merkezi. Sınav yolculuğunuzda başarılar dileriz.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, color }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 border-b-4 hover:-translate-y-1 transition-transform cursor-default">
      <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center mb-6`}>
        {icon}
      </div>
      <h3 className="text-xl font-black text-slate-800 mb-3">{title}</h3>
      <p className="text-slate-500 font-medium leading-relaxed text-sm">{desc}</p>
    </div>
  );
}
