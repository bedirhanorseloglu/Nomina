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
    id: "matematik",
    title: "Matematik",
    category: "Genel Yetenek",
    subCategory: "Sayısal",
    icon: "📐",
    topics: [
      // Problemler (Priority 1)
      { id: "m9",  title: "Oran-Orantı",                     done: false },
      { id: "m10", title: "Yüzde Hesapları",                 done: false },
      { id: "m11", title: "Faiz Problemleri",                done: false },
      { id: "m12", title: "Yaş Problemleri",                 done: false },
      { id: "m13", title: "İşçi-Havuz Problemleri",          done: false },
      { id: "m14", title: "Hız Problemleri",                 done: false },
      { id: "m15", title: "Karışım Problemleri",             done: false },
      // Sayılar (Priority 2)
      { id: "m1",  title: "Sayılar ve Sayı Sistemleri",      done: false },
      { id: "m2",  title: "Bölme-Bölünebilme",              done: false },
      { id: "m3",  title: "OBEB-OKEK",                       done: false },
      { id: "m4",  title: "Asal Sayılar",                    done: false },
      { id: "m5",  title: "Tam Sayılar",                     done: false },
      { id: "m6",  title: "Rasyonel Sayılar",                done: false },
      // Olasılık (Priority 3)
      { id: "m20", title: "Permütasyon",                     done: false },
      { id: "m21", title: "Kombinasyon",                     done: false },
      { id: "m22", title: "Olasılık",                        done: false },
      // Geometri (Priority 4)
      { id: "m24", title: "Üçgenler",                        done: false },
      { id: "m25", title: "Çokgenler",                       done: false },
      { id: "m26", title: "Çember",                          done: false },
      { id: "m27", title: "Alan-Çevre",                      done: false },
      // Diğer (Priority 5)
      { id: "m7",  title: "Üslü Sayılar",                    done: false },
      { id: "m8",  title: "Köklü Sayılar",                   done: false },
      { id: "m16", title: "1. Dereceden Denklemler",         done: false },
      { id: "m17", title: "Eşitsizlikler",                   done: false },
      { id: "m18", title: "Fonksiyonlar",                    done: false },
      { id: "m19", title: "Polinomlar",                      done: false },
      { id: "m23", title: "Ortalama-Medyan-Mod",             done: false }
    ]
  },
  {
    id: "turkce",
    title: "Türkçe",
    category: "Genel Yetenek",
    subCategory: "Sözel",
    icon: "📘",
    topics: [
      // Paragraf (Priority 1)
      { id: "t15", title: "Paragrafta Ana Fikir",     done: false },
      { id: "t16", title: "Paragrafta Başlık",        done: false },
      { id: "t17", title: "Boşluk Doldurma",         done: false },
      // Anlatım Bozuklukları (Priority 2)
      { id: "t21", title: "Anlatım Bozuklukları",     done: false },
      // Cümle Bilgisi (Priority 3)
      { id: "t11", title: "Cümlenin Ögeleri",         done: false },
      { id: "t12", title: "Cümle Türleri",            done: false },
      // Anlam Bilgisi (Priority 4)
      { id: "t1",  title: "Sözcükte Anlam",          done: false },
      { id: "t2",  title: "Cümlede Anlam",            done: false },
      { id: "t20", title: "Deyim ve Atasözleri",      done: false },
      // Diğer (Priority 5)
      { id: "t3",  title: "Sözcük Türleri",           done: false },
      { id: "t4",  title: "İsim",                     done: false },
      { id: "t5",  title: "Sıfat",                    done: false },
      { id: "t6",  title: "Zamir",                    done: false },
      { id: "t7",  title: "Zarf",                     done: false },
      { id: "t8",  title: "Edat-Bağlaç-Ünlem",        done: false },
      { id: "t9",  title: "Fiil",                     done: false },
      { id: "t10", title: "Fiilimsi",                 done: false },
      { id: "t13", title: "Yazım Kuralları",          done: false },
      { id: "t14", title: "Noktalama İşaretleri",     done: false },
      { id: "t18", title: "Ses Bilgisi",              done: false },
      { id: "t19", title: "Yapı Bilgisi (Kök-Ek)",   done: false }
    ]
  },
  {
    id: "turk-edebiyati",
    title: "Türk Edebiyatı",
    category: "Genel Kültür",
    subCategory: "Sözel",
    icon: "📚",
    topics: [
      { id: "e9",  title: "Cumhuriyet Dönemi Edebiyatı",       done: false },
      { id: "e10", title: "Önemli Eserler ve Yazarlar",        done: false },
      { id: "e1",  title: "İslamiyet Öncesi Türk Edebiyatı",   done: false },
      { id: "e2",  title: "Divan Edebiyatı",                   done: false },
      { id: "e3",  title: "Halk Edebiyatı",                    done: false },
      { id: "e4",  title: "Tanzimat Edebiyatı 1. Dönem",       done: false },
      { id: "e5",  title: "Tanzimat Edebiyatı 2. Dönem",       done: false },
      { id: "e6",  title: "Servet-i Fünun",                    done: false },
      { id: "e7",  title: "Fecr-i Ati",                        done: false },
      { id: "e8",  title: "Milli Edebiyat",                    done: false }
    ]
  },
  {
    id: "turkiye-tarihi",
    title: "Türkiye Tarihi",
    category: "Genel Kültür",
    subCategory: "Sosyal",
    icon: "🏛",
    topics: [
      // Kurtuluş Savaşı (Priority 1)
      { id: "tr15", title: "Kurtuluş Savaşı Cepheleri",           done: false },
      { id: "tr16", title: "Mudanya ve Lozan",                    done: false },
      { id: "tr12", title: "Mustafa Kemal'in Anadolu'ya Geçişi",  done: false },
      { id: "tr13", title: "Kongreler Dönemi",                    done: false },
      // Osmanlı Son Dönem (Priority 2)
      { id: "tr4",  title: "Dağılma Dönemi",                      done: false },
      { id: "tr5",  title: "Tanzimat Fermanı",                    done: false },
      { id: "tr6",  title: "Islahat Fermanı",                     done: false },
      { id: "tr7",  title: "I. Meşrutiyet",                       done: false },
      { id: "tr8",  title: "II. Meşrutiyet",                      done: false },
      { id: "tr10", title: "I. Dünya Savaşı ve Osmanlı",          done: false },
      { id: "tr11", title: "Mondros Mütarekesi",                  done: false },
      // Cumhuriyet Dönemi (Priority 3)
      { id: "tr14", title: "TBMM'nin Açılması",                   done: false },
      { id: "tr17", title: "Cumhuriyetin İlanı",                  done: false },
      { id: "tr18", title: "Halifeliğin Kaldırılması",            done: false },
      { id: "tr19", title: "Çok Partili Hayat Denemeleri",        done: false },
      { id: "tr20", title: "Atatürk Sonrası Türkiye",             done: false },
      // Klasik Dönem (Priority 4)
      { id: "tr1",  title: "Osmanlı Kuruluş Dönemi",              done: false },
      { id: "tr2",  title: "Yükselme Dönemi",                     done: false },
      { id: "tr3",  title: "Duraklama ve Gerileme",               done: false },
      { id: "tr9",  title: "Balkan Savaşları",                    done: false }
    ]
  },
  {
    id: "ataturk-ilkeleri",
    title: "Atatürk İlkeleri",
    category: "Genel Kültür",
    subCategory: "Sosyal",
    icon: "🌊",
    topics: [
      { id: "ai1", title: "Cumhuriyetçilik",       done: false },
      { id: "ai2", title: "Milliyetçilik",          done: false },
      { id: "ai3", title: "Halkçılık",              done: false },
      { id: "ai4", title: "Devletçilik",            done: false },
      { id: "ai5", title: "Laiklik",                done: false },
      { id: "ai6", title: "Devrimcilik",            done: false },
      { id: "ai7", title: "Bütünleyici İlkeler",    done: false }
    ]
  },
  {
    id: "cografya",
    title: "Coğrafya",
    category: "Genel Kültür",
    subCategory: "Sosyal",
    icon: "🗺",
    topics: [
      // 7 Bölge (Priority 1)
      { id: "c13", title: "Marmara Bölgesi",                  done: false },
      { id: "c14", title: "Ege Bölgesi",                      done: false },
      { id: "c15", title: "Akdeniz Bölgesi",                  done: false },
      { id: "c16", title: "İç Anadolu Bölgesi",               done: false },
      { id: "c17", title: "Karadeniz Bölgesi",                done: false },
      { id: "c18", title: "Doğu Anadolu Bölgesi",             done: false },
      { id: "c19", title: "Güneydoğu Anadolu Bölgesi",        done: false },
      // İklim (Priority 2)
      { id: "c2",  title: "İklim Bölgeleri",                  done: false },
      { id: "c21", title: "Dünya İklim Tipleri",              done: false },
      // Kaynaklar (Priority 3)
      { id: "c9",  title: "Tarım Ürünleri ve Bölgeleri",      done: false },
      { id: "c10", title: "Madenler",                         done: false },
      { id: "c11", title: "Enerji Kaynakları",                done: false },
      // Diğer (Priority 4)
      { id: "c1",  title: "Türkiye'nin Konumu ve Sınırları",  done: false },
      { id: "c3",  title: "Akarsular",                        done: false },
      { id: "c4",  title: "Göller",                           done: false },
      { id: "c5",  title: "Dağlar",                           done: false },
      { id: "c6",  title: "Ovalar ve Platolar",               done: false },
      { id: "c7",  title: "Nüfus Dağılımı",                  done: false },
      { id: "c8",  title: "Göç Hareketleri",                  done: false },
      { id: "c12", title: "Ulaşım Ağları",                    done: false },
      { id: "c20", title: "Dünya Kıtaları",                   done: false },
      { id: "c22", title: "Dünya Nüfusu",                     done: false },
      { id: "c23", title: "Ekonomik Coğrafya",                done: false }
    ]
  },
  {
    id: "vatandaslik",
    title: "Vatandaşlık / Anayasa",
    category: "Vatandaşlık",
    subCategory: "Hukuk",
    icon: "⚖️",
    topics: [
      // Yürütme/Yasama (Priority 1)
      { id: "v7",  title: "Yürütme (Cumhurbaşkanlığı Hükümet Sistemi)",     done: false },
      { id: "v6",  title: "Yasama (TBMM Yapısı ve Görevleri)",              done: false },
      // Haklar (Priority 2)
      { id: "v4",  title: "Temel Hak Türleri",                              done: false },
      { id: "v5",  title: "Temel Hakların Sınırlandırılması",               done: false },
      // Yerel Yönetimler (Priority 3)
      { id: "v14", title: "Yerel Yönetimler (İl Özel İdaresi / Belediye / Köy)", done: false },
      // Diğer (Priority 4)
      { id: "v1",  title: "Devlet Kavramı ve Unsurları",                    done: false },
      { id: "v2",  title: "Hukuk Sistemleri",                               done: false },
      { id: "v3",  title: "1982 Anayasası Genel İlkeler",                   done: false },
      { id: "v8",  title: "Yargı (Anayasa Mahkemesi / Danıştay / Yargıtay)", done: false },
      { id: "v9",  title: "Seçim Sistemi",                                  done: false },
      { id: "v10", title: "Siyasi Partiler",                                done: false },
      { id: "v11", title: "Olağanüstü Hal",                                 done: false },
      { id: "v12", title: "İdare Hukuku Temelleri",                         done: false },
      { id: "v13", title: "Kamu Personel Hukuku",                           done: false }
    ]
  },
  {
    id: "guncel-bilgiler",
    title: "Güncel Bilgiler",
    category: "Genel Kültür",
    subCategory: "Hukuk",
    icon: "🌍",
    topics: [
      { id: "g1", title: "Türkiye Ekonomisi Temelleri",          done: false },
      { id: "g2", title: "AB ve Türkiye",                        done: false },
      { id: "g3", title: "Uluslararası Kuruluşlar (BM/NATO/IMF/DB)", done: false },
      { id: "g4", title: "Türkiye'nin Dış Politikası",           done: false },
      { id: "g5", title: "2024–2025 Önemli Gelişmeler",          done: false }
    ]
  }
]
