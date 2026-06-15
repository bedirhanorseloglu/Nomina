export type MapPointType = "tektonik" | "karstik" | "volkanik" | "heyelan" | "aluvyal" | "kiyi" | "karma" | "kivrim" | "kirik" | "plato" | "tabaka" | "lav" | "asinim" | "delta" | "kiyiduzlugu" | "buzul" | "traverten" | "baraj";

export interface MapPoint {
  id: string;
  name: string;
  type: string;
  lng: number; 
  lat: number; 
  description?: string;
}

export interface MapTopic {
  id: string;
  title: string;
  description: string;
  points: MapPoint[];
}

export const TURKEY_LAKES: MapPoint[] = [
  // TEKTONİK GÖLLER
  { id: "tuz", name: "Tuz Gölü", type: "tektonik", lng: 33.33, lat: 38.83, description: "Tektonik" },
  { id: "beysehir", name: "Beyşehir", type: "karma", lng: 31.53, lat: 37.78, description: "Tektonik + Karstik" }, 
  { id: "egirdir", name: "Eğirdir", type: "karma", lng: 30.86, lat: 38.05, description: "Tektonik + Karstik" },
  { id: "manyas", name: "Manyas (Kuş)", type: "tektonik", lng: 27.96, lat: 40.18, description: "Tektonik" },
  { id: "ulubat", name: "Ulubat Gölü", type: "tektonik", lng: 28.43, lat: 40.16, description: "Tektonik" },
  { id: "iznik", name: "İznik Gölü", type: "tektonik", lng: 29.53, lat: 40.43, description: "Tektonik" },
  { id: "sapanca", name: "Sapanca Gölü", type: "tektonik", lng: 30.26, lat: 40.71, description: "Tektonik" },
  { id: "burdur", name: "Burdur Gölü", type: "tektonik", lng: 30.18, lat: 37.73, description: "Tektonik" },
  { id: "hazar", name: "Hazar Gölü", type: "tektonik", lng: 39.38, lat: 38.48, description: "Tektonik (Elazığ)" },
  { id: "aksehir", name: "Akşehir Gölü", type: "tektonik", lng: 31.45, lat: 38.50, description: "Tektonik" },
  { id: "eber", name: "Eber Gölü", type: "tektonik", lng: 31.15, lat: 38.62, description: "Tektonik" },
  { id: "seyfe", name: "Seyfe Gölü", type: "tektonik", lng: 34.38, lat: 39.20, description: "Tektonik" },
  { id: "aktas", name: "Aktaş Gölü", type: "tektonik", lng: 43.18, lat: 41.20, description: "Tektonik (Sınır Gölü)" },
  
  // KARSTİK GÖLLER
  { id: "salda", name: "Salda Gölü", type: "karstik", lng: 29.68, lat: 37.55, description: "Karstik (Türkiye'nin Maldivleri)" },
  { id: "kestel", name: "Kestel Gölü", type: "karstik", lng: 30.28, lat: 37.41, description: "Karstik" },
  { id: "sugla", name: "Suğla Gölü", type: "karma", lng: 32.03, lat: 37.33, description: "Tektonik + Karstik" },
  { id: "elmali", name: "Elmalı", type: "karstik", lng: 29.9, lat: 36.7, description: "Karstik" },
  { id: "avlan", name: "Avlan", type: "karstik", lng: 29.95, lat: 36.58, description: "Karstik" },
  { id: "kiziloren", name: "Kızılören (Obruk)", type: "karstik", lng: 33.1, lat: 38.1, description: "Karstik (Obruk)" },

  // VOLKANİK GÖLLER
  { id: "nemrut", name: "Nemrut Gölü", type: "volkanik", lng: 42.23, lat: 38.63, description: "Volkanik (Kaldera)" },
  { id: "meke", name: "Meke Tuzlası", type: "volkanik", lng: 33.63, lat: 37.71, description: "Volkanik (Maar)" },
  { id: "golcuk", name: "Gölcük Gölü", type: "volkanik", lng: 30.51, lat: 37.73, description: "Volkanik (Krater)" },
  { id: "aygir", name: "Aygır Gölü", type: "volkanik", lng: 43.43, lat: 40.83, description: "Volkanik" },

  // HEYELAN SET GÖLLERİ
  { id: "tortum", name: "Tortum Gölü", type: "heyelan", lng: 41.65, lat: 40.61, description: "Heyelan Set (Erzurum)" },
  { id: "sera", name: "Sera Gölü", type: "heyelan", lng: 39.61, lat: 40.98, description: "Heyelan Set (Trabzon)" },
  { id: "abant", name: "Abant Gölü", type: "heyelan", lng: 31.28, lat: 40.60, description: "Heyelan Set (Bolu)" },
  { id: "yedigoller", name: "Yedigöller", type: "heyelan", lng: 31.76, lat: 40.94, description: "Heyelan Set (Bolu)" },
  { id: "borabay", name: "Borabay Gölü", type: "heyelan", lng: 36.16, lat: 40.81, description: "Heyelan Set (Amasya)" },

  // ALÜVYAL SET GÖLLERİ
  { id: "mogan", name: "Mogan Gölü", type: "aluvyal", lng: 32.79, lat: 39.76, description: "Alüvyal Set (Ankara)" },
  { id: "eymir", name: "Eymir Gölü", type: "aluvyal", lng: 32.82, lat: 39.82, description: "Alüvyal Set (Ankara)" },
  { id: "bafa", name: "Bafa (Çamiçi)", type: "aluvyal", lng: 27.46, lat: 37.50, description: "Alüvyal Set (Ege)" },
  { id: "koycegiz", name: "Köyceğiz Gölü", type: "aluvyal", lng: 28.66, lat: 36.91, description: "Alüvyal Set (Muğla)" },
  { id: "marmara_gol", name: "Marmara Gölü", type: "aluvyal", lng: 28.01, lat: 38.61, description: "Alüvyal Set (Manisa)" },
  { id: "uzungol", name: "Uzungöl", type: "karma", lng: 40.28, lat: 40.61, description: "Alüvyal + Heyelan Set" },

  // VOLKANİK SET GÖLLERİ
  { id: "cildir", name: "Çıldır Gölü", type: "volkanik", lng: 43.25, lat: 41.03, description: "Volkanik Set" }, 
  { id: "ercek", name: "Erçek Gölü", type: "volkanik", lng: 43.56, lat: 38.66, description: "Volkanik Set" },
  { id: "nazik", name: "Nazik Gölü", type: "volkanik", lng: 42.28, lat: 38.85, description: "Volkanik Set" },
  { id: "balik", name: "Balık Gölü", type: "volkanik", lng: 43.56, lat: 39.76, description: "Volkanik Set" },
  { id: "hacli", name: "Haçlı Gölü", type: "volkanik", lng: 42.31, lat: 39.01, description: "Volkanik Set" },

  // KIYI SET GÖLLERİ
  { id: "buyukcekmece", name: "Büyükçekmece", type: "kiyi", lng: 28.55, lat: 41.05, description: "Kıyı Set (İstanbul)" },
  { id: "kucukcekmece", name: "Küçükçekmece", type: "kiyi", lng: 28.75, lat: 41.01, description: "Kıyı Set (İstanbul)" },
  { id: "terkos", name: "Terkos (Durusu)", type: "kiyi", lng: 28.56, lat: 41.33, description: "Kıyı Set (İstanbul)" },
  { id: "akyatan", name: "Akyatan Gölü", type: "kiyi", lng: 35.25, lat: 36.61, description: "Kıyı Set (Adana)" },

  // BUZUL GÖLLERİ
  { id: "aynali", name: "Aynalı (Uludağ)", type: "buzul", lng: 29.21, lat: 40.05, description: "Buzul Gölü" },
  { id: "cilo_sat", name: "Kırmızıtaş (Cilo)", type: "buzul", lng: 44.00, lat: 37.50, description: "Buzul Gölü" },
  { id: "kackar_gol", name: "Karagöl (Kaçkar)", type: "buzul", lng: 41.1, lat: 40.8, description: "Buzul Gölü" },

  // TRAVERTEN SET GÖLÜ
  { id: "otlukbeli", name: "Otlukbeli Gölü", type: "traverten", lng: 39.98, lat: 39.99, description: "Traverten Set (Erzincan)" },

  // BARAJ GÖLLERİ (YAPAY)
  { id: "ataturk", name: "Atatürk Barajı", type: "baraj", lng: 38.31, lat: 37.48, description: "Fırat Üzerinde" },
  { id: "keban", name: "Keban Barajı", type: "baraj", lng: 38.80, lat: 38.61, description: "Fırat Üzerinde" },
  { id: "ilisu", name: "Ilısu Barajı", type: "baraj", lng: 41.83, lat: 37.52, description: "Dicle Üzerinde" },
  { id: "deriner", name: "Deriner Barajı", type: "baraj", lng: 41.86, lat: 41.11, description: "Çoruh Üzerinde" },
  { id: "hirfanli", name: "Hirfanlı Barajı", type: "baraj", lng: 33.78, lat: 39.27, description: "Kızılırmak Üzerinde" },

  // KARMA YAPILI
  { id: "van", name: "Van Gölü", type: "karma", lng: 42.81, lat: 38.63, description: "Tektonik + Volkanik Set" },
];

export const MOUNTAINS: MapPoint[] = [
  // --- KIVRIM DAĞLARI ---
  // Kuzey Anadolu
  { id: "kure", name: "Küre (İsfendiyar)", type: "kivrim", lng: 33.6, lat: 41.8, description: "Kastamonu - Sinop" },
  { id: "ilgaz", name: "Bolu-Ilgaz", type: "kivrim", lng: 33.7, lat: 41.0, description: "Çankırı - Kastamonu" },
  { id: "koroglu", name: "Köroğlu Dağları", type: "kivrim", lng: 31.8, lat: 40.6, description: "Bolu" },
  { id: "canik", name: "Canik Dağları", type: "kivrim", lng: 36.5, lat: 41.0, description: "Samsun - Ordu" },
  { id: "giresun", name: "Giresun Dağları", type: "kivrim", lng: 38.4, lat: 40.6, description: "Giresun" },
  { id: "zigana", name: "Zigana Dağları", type: "kivrim", lng: 39.4, lat: 40.6, description: "Trabzon - Gümüşhane" },
  { id: "soganli", name: "Soğanlı Dağları", type: "kivrim", lng: 40.2, lat: 40.5, description: "Bayburt - Trabzon" },
  { id: "kackar", name: "Kaçkar Dağları", type: "kivrim", lng: 41.1, lat: 40.8, description: "Rize - Artvin" },
  { id: "cimen", name: "Çimen Dağları", type: "kivrim", lng: 39.3, lat: 39.9, description: "Erzincan" },
  { id: "kop", name: "Kop Dağları", type: "kivrim", lng: 40.2, lat: 40.0, description: "Erzurum - Bayburt" },
  { id: "mescit", name: "Mescit Dağları", type: "kivrim", lng: 41.0, lat: 40.4, description: "Erzurum - Artvin" },
  { id: "yalnizcam", name: "Yalnızçam Dağları", type: "kivrim", lng: 42.2, lat: 41.2, description: "Ardahan - Artvin" },
  { id: "allahuekber", name: "Allahuekber Dağları", type: "kivrim", lng: 42.5, lat: 40.6, description: "Kars - Erzurum" },
  
  // Toroslar
  { id: "akdag", name: "Akdağ", type: "kivrim", lng: 29.5, lat: 36.5, description: "Antalya - Muğla" },
  { id: "bey_daglari", name: "Bey Dağları", type: "kivrim", lng: 30.1, lat: 36.6, description: "Antalya" },
  { id: "barla", name: "Barla Dağı", type: "kivrim", lng: 30.7, lat: 38.0, description: "Isparta" },
  { id: "geyik", name: "Geyik Dağları", type: "kivrim", lng: 32.1, lat: 36.9, description: "Antalya - Konya" },
  { id: "bolkar", name: "Bolkar Dağları", type: "kivrim", lng: 34.5, lat: 37.3, description: "Niğde - Mersin" },
  { id: "aladaglar", name: "Aladağlar", type: "kivrim", lng: 35.1, lat: 37.8, description: "Niğde - Kayseri - Adana" },
  { id: "tahtali", name: "Tahtalı Dağları", type: "kivrim", lng: 36.1, lat: 38.5, description: "Kayseri - Adana" },
  { id: "binboga", name: "Binboğa Dağları", type: "kivrim", lng: 36.6, lat: 38.3, description: "Kahramanmaraş" },
  { id: "cilo", name: "Cilo Dağları", type: "kivrim", lng: 44.0, lat: 37.5, description: "Hakkari" },
  
  // Diğer Kıvrım
  { id: "yildiz", name: "Yıldız (Istranca)", type: "kivrim", lng: 27.5, lat: 41.8, description: "Kırklareli" },
  { id: "koru", name: "Koru Dağları", type: "kivrim", lng: 26.8, lat: 40.7, description: "Çanakkale - Edirne" },
  { id: "samanli", name: "Samanlı Dağları", type: "kivrim", lng: 29.5, lat: 40.6, description: "Yalova - Bursa - Kocaeli" },
  { id: "sundiken", name: "Sündiken Dağları", type: "kivrim", lng: 31.0, lat: 39.9, description: "Eskişehir" },
  { id: "sultan", name: "Sultan Dağları", type: "kivrim", lng: 31.3, lat: 38.3, description: "Konya - Afyon" },
  { id: "hinzir", name: "Hınzır Dağları", type: "kivrim", lng: 36.2, lat: 39.0, description: "Kayseri - Sivas" },
  { id: "tecer", name: "Tecer Dağları", type: "kivrim", lng: 37.2, lat: 39.5, description: "Sivas" },
  { id: "mercan", name: "Mercan Dağları", type: "kivrim", lng: 39.3, lat: 39.5, description: "Tunceli - Erzincan" },

  // --- KIRIK DAĞLAR ---
  { id: "kaz", name: "Kaz Dağları", type: "kirik", lng: 26.8, lat: 39.7, description: "Çanakkale - Balıkesir" },
  { id: "madra", name: "Madra Dağları", type: "kirik", lng: 27.1, lat: 39.3, description: "Balıkesir - İzmir" },
  { id: "yunt", name: "Yunt Dağları", type: "kirik", lng: 27.2, lat: 38.8, description: "İzmir - Manisa" },
  { id: "bozdaglar", name: "Bozdağlar", type: "kirik", lng: 28.0, lat: 38.3, description: "İzmir - Aydın - Manisa" },
  { id: "aydin", name: "Aydın Dağları", type: "kirik", lng: 27.8, lat: 38.0, description: "Aydın - İzmir" },
  { id: "mentese", name: "Menteşe Dağları", type: "kirik", lng: 28.3, lat: 37.2, description: "Muğla" },
  { id: "amanos", name: "Amanos (Nur)", type: "kirik", lng: 36.3, lat: 36.7, description: "Hatay" },

  // --- VOLKANİK DAĞLAR ---
  { id: "karadag", name: "Karadağ", type: "volkanik", lng: 33.1, lat: 37.4, description: "Karaman" },
  { id: "karacadag_ic", name: "Karacadağ (İç And)", type: "volkanik", lng: 32.8, lat: 38.9, description: "Konya" }, 
  { id: "karacadag_gd", name: "Karacadağ (G.Doğu)", type: "volkanik", lng: 39.8, lat: 37.7, description: "Şanlıurfa - Diyarbakır" },
  { id: "hasan", name: "Hasan Dağı", type: "volkanik", lng: 34.1, lat: 38.1, description: "Aksaray - Niğde" },
  { id: "melendiz", name: "Melendiz Dağı", type: "volkanik", lng: 34.3, lat: 38.1, description: "Niğde" },
  { id: "erciyes", name: "Erciyes Dağı", type: "volkanik", lng: 35.4, lat: 38.5, description: "Kayseri" },
  { id: "nemrut_bitlis", name: "Nemrut Dağı (Bitlis)", type: "volkanik", lng: 42.2, lat: 38.6, description: "Bitlis" },
  { id: "suphan", name: "Süphan Dağı", type: "volkanik", lng: 42.8, lat: 38.9, description: "Bitlis" },
  { id: "tendurek", name: "Tendürek Dağı", type: "volkanik", lng: 43.8, lat: 39.3, description: "Ağrı - Van" },
  { id: "kucuk_agri", name: "Küçük Ağrı Dağı", type: "volkanik", lng: 44.5, lat: 39.6, description: "Ağrı" },
  { id: "buyuk_agri", name: "Büyük Ağrı Dağı", type: "volkanik", lng: 44.3, lat: 39.7, description: "Ağrı - Iğdır" },
  { id: "uludag", name: "Uludağ (Batolit)", type: "volkanik", lng: 29.2, lat: 40.0, description: "Bursa" },
];

export const PLATEAUS: MapPoint[] = [
  // TABAKA DÜZÜ PLATOLARI
  { id: "obruk", name: "Obruk Platosu", type: "tabaka", lng: 33.4, lat: 38.2, description: "Tabaka Düzü (Karstik şekiller de görülür)" },
  { id: "cihanbeyli", name: "Cihanbeyli Platosu", type: "tabaka", lng: 32.9, lat: 38.6, description: "Tabaka Düzü (Türkiye'nin tahıl ambarı)" },
  { id: "haymana", name: "Haymana Platosu", type: "tabaka", lng: 32.5, lat: 39.4, description: "Tabaka Düzü (Tiftik keçisi)" },
  { id: "bozok", name: "Bozok (Yozgat)", type: "tabaka", lng: 34.8, lat: 39.8, description: "Tabaka Düzü" },
  { id: "uzunyayla", name: "Uzunyayla (Sivas)", type: "tabaka", lng: 36.8, lat: 38.8, description: "Tabaka Düzü" },
  { id: "yazilikaya", name: "Yazılıkaya", type: "tabaka", lng: 30.5, lat: 39.2, description: "Tabaka Düzü (Ege Bölgesi)" },
  { id: "gaziantep", name: "Gaziantep Platosu", type: "tabaka", lng: 37.3, lat: 37.0, description: "Tabaka Düzü (Sanayi gelişmiş)" },
  { id: "sanliurfa", name: "Şanlıurfa Platosu", type: "tabaka", lng: 38.8, lat: 37.1, description: "Tabaka Düzü" },
  { id: "adiyaman", name: "Adıyaman Platosu", type: "tabaka", lng: 38.2, lat: 37.7, description: "Tabaka Düzü" },
  { id: "diyarbakir", name: "Diyarbakır Platosu", type: "tabaka", lng: 40.2, lat: 37.9, description: "Tabaka Düzü" },

  // LAV PLATOLARI
  { id: "erzurum", name: "Erzurum Platosu", type: "lav", lng: 41.2, lat: 39.9, description: "Lav Platosu (Büyükbaş hayvancılık)" },
  { id: "kars", name: "Kars Platosu", type: "lav", lng: 43.0, lat: 40.6, description: "Lav Platosu (Çernezyom)" },
  { id: "ardahan", name: "Ardahan Platosu", type: "lav", lng: 42.7, lat: 41.1, description: "Lav Platosu (Sert Karasal İklim)" },
  { id: "kapadokya", name: "Kapadokya Platosu", type: "lav", lng: 34.8, lat: 38.6, description: "Lav Platosu (Turizm)" },

  // KARSTİK PLATOLAR
  { id: "teke", name: "Teke Platosu", type: "karstik", lng: 29.5, lat: 36.5, description: "Karstik (Kıl keçisi)" },
  { id: "taseli", name: "Taşeli Platosu", type: "karstik", lng: 33.0, lat: 36.5, description: "Karstik (Engebeli arazi)" },

  // AŞINIM PLATOLARI
  { id: "catalca_kocaeli", name: "Çatalca-Kocaeli", type: "asinim", lng: 29.0, lat: 41.1, description: "Aşınım (Sanayi, Ulaşım, Nüfus)" },
  { id: "persembe", name: "Perşembe Platosu", type: "asinim", lng: 37.5, lat: 40.8, description: "Aşınım (Karadeniz)" },
];

export const PLAINS: MapPoint[] = [
  // KIYI OVALARI - DELTALAR
  { id: "cukurova", name: "Çukurova Deltası", type: "delta", lng: 35.3, lat: 36.8, description: "Delta Ovası (Seyhan ve Ceyhan nehirleri)" },
  { id: "silifke", name: "Silifke Deltası", type: "delta", lng: 33.9, lat: 36.3, description: "Delta Ovası (Göksu nehri)" },
  { id: "bafra", name: "Bafra Deltası", type: "delta", lng: 35.9, lat: 41.7, description: "Delta Ovası (Kızılırmak)" },
  { id: "carsamba", name: "Çarşamba Deltası", type: "delta", lng: 36.7, lat: 41.2, description: "Delta Ovası (Yeşilırmak)" },
  { id: "meric", name: "Meriç Deltası", type: "delta", lng: 26.2, lat: 40.7, description: "Delta Ovası (Pirinç tarımı)" },
  { id: "dikili", name: "Dikili Deltası", type: "delta", lng: 26.8, lat: 39.0, description: "Delta Ovası (Bakırçay)" },
  { id: "menemen", name: "Menemen Deltası", type: "delta", lng: 26.9, lat: 38.6, description: "Delta Ovası (Gediz)" },
  { id: "selcuk", name: "Selçuk Deltası", type: "delta", lng: 27.3, lat: 37.9, description: "Delta Ovası (Küçük Menderes)" },
  { id: "balat", name: "Balat Deltası", type: "delta", lng: 27.2, lat: 37.5, description: "Delta Ovası (Büyük Menderes)" },

  // KIYI OVALARI - KIYI DÜZLÜĞÜ
  { id: "finike", name: "Finike Ovası", type: "kiyiduzlugu", lng: 30.1, lat: 36.3, description: "Kıyı Düzlüğü Ovası" },
  { id: "dalaman", name: "Dalaman Ovası", type: "kiyiduzlugu", lng: 28.7, lat: 36.7, description: "Kıyı Düzlüğü Ovası" },

  // İÇ OVALAR - TEKTONİK
  { id: "amik", name: "Amik Ovası", type: "tektonik", lng: 36.3, lat: 36.3, description: "Tektonik (DAF üzerinde)" },
  { id: "ergene", name: "Ergene Ovası", type: "tektonik", lng: 27.2, lat: 41.3, description: "Tektonik (Fay hatları uzağında)" },
  { id: "konya", name: "Konya Ovası", type: "tektonik", lng: 32.5, lat: 37.8, description: "Tektonik (Fay hatları uzağında)" },
  { id: "harran", name: "Harran Ovası", type: "tektonik", lng: 39.0, lat: 36.9, description: "Tektonik (Fay hatları uzağında)" },
  { id: "igdir", name: "Iğdır Ovası", type: "tektonik", lng: 44.0, lat: 39.9, description: "Tektonik (KAF üzerinde)" },
  { id: "erzincan", name: "Erzincan Ovası", type: "tektonik", lng: 39.5, lat: 39.7, description: "Tektonik (KAF üzerinde)" },
  { id: "malatya", name: "Malatya Ovası", type: "tektonik", lng: 38.3, lat: 38.4, description: "Tektonik (DAF üzerinde)" },
  { id: "adapazari", name: "Adapazarı Ovası", type: "tektonik", lng: 30.4, lat: 40.7, description: "Tektonik (KAF üzerinde)" },
  { id: "duzce", name: "Düzce Ovası", type: "tektonik", lng: 31.1, lat: 40.8, description: "Tektonik (KAF üzerinde)" },

  // İÇ OVALAR - KARSTİK (TAKKE)
  { id: "elmali", name: "Elmalı Ovası", type: "karstik", lng: 29.9, lat: 36.7, description: "Karstik Ova" },
  { id: "kestel_ova", name: "Kestel Ovası", type: "karstik", lng: 30.2, lat: 37.4, description: "Karstik Ova" },
  { id: "acipayam", name: "Acıpayam Ovası", type: "karstik", lng: 29.3, lat: 37.4, description: "Karstik Ova" },
  { id: "tavas", name: "Tavas Ovası", type: "karstik", lng: 29.0, lat: 37.5, description: "Karstik Ova" },
  { id: "korkuteli", name: "Korkuteli Ovası", type: "karstik", lng: 30.2, lat: 37.0, description: "Karstik Ova" },
  { id: "tefenni", name: "Tefenni Ovası", type: "karstik", lng: 29.7, lat: 37.3, description: "Karstik Ova" },

  // İÇ OVALAR - VOLKANİK
  { id: "develi", name: "Develi Ovası", type: "volkanik", lng: 35.4, lat: 38.3, description: "Volkanik Ova" },
  { id: "caldiran", name: "Çaldıran Ovası", type: "volkanik", lng: 43.9, lat: 39.1, description: "Volkanik Ova" },
  { id: "muradiye", name: "Muradiye Ovası", type: "volkanik", lng: 43.7, lat: 38.9, description: "Volkanik Ova" },
];

export const MAP_TOPICS: MapTopic[] = [
  {
    id: "goller",
    title: "Türkiye'nin Gölleri",
    description: "Tektonik, karstik, volkanik ve set göllerini harita üzerinde bulun.",
    points: TURKEY_LAKES
  },
  {
    id: "daglar",
    title: "Türkiye'nin Dağları",
    description: "Kıvrım, Kırık ve Volkanik dağlarımızı harita üzerinde doğru yerlerine sürükleyin.",
    points: MOUNTAINS
  },
  {
    id: "platolar",
    title: "Türkiye'nin Platoları",
    description: "Tabaka düzü, lav, karstik ve aşınım platolarımızı harita üzerinde bulun.",
    points: PLATEAUS
  },
  {
    id: "ovalar",
    title: "Türkiye'nin Ovaları",
    description: "Kıyı, tektonik, karstik ve volkanik ovalarımızı harita üzerinde bulun.",
    points: PLAINS
  }
];
