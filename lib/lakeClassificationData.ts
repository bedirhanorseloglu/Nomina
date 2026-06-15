export type LakeType = 
  | "tektonik" 
  | "volkanik" 
  | "karstik" 
  | "buzul" 
  | "karma" 
  | "heyelan_set" 
  | "aluvyal_set" 
  | "volkanik_set" 
  | "kiyi_set" 
  | "traverten_set" 
  | "baraj";

export const LAKE_TYPE_LABELS: Record<LakeType, string> = {
  tektonik: "Tektonik",
  volkanik: "Volkanik",
  karstik: "Karstik",
  buzul: "Buzul (Sirk)",
  karma: "Karma Oluşumlu",
  heyelan_set: "Heyelan Set",
  aluvyal_set: "Alüvyal Set",
  volkanik_set: "Volkanik Set",
  kiyi_set: "Kıyı Set (Lagün)",
  traverten_set: "Traverten Set",
  baraj: "Yapay (Baraj)",
};

export const LAKE_TYPE_HINTS: Record<LakeType, string> = {
  tektonik: "Yerin derinliklerindeki hareketler ve kırılmalar (faylar), bu gölün oluşumunda anahtar rol oynamıştır.",
  volkanik: "Ateş dağlarının sönmüş zirvelerinde veya yer altındaki gaz patlamalarının açtığı çukurlarda gizlenir.",
  karstik: "Suların kayaları (kalker, jips) kolayca eritebildiği arazilerde, çöken alanlarda birikmesiyle oluşmuştur.",
  buzul: "Çok yüksek rakımlı dağlarda, donmuş dev kütlelerin aşındırarak açtığı çanaklarda bulunur.",
  karma: "Tek bir doğal olay yetmemiş, var olabilmesi için birden fazla farklı doğa olayının birleşmesi gerekmiştir.",
  heyelan_set: "Dağlardan kopup gelen devasa toprak kütlelerinin, bir su yolunun önünü aniden kapatmasıyla meydana gelmiştir.",
  aluvyal_set: "Akarsuların taşıdığı ince malzemelerin biriktirilerek bir vadinin veya körfezin önünü tıkamasıyla oluşur.",
  volkanik_set: "Erimiş lavların akıp soğuyarak, mevcut bir çöküntünün veya vadinin önünde duvar örmesiyle var olmuştur.",
  kiyi_set: "Dalgaların taşıdığı kumların, sığ bir koyun denizle bağlantısını kesmesiyle oluşur (Deniz Kulağı).",
  traverten_set: "Mineralli suların tortu bırakıp taşlaşmasıyla oluşan doğal basamakların bir vadinin önünü kesmesiyle oluşur.",
  baraj: "Doğanın kendi kendine değil, insanların enerji ve su ihtiyacı için inşa ettiği devasa yapay engellerin ardında birikir.",
};

export interface LakeItem {
  id: string;
  name: string;
  type: LakeType;
  customHint?: string;
}

export const CLASSIFICATION_LAKES: LakeItem[] = [
  { id: "sapanca", name: "Sapanca", type: "tektonik" },
  { id: "iznik", name: "İznik", type: "tektonik" },
  { id: "ulubat", name: "Ulubat (Uluabat)", type: "tektonik" },
  { id: "manyas", name: "Manyas (Kuş Gölü)", type: "tektonik" },
  { id: "eber", name: "Eber", type: "tektonik" },
  { id: "aksehir", name: "Akşehir", type: "tektonik" },
  { id: "ilgin", name: "Ilgın", type: "tektonik" },
  { id: "tuz", name: "Tuz Gölü", type: "tektonik" },
  { id: "seyfe", name: "Seyfe", type: "tektonik" },
  { id: "palas", name: "Palas (Tuzla)", type: "tektonik" },
  { id: "burdur", name: "Burdur", type: "tektonik" },
  { id: "acigol_burdur", name: "Acıgöl (Burdur çevresi)", type: "tektonik" },
  { id: "hazar", name: "Hazar", type: "tektonik" },
  { id: "aktas", name: "Aktaş", type: "tektonik" },

  { id: "nemrut", name: "Nemrut", type: "volkanik", customHint: "Dünyanın en büyük ikinci kaldera gölüdür." },
  { id: "aygir", name: "Aygır", type: "volkanik" },
  { id: "meke", name: "Meke (Meke Tuzlası)", type: "volkanik", customHint: "Dünyanın nazar boncuğu olarak bilinir, bir maar gölüdür." },
  { id: "acigol_konya", name: "Acıgöl (Konya / Karapınar)", type: "volkanik" },
  { id: "golcuk", name: "Gölcük", type: "volkanik" },

  { id: "avlan", name: "Avlan", type: "karstik" },
  { id: "elmali", name: "Elmalı", type: "karstik" },
  { id: "kestel", name: "Kestel", type: "karstik" },
  { id: "muren", name: "Müren", type: "karstik" },
  { id: "karagol_goller", name: "Karagöl (Göller Yöresi)", type: "karstik" },
  { id: "salda", name: "Salda", type: "karstik", customHint: "Türkiye'nin Maldivleri olarak bilinir. Suları çok temizdir." },
  { id: "kiziloren", name: "Kızılören (Obruk)", type: "karstik", customHint: "Konya'da yer altı sularının çekilmesiyle çöken obruklarda oluşur." },
  { id: "cirali", name: "Çıralı", type: "karstik" },
  { id: "hamam", name: "Hamam", type: "karstik" },
  { id: "hafik", name: "Hafik", type: "karstik", customHint: "Sivas çevresindeki jipsli (alçıtaşı) arazide yer alır." },
  { id: "lota", name: "Lota", type: "karstik", customHint: "Sivas çevresindeki jipsli (alçıtaşı) arazide yer alır." },
  { id: "toturge", name: "Tötürge", type: "karstik", customHint: "Sivas çevresindeki jipsli (alçıtaşı) arazide yer alır." },
  { id: "timras", name: "Timraş", type: "karstik", customHint: "Sivas çevresindeki jipsli (alçıtaşı) arazide yer alır." },

  { id: "aynali", name: "Aynalı", type: "buzul" },
  { id: "kilimli", name: "Kilimli", type: "buzul" },
  { id: "karagol_buzul", name: "Karagöl (Uludağ / Kaçkarlar)", type: "buzul" },
  { id: "vercenik", name: "Verçenik", type: "buzul" },
  { id: "mal", name: "Mal", type: "buzul" },
  { id: "kirmizitas", name: "Kırmızı Taş", type: "buzul" },
  { id: "sat", name: "Sat", type: "buzul" },
  { id: "cilo", name: "Cilo", type: "buzul" },
  { id: "cinili", name: "Çinili", type: "buzul" },
  { id: "dipsiz", name: "Dipsiz", type: "buzul" },

  { id: "van", name: "Van Gölü", type: "karma", customHint: "Hem tektonik çöküntü hem de Volkanik Set ile oluşmuştur." },
  { id: "beysehir", name: "Beyşehir", type: "karma", customHint: "Hem tektonik hem de karstik özellik gösterir." },
  { id: "egirdir", name: "Eğirdir", type: "karma", customHint: "Hem tektonik hem de karstik özellik gösterir." },
  { id: "kovada", name: "Kovada", type: "karma", customHint: "Hem tektonik hem de karstik özellik gösterir." },
  { id: "sugla", name: "Suğla", type: "karma", customHint: "Hem tektonik hem de karstik özellik gösterir." },

  { id: "tortum", name: "Tortum", type: "heyelan_set" },
  { id: "sera", name: "Sera", type: "heyelan_set" },
  { id: "yedigoller", name: "Yedigöller", type: "heyelan_set" },
  { id: "abant", name: "Abant", type: "heyelan_set" },
  { id: "sunnet", name: "Sünnet", type: "heyelan_set" },
  { id: "suluk", name: "Sülük", type: "heyelan_set" },
  { id: "borabay", name: "Borabay", type: "heyelan_set" },
  { id: "zinav", name: "Zinav", type: "heyelan_set" },

  { id: "koycegiz", name: "Köyceğiz", type: "aluvyal_set" },
  { id: "bafa", name: "Bafa (Çamiçi)", type: "aluvyal_set" },
  { id: "marmara", name: "Marmara", type: "aluvyal_set" },
  { id: "akgol_sakarya", name: "Akgöl (Sakarya kanadı)", type: "aluvyal_set" },
  { id: "mogan", name: "Mogan", type: "aluvyal_set" },
  { id: "eymir", name: "Eymir", type: "aluvyal_set" },
  { id: "uzungol", name: "Uzungöl", type: "aluvyal_set", customHint: "Heyelan set ile birlikte alüvyal set özelliği de gösterir." },

  { id: "cildir", name: "Çıldır", type: "volkanik_set" },
  { id: "hacli", name: "Haçlı", type: "volkanik_set" },
  { id: "balik_dogu", name: "Balık (Doğu Anadolu)", type: "volkanik_set" },
  { id: "nazik", name: "Nazik", type: "volkanik_set" },
  { id: "ercek", name: "Erçek", type: "volkanik_set" },

  { id: "buyukcekmece", name: "Büyükçekmece", type: "kiyi_set" },
  { id: "kucukcekmece", name: "Küçükçekmece", type: "kiyi_set" },
  { id: "terkos", name: "Terkos (Durusu)", type: "kiyi_set" },
  { id: "karine", name: "Karine (Dil)", type: "kiyi_set" },
  { id: "beymelek", name: "Beymelek", type: "kiyi_set" },
  { id: "akgol_paradeniz", name: "Akgöl (Paradeniz)", type: "kiyi_set" },
  { id: "akyatan", name: "Akyatan", type: "kiyi_set" },
  { id: "yumurtalik", name: "Yumurtalık (Akyayan)", type: "kiyi_set" },
  { id: "gici", name: "Gıcı", type: "kiyi_set" },
  { id: "tatli", name: "Tatlı", type: "kiyi_set" },
  { id: "gernek", name: "Gernek", type: "kiyi_set" },
  { id: "balik_bafra", name: "Balık (Bafra Deltası)", type: "kiyi_set" },
  { id: "oludeniz", name: "Ölüdeniz", type: "kiyi_set" },

  { id: "otlukbeli", name: "Otlukbeli", type: "traverten_set" },

  { id: "ataturk", name: "Atatürk", type: "baraj" },
  { id: "keban", name: "Keban", type: "baraj" },
  { id: "karakaya", name: "Karakaya", type: "baraj" },
  { id: "birecik", name: "Birecik", type: "baraj" },
  { id: "ilisu", name: "Ilısu", type: "baraj" },
  { id: "deriner", name: "Deriner", type: "baraj" },
  { id: "yusufeli", name: "Yusufeli", type: "baraj" },
  { id: "hirfanli", name: "Hirfanlı", type: "baraj" },
  { id: "kesikkopru", name: "Kesikköprü", type: "baraj" },
  { id: "kapulukaya", name: "Kapulukaya", type: "baraj" },
  { id: "altinkaya", name: "Altınkaya", type: "baraj" },
  { id: "derbent", name: "Derbent", type: "baraj" },
  { id: "gokcekaya", name: "Gökçekaya", type: "baraj" },
  { id: "sariyar", name: "Sarıyar", type: "baraj" },
  { id: "oymapinar", name: "Oymapınar", type: "baraj" },
  { id: "adiguzel", name: "Adıgüzel", type: "baraj" },
  { id: "demirkopru", name: "Demirköprü", type: "baraj" },
  { id: "kemer", name: "Kemer", type: "baraj" },
  { id: "almus", name: "Almus", type: "baraj" },
  { id: "catalan", name: "Çatalan", type: "baraj" },
  { id: "ermenek", name: "Ermenek", type: "baraj" },
  { id: "berke", name: "Berke", type: "baraj" },
];
