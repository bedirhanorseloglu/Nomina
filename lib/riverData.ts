export type RiverFeature = {
  id: string;
  name: string;
  story: string;
  blank: string;
  options: string[];
  type: "yurtdisina_dokulen" | "yurt_icinden_gelen" | "karstik" | "acik_havza" | "diger";
};

export const RIVER_FEATURES: RiverFeature[] = [
  {
    id: "coruh",
    name: "Çoruh Nehri",
    story: "Doğu Karadeniz'den doğarım. Akış hızım ve hidroelektrik potansiyelim çok yüksektir. Sularımı Gürcistan (Batum) üzerinden _____ dökerim.",
    blank: "Karadeniz'e",
    options: ["Karadeniz'e", "Hazar'a", "Basra'ya", "Ege'ye"],
    type: "yurtdisina_dokulen"
  },
  {
    id: "firat",
    name: "Fırat Nehri",
    story: "Kaynağımı Türkiye'den alır, Mezopotamya'yı oluştururum. Üzerimde Atatürk ve Keban barajları bulunur. Suriye üzerinden geçip _____ dökülürüm.",
    blank: "Basra Körfezi'ne",
    options: ["Hazar Gölü'ne", "Basra Körfezi'ne", "Kızıldeniz'e", "Akdeniz'e"],
    type: "yurtdisina_dokulen"
  },
  {
    id: "dicle",
    name: "Dicle Nehri",
    story: "Türkiye'den doğup Fırat ile birleşirim (Şattül Arap). Önemli kollarım Botan Çayı ve _____ suyudur.",
    blank: "Zap",
    options: ["Arpaçay", "Zap", "Karasu", "Murat"],
    type: "yurtdisina_dokulen"
  },
  {
    id: "aras",
    name: "Aras Nehri",
    story: "Türkiye'de doğup Ermenistan ile doğal sınır çizerim. Okyanusa bağlantım olmadığı için sularımı _____ döker ve kapalı havza oluştururum.",
    blank: "Hazar Gölü'ne",
    options: ["Karadeniz'e", "Aral Gölü'ne", "Hazar Gölü'ne", "Basra'ya"],
    type: "yurtdisina_dokulen"
  },
  {
    id: "kura",
    name: "Kura Nehri",
    story: "Tıpkı Aras nehri gibi ben de Türkiye'de doğup Hazar Gölü'ne döküldüğüm için bir _____ havzasıyım.",
    blank: "Kapalı",
    options: ["Açık", "Kapalı", "Karstik", "Karma"],
    type: "yurtdisina_dokulen"
  },
  {
    id: "meric",
    name: "Meriç Nehri",
    story: "Bulgaristan'dan doğar, Yunanistan ile sınır çizerim. Kendi adımla bir delta oluşturur ve en çok _____ tarımıyla öne çıkarım.",
    blank: "Pirinç",
    options: ["Pamuk", "Buğday", "Pirinç", "Mısır"],
    type: "yurt_icinden_gelen"
  },
  {
    id: "asi",
    name: "Asi Nehri",
    story: "Lübnan dağlarından kaynağımı alıp, Suriye üzerinden _____ ilimize geçerek Akdeniz'e dökülürüm.",
    blank: "Hatay",
    options: ["Adana", "Mersin", "Hatay", "Antalya"],
    type: "yurt_icinden_gelen"
  },
  {
    id: "kopru_cayi",
    name: "Köprü Çayı",
    story: "Antalya çevresinde karstik yeraltı sularından beslenirim. Debim yüksek olduğu için _____ faaliyetlerine çok uygunum.",
    blank: "Rafting",
    options: ["Taşımacılık", "Rafting", "Balıkçılık", "Sörf"],
    type: "karstik"
  },
  {
    id: "manavgat",
    name: "Manavgat Nehri",
    story: "Karstik kaynakla beslendiğim için (kireçtaşı arazisi) yıl içinde su seviyem fazla değişmez. Bu yüzden rejimim daha _____.",
    blank: "Düzenlidir",
    options: ["Düzensizdir", "Düzenlidir", "Kurudur", "Taşkındır"],
    type: "karstik"
  },
  {
    id: "kizilirmak",
    name: "Kızılırmak",
    story: "Sivas Kızıldağ'dan doğup Karadeniz'e dökülürüm. Sınırlarımız içinde doğup dökülen en _____ akarsuyum. Bafra Deltası'nı ben oluştururum.",
    blank: "Uzun",
    options: ["Kısa", "Kirli", "Temiz", "Uzun"],
    type: "acik_havza"
  },
  {
    id: "yesilirmak",
    name: "Yeşilırmak",
    story: "Orta Karadeniz'den denize dökülerek _____ Deltası'nı oluştururum. Önemli kollarım Kelkit ve Çekerek sularıdır.",
    blank: "Çarşamba",
    options: ["Bafra", "Çarşamba", "Çukurova", "Silifke"],
    type: "acik_havza"
  },
  {
    id: "sakarya",
    name: "Sakarya Nehri",
    story: "Ege'den doğup İç Anadolu, Karadeniz ve Marmara gibi tam dört bölge değiştiririm. Çok bölge geçtiğim için _____ oranım fazladır.",
    blank: "Kirlenme",
    options: ["Buharlaşma", "Kirlenme", "Debi", "Aşındırma"],
    type: "acik_havza"
  },
  {
    id: "susurluk",
    name: "Susurluk Nehri",
    story: "Güney Marmara'dan doğarak Marmara Denizi'ne dökülürüm. Yükseltinin az olduğu yerlerde aktığım için enerji potansiyelim _____.",
    blank: "Düşüktür",
    options: ["Yüksektir", "Düşüktür", "Değişkendir", "Düzenlidir"],
    type: "acik_havza"
  },
  {
    id: "goksu",
    name: "Göksu Nehri",
    story: "Akdeniz'e döküldüğüm yerde Silifke Deltası'nı oluştururum. Benim sularım Mavi Tünel projesiyle _____ ovasını sulamak için taşınır.",
    blank: "Konya",
    options: ["Çukurova", "Konya", "Harran", "Antalya"],
    type: "acik_havza"
  },
  {
    id: "bartin",
    name: "Bartın Çayı",
    story: "Türkiye'nin akarsuları genellikle denge profiline ulaşmadığı için taşımacılığa uygun değildir. Ancak ben istisnayım, üzerimde _____ yapılabilir.",
    blank: "Taşımacılık",
    options: ["Elektrik Üretimi", "Taşımacılık", "İnci Avcılığı", "Rafting"],
    type: "diger"
  },
  {
    id: "dragon",
    name: "Dragon Çayı",
    story: "Kuzey Kıbrıs Su Temini projesi kapsamında, borularla deniz altından sularım _____ adasına taşınır.",
    blank: "Kıbrıs",
    options: ["Girit", "Kıbrıs", "Rodos", "Malta"],
    type: "diger"
  }
];

export type RiverPath = {
  id: string;
  name: string;
  coordinates: [number, number][]; // [lng, lat]
};

// Yaklaşık koordinatlar (Haritada nehirleri çizmek için görsel temsiller)
export const RIVER_PATHS: RiverPath[] = [
  {
    id: "kizilirmak",
    name: "Kızılırmak",
    coordinates: [
      [38.0, 39.8], // Sivas
      [36.0, 39.0], // Kayseri civarı
      [34.0, 39.2], // Kırşehir civarı
      [33.5, 40.0], // Ankara civarı kıvrım
      [34.5, 41.0], // Çorum
      [36.0, 41.7]  // Bafra Deltası (Samsun)
    ]
  },
  {
    id: "yesilirmak",
    name: "Yeşilırmak",
    coordinates: [
      [38.5, 40.2], // Sivas kuzeyi
      [37.0, 40.6], // Tokat
      [36.2, 41.0], // Amasya
      [36.6, 41.4]  // Çarşamba Deltası
    ]
  },
  {
    id: "sakarya",
    name: "Sakarya",
    coordinates: [
      [31.0, 39.0], // Afyonkarahisar / Eskişehir sınırı
      [30.5, 39.8], // Eskişehir
      [31.2, 40.2], // Ankara batısı
      [30.4, 40.8], // Adapazarı
      [30.6, 41.1]  // Karadeniz (Karasu)
    ]
  },
  {
    id: "susurluk",
    name: "Susurluk",
    coordinates: [
      [29.0, 39.2], // Kütahya/Balıkesir
      [28.2, 39.8], // Susurluk
      [28.4, 40.4]  // Marmara Denizi
    ]
  },
  {
    id: "bakircay",
    name: "Bakırçay",
    coordinates: [
      [28.0, 39.2], // Manisa kuzeyi
      [27.3, 39.1], // Bergama
      [26.9, 38.9]  // Çandarlı Körfezi
    ]
  },
  {
    id: "gediz",
    name: "Gediz",
    coordinates: [
      [29.0, 39.0], // Murat Dağı
      [28.2, 38.6], // Salihli
      [27.4, 38.6], // Manisa
      [26.8, 38.6]  // İzmir Körfezi
    ]
  },
  {
    id: "kucuk_menderes",
    name: "Küçük Menderes",
    coordinates: [
      [28.2, 38.2], // Bozdağlar
      [27.7, 38.1], // Ödemiş
      [27.3, 37.9]  // Selçuk / Ege Denizi
    ]
  },
  {
    id: "buyuk_menderes",
    name: "Büyük Menderes",
    coordinates: [
      [30.0, 38.0], // Dinar / Afyon
      [29.0, 37.8], // Denizli
      [27.8, 37.8], // Aydın
      [27.2, 37.5]  // Milet / Ege Denizi
    ]
  },
  {
    id: "firat",
    name: "Fırat",
    coordinates: [
      [41.5, 39.9], // Erzurum (Karasu/Murat)
      [39.0, 38.8], // Elazığ (Keban)
      [38.0, 37.8], // Adıyaman (Atatürk)
      [38.0, 36.8], // Suriye sınırı çıkışı
      [40.0, 34.0]  // Irak'a doğru uzantı
    ]
  },
  {
    id: "dicle",
    name: "Dicle",
    coordinates: [
      [39.5, 38.5], // Elazığ Hazar gölü
      [40.0, 37.9], // Diyarbakır
      [41.0, 37.5], // Batman
      [42.5, 37.2], // Şırnak/Cizre Suriye/Irak sınırı
      [43.0, 36.0]  // Irak içine
    ]
  },
  {
    id: "coruh",
    name: "Çoruh",
    coordinates: [
      [40.0, 40.2], // Bayburt
      [41.0, 40.8], // Artvin
      [41.6, 41.5]  // Gürcistan Batum Karadeniz
    ]
  },
  {
    id: "meric",
    name: "Meriç",
    coordinates: [
      [26.3, 42.0], // Bulgaristan
      [26.5, 41.6], // Edirne
      [26.1, 40.7]  // Enez Ege Denizi
    ]
  },
  {
    id: "aras",
    name: "Aras",
    coordinates: [
      [41.5, 39.5], // Erzurum Bingöl dağları
      [43.0, 40.0], // Kars Arpaçay birleşimi
      [44.5, 39.8], // Iğdır Ermenistan sınırı
      [46.0, 39.5]  // Hazar'a doğru
    ]
  },
  {
    id: "kura",
    name: "Kura",
    coordinates: [
      [42.5, 41.0], // Ardahan Göle
      [43.0, 41.1], // Ardahan
      [43.5, 41.2], // Gürcistan sınırı
      [45.0, 40.5]  // Hazar'a doğru
    ]
  },
  {
    id: "seyhan",
    name: "Seyhan",
    coordinates: [
      [36.0, 38.5], // Kayseri/Sivas güneyi
      [35.5, 37.5], // Adana Toroslar
      [34.9, 36.7]  // Çukurova
    ]
  },
  {
    id: "ceyhan",
    name: "Ceyhan",
    coordinates: [
      [37.5, 38.2], // Elbistan / Maraş kuzeyi
      [36.9, 37.5], // Maraş
      [35.8, 37.0], // Osmaniye batısı
      [35.6, 36.6]  // İskenderun Körfezi / Çukurova
    ]
  },
  {
    id: "goksu",
    name: "Göksu",
    coordinates: [
      [32.5, 37.0], // Hadim / Konya güneyi
      [33.2, 36.5], // Mut
      [34.0, 36.3]  // Silifke
    ]
  },
  {
    id: "asi",
    name: "Asi",
    coordinates: [
      [36.5, 34.0], // Lübnan
      [36.5, 36.0], // Suriye
      [36.2, 36.2], // Hatay
      [35.9, 36.1]  // Samandağ Akdeniz
    ]
  },
  {
    id: "kopru_cayi",
    name: "Köprü Çayı",
    coordinates: [
      [31.2, 37.5], // Isparta / Antalya sınırı
      [31.2, 37.1], // Beşkonak / Köprülü Kanyon
      [31.2, 36.8]  // Antalya Körfezi
    ]
  },
  {
    id: "manavgat",
    name: "Manavgat",
    coordinates: [
      [31.8, 37.3], // Toroslar
      [31.4, 36.8], // Manavgat şelalesi
      [31.4, 36.7]  // Akdeniz
    ]
  },
  {
    id: "aksu",
    name: "Aksu",
    coordinates: [
      [30.8, 37.6], // Eğirdir güneyi
      [30.8, 37.0], // Antalya ovası
      [30.9, 36.8]  // Akdeniz
    ]
  },
  {
    id: "bartin",
    name: "Bartın",
    coordinates: [
      [32.5, 41.5], // Küre Dağları
      [32.3, 41.6], // Bartın
      [32.2, 41.7]  // Karadeniz
    ]
  },
  {
    id: "filyos",
    name: "Filyos",
    coordinates: [
      [32.6, 40.6], // Gerede / Karabük civarı
      [32.0, 41.2], // Çaycuma
      [32.0, 41.6]  // Filyos Karadeniz
    ]
  },
  {
    id: "dalaman",
    name: "Dalaman",
    coordinates: [
      [29.4, 37.2], // Gölhisar / Burdur
      [28.8, 36.8], // Dalaman
      [28.7, 36.7]  // Akdeniz
    ]
  }
];
