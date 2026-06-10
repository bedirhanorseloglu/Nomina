import { Subject, UniversityClass } from "@/types"

export const UNIVERSITY_CLASSES: UniversityClass[] = [
  {
    id: "yzk401-1",
    courseCode: "YZK-401",
    courseName: "Yapay Zekâ ve Kolaylaştırıcı Araçlar",
    date: "2026-04-28",   // Salı
    startTime: "14:00",
    endTime: "16:00",
    lessonNumber: 12,
    locked: true
  },
  {
    id: "yzk402-1",
    courseCode: "YZK-402",
    courseName: "Yapay Zekâ ve Makine Öğrenmesi",
    date: "2026-04-29",   // Çarşamba
    startTime: "10:00",
    endTime: "13:00",
    lessonNumber: 12,
    locked: true
  },
  {
    id: "yzk402-2",
    courseCode: "YZK-402",
    courseName: "Yapay Zekâ ve Makine Öğrenmesi",
    date: "2026-05-01",   // Cuma
    startTime: "14:00",
    endTime: "17:00",
    lessonNumber: 13,
    locked: true
  },
  {
    id: "yzk401-2",
    courseCode: "YZK-401",
    courseName: "Yapay Zekâ ve Kolaylaştırıcı Araçlar",
    date: "2026-05-05",   // Salı
    startTime: "14:00",
    endTime: "16:00",
    lessonNumber: 13,
    locked: true
  },
  {
    id: "yzk402-3",
    courseCode: "YZK-402",
    courseName: "Yapay Zekâ ve Makine Öğrenmesi",
    date: "2026-05-08",   // Cuma
    startTime: "14:00",
    endTime: "17:00",
    lessonNumber: 14,
    locked: true
  }
]

export const initialData: Subject[] = [
  {
    id: "turkce",
    title: "Türkçe",
    tip: "Anlam bilgisi temeldir ve her gün paragraf çözmek rutinin olmalıdır.",
    color: "#1cb0f6",
    category: "Genel Yetenek",
    subCategory: "Sözel",
    icon: "📘",
    topics: [
      { id: "tr-1", title: "Sözcükte ve Söz Öbeklerinde Anlam", done: false, isRoutine: true, questionCount: "3-5 (Top.)" },
      { id: "tr-2", title: "Cümlede Anlam", done: false, isRoutine: true, questionCount: "3-5 (Top.)" },
      { id: "tr-3", title: "Paragrafta Anlam", done: false, isRoutine: true, questionCount: "18-20" },
      { id: "tr-4", title: "Ses Bilgisi", done: false, questionCount: "2-3 (Top.)" },
      { id: "tr-5", title: "Yapı Bilgisi (Kök, Ek, Gövde)", done: false, questionCount: "2-3 (Top.)" },
      { id: "tr-6", title: "Sözcük Türleri (İsim, Sıfat, Zamir, Zarf, Edat, Bağlaç, Ünlem)", done: false, questionCount: "2-3 (Top.)" },
      { id: "tr-7", title: "Fiiller (Eylemler), Ek Fiil, Fiilimsi", done: false, questionCount: "2-3 (Top.)" },
      { id: "tr-8", title: "Cümle Ögeleri", done: false, questionCount: "2-3 (Top.)" },
      { id: "tr-9", title: "Cümle Türleri", done: false, questionCount: "2-3 (Top.)" },
      { id: "tr-10", title: "Yazım Kuralları", done: false, questionCount: "2 (Top.)" },
      { id: "tr-11", title: "Noktalama İşaretleri", done: false, questionCount: "2 (Top.)" },
      { id: "tr-12", title: "Anlatım Bozuklukları", done: false },
      { id: "tr-13", title: "Sözel Mantık", done: false, questionCount: "3-4" }
    ]
  },
  {
    id: "matematik",
    title: "Matematik",
    tip: "Matematik kümülatif bir derstir. Oran-Orantı ve Denklem Çözme problemlerin omurgasıdır.",
    color: "#af52de",
    category: "Genel Yetenek",
    subCategory: "Sayısal",
    icon: "📐",
    topics: [
      { id: "mat-1", title: "Temel Kavramlar (Rakam, Sayı Kümeleri, Tek-Çift Sayılar vb.)", done: false, questionCount: "7-9 (Top.)" },
      { id: "mat-2", title: "Ardışık Sayılar ve Faktöriyel", done: false, questionCount: "7-9 (Top.)" },
      { id: "mat-3", title: "Sayı Basamakları (Çözümleme)", done: false, questionCount: "7-9 (Top.)" },
      { id: "mat-4", title: "Bölme ve Bölünebilme Kuralları", done: false, questionCount: "7-9 (Top.)" },
      { id: "mat-5", title: "Asal Çarpanlara Ayırma ve EBOB-EKOK", done: false, questionCount: "7-9 (Top.)" },
      { id: "mat-6", title: "Rasyonel ve Ondalık Sayılar", done: false, questionCount: "7-9 (Top.)" },
      { id: "mat-7", title: "Basit Eşitsizlikler", done: false, questionCount: "3-4 (Top.)" },
      { id: "mat-8", title: "Mutlak Değer", done: false, questionCount: "3-4 (Top.)" },
      { id: "mat-9", title: "Üslü Sayılar", done: false, questionCount: "7-9 (Top.)" },
      { id: "mat-10", title: "Köklü Sayılar", done: false, questionCount: "7-9 (Top.)" },
      { id: "mat-11", title: "Çarpanlara Ayırma", done: false, questionCount: "3-4 (Top.)" },
      { id: "mat-12", title: "Oran-Orantı ve Denklem Çözme", done: false, questionCount: "3-4 (Top.)" },
      { id: "mat-13", title: "Sayı ve Kesir Problemleri", done: false, isRoutine: true, questionCount: "10-12 (Top.)" },
      { id: "mat-14", title: "Yaş Problemleri", done: false, isRoutine: true, questionCount: "10-12 (Top.)" },
      { id: "mat-15", title: "İşçi Problemleri", done: false, isRoutine: true, questionCount: "10-12 (Top.)" },
      { id: "mat-16", title: "Hareket (Hız) Problemleri", done: false, isRoutine: true, questionCount: "10-12 (Top.)" },
      { id: "mat-17", title: "Yüzde, Kar-Zarar Problemleri", done: false, isRoutine: true, questionCount: "10-12 (Top.)" },
      { id: "mat-18", title: "Karışım Problemleri", done: false, isRoutine: true, questionCount: "10-12 (Top.)" },
      { id: "mat-19", title: "Grafik ve Tablo Problemleri", done: false, isRoutine: true, questionCount: "10-12 (Top.)" },
      { id: "mat-20", title: "Kümeler ve Fonksiyonlar", done: false, questionCount: "2-3 (Top.)" },
      { id: "mat-21", title: "Permütasyon, Kombinasyon ve Olasılık", done: false, questionCount: "2-3 (Top.)" },
      { id: "mat-22", title: "Sayısal Mantık", done: false, questionCount: "3-4" }
    ]
  },
  {
    id: "geometri",
    title: "Geometri",
    tip: "Üçgenler tüm konuların temelidir. Üçgenleri anlamadan diğer konulara geçilmemelidir.",
    color: "#00c1d5",
    category: "Genel Yetenek",
    subCategory: "Sayısal",
    icon: "📐",
    topics: [
      { id: "geo-1", title: "Doğruda ve Üçgende Açılar", done: false, questionCount: "3-4 (Top.)" },
      { id: "geo-2", title: "Üçgende Uzunluk ve Alan (Dik, İkizkenar, Eşkenar üçgenler)", done: false, questionCount: "3-4 (Top.)" },
      { id: "geo-3", title: "Üçgende Açıortay, Kenarortay ve Benzerlik", done: false, questionCount: "3-4 (Top.)" },
      { id: "geo-4", title: "Çokgenler ve Dörtgenler (Kare, Dikdörtgen, Paralelkenar vb.)", done: false, questionCount: "3-4 (Top.)" },
      { id: "geo-5", title: "Çember ve Daire", done: false, questionCount: "3-4 (Top.)" },
      { id: "geo-6", title: "Analitik Geometri", done: false, questionCount: "3-4 (Top.)" },
      { id: "geo-7", title: "Katı Cisimler", done: false, questionCount: "3-4 (Top.)" }
    ]
  },
  {
    id: "tarih",
    title: "Tarih",
    tip: "Olayları sebep-sonuç ilişkisine göre kronolojik olarak çalışmalısın.",
    color: "#ff9500",
    category: "Genel Kültür",
    subCategory: "Sosyal",
    icon: "🏛",
    topics: [
      { id: "hist-1", title: "İslamiyet Öncesi Türk Tarihi", done: false, questionCount: "1" },
      { id: "hist-2", title: "İlk Türk-İslam Devletleri", done: false, questionCount: "2" },
      { id: "hist-3", title: "Osmanlı Devleti Kuruluş ve Yükselme Dönemleri (Siyasi Tarih)", done: false, questionCount: "2" },
      { id: "hist-4", title: "Osmanlı Devleti Kültür ve Uygarlığı", done: false, questionCount: "3-4" },
      { id: "hist-5", title: "Osmanlı Devleti Duraklama, Gerileme ve Dağılma Dönemleri", done: false, questionCount: "2-3" },
      { id: "hist-6", title: "XX. Yüzyılda Osmanlı Devleti", done: false, questionCount: "2" },
      { id: "hist-7", title: "Kurtuluş Savaşı Hazırlık Dönemi ve I. TBMM", done: false, questionCount: "4-5 (Top.)" },
      { id: "hist-8", title: "Kurtuluş Savaşı Muharebeler Dönemi", done: false, questionCount: "4-5 (Top.)" },
      { id: "hist-9", title: "Atatürk İlke ve İnkılapları", done: false, questionCount: "4-5" },
      { id: "hist-10", title: "Atatürk Dönemi İç ve Dış Politika", done: false, questionCount: "1-2" },
      { id: "hist-11", title: "Çağdaş Türk ve Dünya Tarihi", done: false, questionCount: "3" }
    ]
  },
  {
    id: "cografya",
    title: "Coğrafya",
    tip: "Harita bilgisi gerektirir. Fiziki haritayı oturtmadan beşeri konulara geçilmemelidir.",
    color: "#58cc02",
    category: "Genel Kültür",
    subCategory: "Sosyal",
    icon: "🗺",
    topics: [
      { id: "cog-1", title: "Türkiye'nin Coğrafi Konumu", done: false, questionCount: "1" },
      { id: "cog-2", title: "Türkiye'nin Yer Şekilleri ve Su Kaynakları", done: false, questionCount: "3-4" },
      { id: "cog-3", title: "Türkiye'nin İklimi ve Bitki Örtüsü", done: false, questionCount: "2-3" },
      { id: "cog-4", title: "Türkiye'de Nüfus ve Yerleşme (Beşeri Coğrafya)", done: false, questionCount: "2-3" },
      { id: "cog-5", title: "Türkiye'de Tarım ve Hayvancılık", done: false, questionCount: "2" },
      { id: "cog-6", title: "Türkiye'de Madenler ve Enerji Kaynakları", done: false, questionCount: "2-3" },
      { id: "cog-7", title: "Türkiye'de Sanayi, Ticaret ve Ulaşım", done: false, questionCount: "3-4" },
      { id: "cog-8", title: "Türkiye'de Turizm ve Bölgesel Kalkınma Projeleri", done: false, questionCount: "1" }
    ]
  },
  {
    id: "vatandaslik",
    title: "Vatandaşlık",
    tip: "Unutmaya müsait olduğu için sınava son 3-4 ay kala başlanması veya sık tekrarı önerilir.",
    color: "#5856d6",
    category: "Vatandaşlık",
    subCategory: "Hukuk",
    icon: "⚖️",
    topics: [
      { id: "vat-1", title: "Hukukun Temel Kavramları", done: false, questionCount: "2-3" },
      { id: "vat-2", title: "Devlet Biçimleri ve Demokrasi", done: false },
      { id: "vat-3", title: "Türk Anayasa Tarihi", done: false, questionCount: "1 (Top.)" },
      { id: "vat-4", title: "1982 Anayasası ve Temel Hak/Hürriyetler", done: false, questionCount: "1 (Top.)" },
      { id: "vat-5", title: "Yasama", done: false, questionCount: "1" },
      { id: "vat-6", title: "Yürütme", done: false, questionCount: "1" },
      { id: "vat-7", title: "Yargı", done: false, questionCount: "1" },
      { id: "vat-8", title: "İdare Hukuku", done: false, questionCount: "2" }
    ]
  },
  {
    id: "guncel-bilgiler",
    title: "Güncel Bilgiler",
    tip: "Güncel olaylar ve genel kültür birikimi sınavda 6 soru olarak karşına gelir.",
    color: "#ff2d55",
    category: "Genel Kültür",
    subCategory: "Sosyal",
    icon: "🌍",
    topics: [
      { id: "gun-1", title: "Güncel Bilgiler ve Genel Kültür", done: false, questionCount: "6" }
    ]
  }
]
