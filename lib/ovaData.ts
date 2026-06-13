export interface OvaDetectiveQuestion {
  id: string;
  answer: string;
  options: string[];
  clues: string[];
}

export const OVA_DETECTIVE_QUESTIONS: OvaDetectiveQuestion[] = [
  {
    id: "carsamba",
    answer: "Çarşamba",
    options: ["Bafra", "Çarşamba", "Çukurova", "Silifke"],
    clues: [
      "Canik dağlarının gerisinde kalmasıyla oluşmuştur.",
      "Oluşumunda Yeşilırmak'ın taşıdığı alüvyonlar etkilidir.",
      "Karadeniz Bölgesi'nin en önemli iki delta ovasından biridir.",
      "Samsun il sınırları içerisinde yer alır."
    ]
  },
  {
    id: "cukurova",
    answer: "Çukurova",
    options: ["Çukurova", "Amik", "Silifke", "Harran"],
    clues: [
      "Fiziki haritalarda geniş bir yeşil alan kaplamasıyla dikkat çeker.",
      "Seyhan ve Ceyhan nehirlerinin getirdiği alüvyonlarla oluşmuştur.",
      "Türkiye'nin en büyük delta ovasıdır.",
      "Akdeniz Bölgesi'nde yer alır ve pamuk tarımının merkezidir."
    ]
  },
  {
    id: "konya",
    answer: "Konya Ovası",
    options: ["Erzurum Ovası", "Muş Ovası", "Ergene Ovası", "Konya Ovası"],
    clues: [
      "Tektonik oluşumlu olmasına rağmen Türkiye'deki ana fay hatlarına oldukça uzaktır.",
      "Yıllık yağış miktarının çok düşük olduğu bir bölgededir, sulama projeleri (KOP) ile hayat bulur.",
      "Türkiye'nin en büyük iç ovasıdır.",
      "Türkiye'nin 'tahıl ambarı' olarak bilinir."
    ]
  },
  {
    id: "korkuteli",
    answer: "Korkuteli Ovası",
    options: ["Korkuteli Ovası", "Develi Ovası", "Bafra Ovası", "Amik Ovası"],
    clues: [
      "Suyu sünger gibi emen bir zemin yapısı vardır.",
      "Oluşumunda kireçtaşı ve kalker gibi eriyebilen kayaçlar rol oynamıştır.",
      "Akdeniz Bölgesi'ndeki 'TAKKE' kodlamasıyla bilinen ovalardan biridir.",
      "Antalya sınırları içerisindedir ve karstik bir ovadır."
    ]
  },
  {
    id: "erzincan",
    answer: "Erzincan Ovası",
    options: ["Iğdır Ovası", "Amik Ovası", "Erzincan Ovası", "Muş Ovası"],
    clues: [
      "Kuzey Anadolu Fay Hattı (KAF) üzerinde yer alan ve geçmişte çok büyük depremler yaşamış bir çöküntü alanıdır.",
      "Etrafı yüksek dağlarla çevrili bir graben (çöküntü) ovasıdır.",
      "Doğu Anadolu Bölgesi'ndedir.",
      "İsmiyle aynı olan şehrin merkezini barındıran bu ova oldukça aktif bir tektonik ovadır."
    ]
  },
  {
    id: "meric",
    answer: "Meriç Deltası",
    options: ["Karasu Ovası", "Ergene Ovası", "Meriç Deltası", "Dikili Deltası"],
    clues: [
      "Yunanistan ile doğal sınırımızı oluşturan nehrin denize döküldüğü yerde oluşmuştur.",
      "Marmara Bölgesi sınırları içerisinde yer alan bir delta ovasıdır.",
      "Özellikle pirinç (çeltik) tarımıyla ön plana çıkar.",
      "Edirne (Enez) kıyılarında Ege Denizi'ne dökülen nehrin oluşturduğu deltadır."
    ]
  },
  {
    id: "amik",
    answer: "Amik Ovası",
    options: ["Amik Ovası", "Çukurova", "Silifke Ovası", "Harran Ovası"],
    clues: [
      "Doğu Anadolu Fay Hattı'nın (DAF) güney ucundaki çöküntü alanı üzerinde yer alır.",
      "Geçmişte içinde bulunan göl kurutularak tarım alanına dönüştürülmüştür.",
      "Akdeniz Bölgesi'nde yer alan bir graben ovasıdır.",
      "Hatay ilimizin en büyük ve en bilindik tektonik ovasıdır."
    ]
  }
];
