export interface PlateauFeature {
  id: string;
  name: string;
  story: string;
  blank: string;
  options: string[];
}

export const PLATEAU_FEATURES: PlateauFeature[] = [
  {
    id: "teke",
    name: "Teke Platosu",
    story: "Akdeniz bölgesinde geziye çıkan bir turist, _____ platosuna geldiğinde her yerin karstik arazilerle kaplı olduğunu ve yöre halkının kıl keçisi yetiştirdiğini gördü.",
    blank: "Teke",
    options: ["Teke", "Haymana", "Erzurum", "Bozok"]
  },
  {
    id: "cihanbeyli",
    name: "Cihanbeyli Platosu",
    story: "Türkiye'nin tahıl ambarı olarak bilinen _____ platosu, İç Anadolu bölgesinde yer alan geniş bir tabaka düzü platosudur.",
    blank: "Cihanbeyli",
    options: ["Cihanbeyli", "Şanlıurfa", "Perşembe", "Ardahan"]
  },
  {
    id: "erzurum_kars",
    name: "Erzurum-Kars Platosu",
    story: "Doğu Anadolu'da lav örtüleriyle oluşmuş _____ platosu, sert karasal iklimi nedeniyle çayırlarla kaplıdır ve büyükbaş hayvancılık çok yaygındır.",
    blank: "Erzurum-Kars",
    options: ["Erzurum-Kars", "Gaziantep", "Yazılıkaya", "Taşeli"]
  },
  {
    id: "catalca_kocaeli",
    name: "Çatalca-Kocaeli Platosu",
    story: "Marmara'da yer alan ve aşınım düzlüğü olan _____ platosu, arazi şartlarının elverişliliği sayesinde sanayi, ticaret ve nüfusun en çok yoğunlaştığı alandır.",
    blank: "Çatalca-Kocaeli",
    options: ["Çatalca-Kocaeli", "Obruk", "Uzunyayla", "Diyarbakır"]
  },
  {
    id: "haymana",
    name: "Haymana Platosu",
    story: "İç Anadolu Bölgesinde yer alan ve özellikle tiftik (Ankara) keçisi yetiştiriciliği ile öne çıkan tabaka düzü platosu _____ platosudur.",
    blank: "Haymana",
    options: ["Haymana", "Adıyaman", "Perşembe", "Teke"]
  },
  {
    id: "kapadokya",
    name: "Kapadokya Platosu",
    story: "Volkanik faaliyetler sonucu yüzeye çıkan lavların akarsularca aşındırılmasıyla oluşan _____ platosu, aynı zamanda çok önemli bir turizm merkezidir.",
    blank: "Kapadokya",
    options: ["Kapadokya", "Gaziantep", "Taşeli", "Bozok"]
  }
];
