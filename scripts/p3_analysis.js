/**
 * KPSS 2024 P3 Puan Regresyon Analizi
 * Onaylanmış ÖSYM sonuç belgelerinden alınan gerçek veriler kullanılarak
 * en doğru P3 puan tahmin formülünü bulmayı amaçlar.
 * 
 * Net hesaplama: Doğru - Yanlış/4
 */

// =====================================================
// 2024 KPSS LİSANS - ONAYLANMIŞ P3 VERİLERİ
// (Aday Sayısı: 1.318.113 olan resmi ÖSYM belgeleri)
// =====================================================
const confirmed2024 = [
  // Önceki turdan:
  { gy_d: 57, gy_y: 1,  gk_d: 56, gk_y: 3,  p1: 98.93808, p2: 98.34823, p3: 96.93808, p3_rank: 500,    label: "Sheet1" },
  { gy_d: 48, gy_y: 11, gk_d: 51, gk_y: 7,  p1: 92.39848, p2: 92.77662, p3: 93.10374, p3_rank: 621,    label: "Sheet2" },
  { gy_d: 50, gy_y: 7,  gk_d: 46, gk_y: 9,  p1: 93.04325, p2: 92.70898, p3: 92.28739, p3_rank: 1049,   label: "Sheet3" },
  { gy_d: 42, gy_y: 8,  gk_d: 50, gk_y: 7,  p1: 88.76036, p2: 89.46626, p3: 90.13645, p3_rank: 3094,   label: "Sheet4" },
  
  // Bu turdan (1. grup):
  { gy_d: 43, gy_y: 16, gk_d: 47, gk_y: 13, p1: 87.04934, p2: 87.44492, p3: 87.78820, p3_rank: 7444,   label: "Sheet5" },
  { gy_d: 32, gy_y: 3,  gk_d: 40, gk_y: 4,  p1: 80.90567, p2: null,     p3: 82.05358, p3_rank: 35234,  label: "Sheet7" },
  { gy_d: 27, gy_y: 7,  gk_d: 49, gk_y: 5,  p1: 79.08461, p2: 80.91106, p3: 82.75536, p3_rank: 29824,  label: "Sheet8" },
  { gy_d: 38, gy_y: 7,  gk_d: 33, gk_y: 8,  p1: 82.25526, p2: 81.76508, p3: 81.17523, p3_rank: 43020,  label: "Sheet9" },
  
  // Bu turdan (2. grup):
  { gy_d: 25, gy_y: 7,  gk_d: 47, gk_y: 7,  p1: 77.19802, p2: 78.96606, p3: 80.74817, p3_rank: 47358,  label: "Sheet10" },
  { gy_d: 20, gy_y: 10, gk_d: 40, gk_y: 16, p1: 71.28735, p2: 72.70899, p3: 74.12455, p3_rank: 186493, label: "Sheet13" },
  { gy_d: 20, gy_y: 15, gk_d: 41, gk_y: 14, p1: 70.83121, p2: 72.48127, p3: 74.13678, p3_rank: 185991, label: "Sheet14" },
];

// Farklı yıllardan veriler (Aday Sayısı farklı)
const otherYears = [
  { gy_d: 32, gy_y: 14, gk_d: 45, gk_y: 10, p3: 84.27770, aday: 764735,  label: "Sheet6-OtherYear" },
  { gy_d: 27, gy_y: 6,  gk_d: 46, gk_y: 10, p3: 78.98055, aday: 1159469, label: "Sheet11-OtherYear" },
  { gy_d: 33, gy_y: 22, gk_d: 44, gk_y: 14, p3: 77.69741, aday: 644875,  label: "Sheet12-OtherYear" },
];

// İlk tablodaki veriler (puan türü belirsiz)
const firstTable = [
  { gy_d: 41, gy_y: 6,  gk_d: 43, gk_y: 11, puan: 86.5,  rank: 10752, label: "Tablo1" },
  { gy_d: 47, gy_y: 8,  gk_d: 43, gk_y: 13, puan: 89.05, rank: 4740,  label: "Tablo2" },
  { gy_d: 49, gy_y: 7,  gk_d: 54, gk_y: 4,  puan: 95.6,  rank: 97,    label: "Tablo3" },
  { gy_d: 41, gy_y: 10, gk_d: 54, gk_y: 2,  puan: 91.57, rank: 1577,  label: "Tablo4" },
  { gy_d: 40, gy_y: 11, gk_d: 46, gk_y: 13, puan: 86.5,  rank: 10976, label: "Tablo5" },
  { gy_d: 39, gy_y: 13, gk_d: 33, gk_y: 15, puan: 80.2,  rank: 53236, label: "Tablo6" },
  { gy_d: 25, gy_y: 7,  gk_d: 47, gk_y: 7,  puan: 80.7,  rank: 47358, label: "Tablo7" },
  { gy_d: 47, gy_y: 7,  gk_d: 39, gk_y: 12, puan: 87.6,  rank: 7840,  label: "Tablo8" },
];

// Kırmızı resimden veriler (puan türü belirsiz)
const redImage = [
  { gy_d: 25, gy_y: 12, gk_d: 37, gk_y: 18, puan: 76.86, label: "Red1" },
  { gy_d: 28, gy_y: 6,  gk_d: 41, gk_y: 10, puan: 81.53, label: "Red2" },
  { gy_d: 33, gy_y: 11, gk_d: 42, gk_y: 10, puan: 83.77, label: "Red3" },
  { gy_d: 36, gy_y: 7,  gk_d: 42, gk_y: 13, puan: 85.40, label: "Red4" },
  { gy_d: 45, gy_y: 7,  gk_d: 49, gk_y: 6,  puan: 93.40, label: "Red5" },
];

// =====================================================
// NET HESAPLAMA
// =====================================================
function calcNet(dogru, yanlis) {
  return Math.round((dogru - yanlis / 4) * 100) / 100;
}

function enrichData(data) {
  return data.map(d => ({
    ...d,
    gy_net: calcNet(d.gy_d, d.gy_y),
    gk_net: calcNet(d.gk_d, d.gk_y),
    total_net: calcNet(d.gy_d, d.gy_y) + calcNet(d.gk_d, d.gk_y),
  }));
}

// =====================================================
// DOĞRUSAL REGRESYON (En Küçük Kareler)
// Model: puan = C + A * GY_net + B * GK_net
// =====================================================
function linearRegression(data, puanField) {
  const n = data.length;
  
  let sumGY = 0, sumGK = 0, sumP = 0;
  let sumGY2 = 0, sumGK2 = 0, sumGYGK = 0;
  let sumPGY = 0, sumPGK = 0;
  
  for (const d of data) {
    const gy = d.gy_net;
    const gk = d.gk_net;
    const p = d[puanField];
    
    sumGY += gy;
    sumGK += gk;
    sumP += p;
    sumGY2 += gy * gy;
    sumGK2 += gk * gk;
    sumGYGK += gy * gk;
    sumPGY += p * gy;
    sumPGK += p * gk;
  }
  
  // Normal denklemler: X'X * beta = X'y
  // [sumGY2   sumGYGK  sumGY ] [A]   [sumPGY]
  // [sumGYGK  sumGK2   sumGK ] [B] = [sumPGK]
  // [sumGY    sumGK    n     ] [C]   [sumP  ]
  
  // 3x3 matris çözümü (Cramer kuralı)
  const M = [
    [sumGY2, sumGYGK, sumGY],
    [sumGYGK, sumGK2, sumGK],
    [sumGY, sumGK, n]
  ];
  
  const rhs = [sumPGY, sumPGK, sumP];
  
  // Determinant hesapla
  function det3(m) {
    return m[0][0] * (m[1][1]*m[2][2] - m[1][2]*m[2][1])
         - m[0][1] * (m[1][0]*m[2][2] - m[1][2]*m[2][0])
         + m[0][2] * (m[1][0]*m[2][1] - m[1][1]*m[2][0]);
  }
  
  const D = det3(M);
  
  // A katsayısı
  const MA = [
    [rhs[0], M[0][1], M[0][2]],
    [rhs[1], M[1][1], M[1][2]],
    [rhs[2], M[2][1], M[2][2]]
  ];
  const A = det3(MA) / D;
  
  // B katsayısı
  const MB = [
    [M[0][0], rhs[0], M[0][2]],
    [M[1][0], rhs[1], M[1][2]],
    [M[2][0], rhs[2], M[2][2]]
  ];
  const B = det3(MB) / D;
  
  // C sabiti
  const MC = [
    [M[0][0], M[0][1], rhs[0]],
    [M[1][0], M[1][1], rhs[1]],
    [M[2][0], M[2][1], rhs[2]]
  ];
  const C = det3(MC) / D;
  
  // R² hesapla
  const meanP = sumP / n;
  let ssTot = 0, ssRes = 0;
  const predictions = [];
  
  for (const d of data) {
    const pred = C + A * d.gy_net + B * d.gk_net;
    const actual = d[puanField];
    const residual = actual - pred;
    ssTot += (actual - meanP) ** 2;
    ssRes += residual ** 2;
    predictions.push({ ...d, predicted: pred, residual, absError: Math.abs(residual) });
  }
  
  const rSquared = 1 - ssRes / ssTot;
  const rmse = Math.sqrt(ssRes / n);
  const mae = predictions.reduce((s, p) => s + p.absError, 0) / n;
  
  return { A, B, C, rSquared, rmse, mae, predictions };
}

// =====================================================
// SADECE TOPLAM NET İLE REGRESYON
// Model: puan = C + A * total_net
// =====================================================
function simpleRegression(data, puanField) {
  const n = data.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  
  for (const d of data) {
    const x = d.total_net;
    const y = d[puanField];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }
  
  const A = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const C = (sumY - A * sumX) / n;
  
  const meanY = sumY / n;
  let ssTot = 0, ssRes = 0;
  const predictions = [];
  
  for (const d of data) {
    const pred = C + A * d.total_net;
    const actual = d[puanField];
    const residual = actual - pred;
    ssTot += (actual - meanY) ** 2;
    ssRes += residual ** 2;
    predictions.push({ ...d, predicted: pred, residual, absError: Math.abs(residual) });
  }
  
  const rSquared = 1 - ssRes / ssTot;
  const rmse = Math.sqrt(ssRes / n);
  const mae = predictions.reduce((s, p) => s + p.absError, 0) / n;
  
  return { A, C, rSquared, rmse, mae, predictions };
}

// =====================================================
// POLİNOMİYAL REGRESYON (2. derece)
// Model: puan = C + A*GY + B*GK + D*GY² + E*GK² + F*GY*GK
// =====================================================
function polynomialRegression(data, puanField) {
  const n = data.length;
  
  // Design matrix: [GY, GK, GY², GK², GY*GK, 1]
  // 6 unknowns, need n >= 6
  if (n < 6) return null;
  
  // Build X matrix (n x 6) and y vector (n x 1)
  const X = data.map(d => [d.gy_net, d.gk_net, d.gy_net**2, d.gk_net**2, d.gy_net*d.gk_net, 1]);
  const y = data.map(d => d[puanField]);
  
  // Compute X'X (6x6) and X'y (6x1)
  const p = 6;
  const XtX = Array.from({length: p}, () => Array(p).fill(0));
  const Xty = Array(p).fill(0);
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < p; j++) {
      Xty[j] += X[i][j] * y[i];
      for (let k = 0; k < p; k++) {
        XtX[j][k] += X[i][j] * X[i][k];
      }
    }
  }
  
  // Solve using Gaussian elimination
  const aug = XtX.map((row, i) => [...row, Xty[i]]);
  
  for (let col = 0; col < p; col++) {
    // Pivot
    let maxRow = col;
    for (let row = col + 1; row < p; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    
    const pivot = aug[col][col];
    if (Math.abs(pivot) < 1e-12) return null;
    
    for (let j = col; j <= p; j++) aug[col][j] /= pivot;
    
    for (let row = 0; row < p; row++) {
      if (row === col) continue;
      const factor = aug[row][col];
      for (let j = col; j <= p; j++) aug[row][j] -= factor * aug[col][j];
    }
  }
  
  const beta = aug.map(row => row[p]);
  const [A, B, D, E, F, C] = beta;
  
  // R² and predictions
  const meanP = y.reduce((a, b) => a + b, 0) / n;
  let ssTot = 0, ssRes = 0;
  const predictions = [];
  
  for (let i = 0; i < n; i++) {
    const pred = beta.reduce((sum, b, j) => sum + b * X[i][j], 0);
    const residual = y[i] - pred;
    ssTot += (y[i] - meanP) ** 2;
    ssRes += residual ** 2;
    predictions.push({ ...data[i], predicted: pred, residual, absError: Math.abs(residual) });
  }
  
  const rSquared = 1 - ssRes / ssTot;
  const rmse = Math.sqrt(ssRes / n);
  const mae = predictions.reduce((s, p) => s + p.absError, 0) / n;
  
  return { A, B, C, D, E, F, rSquared, rmse, mae, predictions };
}


// =====================================================
// ANA ANALİZ
// =====================================================
console.log("═══════════════════════════════════════════════════");
console.log("  2024 KPSS LİSANS P3 PUAN TAHMİN ANALİZİ");
console.log("  Onaylanmış ÖSYM Verileri (Aday: 1.318.113)");
console.log("═══════════════════════════════════════════════════\n");

const data2024 = enrichData(confirmed2024);

console.log("📊 VERİ TABLOSU (11 onaylanmış 2024 P3 verisi):");
console.log("─────────────────────────────────────────────────────────────────────────");
console.log("Label      | GY D-Y  | GK D-Y  | GY Net | GK Net | Total  | P3 (Gerçek) | Sıra");
console.log("─────────────────────────────────────────────────────────────────────────");
for (const d of data2024) {
  console.log(
    `${d.label.padEnd(10)} | ${String(d.gy_d).padStart(2)}-${String(d.gy_y).padStart(2)}   | ${String(d.gk_d).padStart(2)}-${String(d.gk_y).padStart(2)}   | ${d.gy_net.toFixed(2).padStart(6)} | ${d.gk_net.toFixed(2).padStart(6)} | ${d.total_net.toFixed(2).padStart(6)} | ${d.p3.toFixed(5).padStart(11)} | ${String(d.p3_rank).padStart(6)}`
  );
}

// =====================================================
// MODEL 1: Mevcut formül (45 + Net * 0.45)
// =====================================================
console.log("\n\n═══ MODEL 1: MEVCUT FORMÜL (45 + TotalNet * 0.45) ═══");
let totalResidual1 = 0;
let maxError1 = 0;
for (const d of data2024) {
  const pred = Math.min(100, Math.max(0, 45 + d.total_net * 0.45));
  const residual = d.p3 - pred;
  totalResidual1 += residual ** 2;
  maxError1 = Math.max(maxError1, Math.abs(residual));
  console.log(`${d.label}: Net=${d.total_net.toFixed(2)}, Gerçek=${d.p3.toFixed(2)}, Tahmin=${pred.toFixed(2)}, Hata=${residual.toFixed(2)}`);
}
console.log(`RMSE: ${Math.sqrt(totalResidual1 / data2024.length).toFixed(4)}`);
console.log(`Max Hata: ${maxError1.toFixed(4)}`);

// =====================================================
// MODEL 2: Basit doğrusal (sadece toplam net)
// =====================================================
console.log("\n\n═══ MODEL 2: BASİT DOĞRUSAL (C + A * TotalNet) ═══");
const model2 = simpleRegression(data2024, "p3");
console.log(`Formül: P3 = ${model2.C.toFixed(5)} + ${model2.A.toFixed(5)} * TotalNet`);
console.log(`R² = ${model2.rSquared.toFixed(6)}`);
console.log(`RMSE = ${model2.rmse.toFixed(4)}`);
console.log(`MAE = ${model2.mae.toFixed(4)}`);
console.log("\nTahminler:");
for (const p of model2.predictions) {
  console.log(`${p.label}: Gerçek=${p.p3.toFixed(2)}, Tahmin=${p.predicted.toFixed(2)}, Hata=${p.residual.toFixed(2)}`);
}

// =====================================================
// MODEL 3: Çift değişkenli doğrusal (GY + GK ayrı)
// =====================================================
console.log("\n\n═══ MODEL 3: ÇİFT DEĞİŞKENLİ DOĞRUSAL (C + A*GY + B*GK) ═══");
const model3 = linearRegression(data2024, "p3");
console.log(`Formül: P3 = ${model3.C.toFixed(5)} + ${model3.A.toFixed(5)} * GY_net + ${model3.B.toFixed(5)} * GK_net`);
console.log(`R² = ${model3.rSquared.toFixed(6)}`);
console.log(`RMSE = ${model3.rmse.toFixed(4)}`);
console.log(`MAE = ${model3.mae.toFixed(4)}`);
console.log(`\nGY katsayısı / GK katsayısı oranı: ${(model3.A / model3.B).toFixed(4)}`);
console.log("\nTahminler:");
for (const p of model3.predictions) {
  console.log(`${p.label}: GY=${p.gy_net.toFixed(2)}, GK=${p.gk_net.toFixed(2)}, Gerçek=${p.p3.toFixed(2)}, Tahmin=${p.predicted.toFixed(2)}, Hata=${p.residual.toFixed(3)}`);
}

// =====================================================
// MODEL 4: Polinom regresyon (2. derece)
// =====================================================
console.log("\n\n═══ MODEL 4: POLİNOMİYAL REGRESYON (2. derece) ═══");
const model4 = polynomialRegression(data2024, "p3");
if (model4) {
  console.log(`Formül: P3 = ${model4.C.toFixed(5)} + ${model4.A.toFixed(5)}*GY + ${model4.B.toFixed(5)}*GK + ${model4.D.toFixed(6)}*GY² + ${model4.E.toFixed(6)}*GK² + ${model4.F.toFixed(6)}*GY*GK`);
  console.log(`R² = ${model4.rSquared.toFixed(6)}`);
  console.log(`RMSE = ${model4.rmse.toFixed(4)}`);
  console.log(`MAE = ${model4.mae.toFixed(4)}`);
  console.log("\nTahminler:");
  for (const p of model4.predictions) {
    console.log(`${p.label}: Gerçek=${p.p3.toFixed(2)}, Tahmin=${p.predicted.toFixed(2)}, Hata=${p.residual.toFixed(3)}`);
  }
}

// =====================================================
// P1 ve P2 analizleri de yapalım (veri varsa)
// =====================================================
const dataWithP1 = data2024.filter(d => d.p1 !== null && d.p1 !== undefined);
console.log("\n\n═══ BONUS: P1 FORMÜLÜ ═══");
const modelP1 = linearRegression(dataWithP1, "p1");
console.log(`Formül: P1 = ${modelP1.C.toFixed(5)} + ${modelP1.A.toFixed(5)} * GY_net + ${modelP1.B.toFixed(5)} * GK_net`);
console.log(`R² = ${modelP1.rSquared.toFixed(6)}`);
console.log(`RMSE = ${modelP1.rmse.toFixed(4)}`);
console.log(`GY/GK oran: ${(modelP1.A / modelP1.B).toFixed(4)}`);

const dataWithP2 = data2024.filter(d => d.p2 !== null && d.p2 !== undefined);
console.log("\n═══ BONUS: P2 FORMÜLÜ ═══");
const modelP2 = linearRegression(dataWithP2, "p2");
console.log(`Formül: P2 = ${modelP2.C.toFixed(5)} + ${modelP2.A.toFixed(5)} * GY_net + ${modelP2.B.toFixed(5)} * GK_net`);
console.log(`R² = ${modelP2.rSquared.toFixed(6)}`);
console.log(`RMSE = ${modelP2.rmse.toFixed(4)}`);
console.log(`GY/GK oran: ${(modelP2.A / modelP2.B).toFixed(4)}`);

// =====================================================
// İLK TABLO VERİLERİNİN P3 OLUP OLMADIĞINI KONTROL ET
// =====================================================
console.log("\n\n═══ İLK TABLO VERİLERİNİN P3 UYUMLULUK TESTİ ═══");
console.log("Model 3 (en iyi doğrusal) kullanılarak:");
const table1Data = enrichData(firstTable);
for (const d of table1Data) {
  const predP3 = model3.C + model3.A * d.gy_net + model3.B * d.gk_net;
  const predP1 = modelP1.C + modelP1.A * d.gy_net + modelP1.B * d.gk_net;
  const predP2 = modelP2.C + modelP2.A * d.gy_net + modelP2.B * d.gk_net;
  const errP3 = d.puan - predP3;
  const errP1 = d.puan - predP1;
  const errP2 = d.puan - predP2;
  console.log(`${d.label}: PUAN=${d.puan.toFixed(2)} | P3 tahmin=${predP3.toFixed(2)} (Δ=${errP3.toFixed(2)}) | P1 tahmin=${predP1.toFixed(2)} (Δ=${errP1.toFixed(2)}) | P2 tahmin=${predP2.toFixed(2)} (Δ=${errP2.toFixed(2)})`);
}

// Tablo7 ile Sheet10'u karşılaştır (aynı GY/GK)
console.log("\n\n═══ KRİTİK KARŞILAŞTIRMA: Tablo7 vs Sheet10 ═══");
const tablo7 = table1Data.find(d => d.label === "Tablo7");
const sheet10 = data2024.find(d => d.label === "Sheet10");
console.log(`Tablo7:  GY=${tablo7.gy_net}, GK=${tablo7.gk_net}, PUAN=${tablo7.puan}, Sıra=${tablo7.rank}`);
console.log(`Sheet10: GY=${sheet10.gy_net}, GK=${sheet10.gk_net}, P3=${sheet10.p3.toFixed(5)}, P3 Sıra=${sheet10.p3_rank}`);
console.log(`→ AYNI netlere sahip! Tablo PUAN (${tablo7.puan}) vs Gerçek P3 (${sheet10.p3.toFixed(2)})`);
if (sheet10.p1) console.log(`→ Sheet10 P1: ${sheet10.p1.toFixed(5)}`);
if (sheet10.p2) console.log(`→ Sheet10 P2: ${sheet10.p2.toFixed(5)}`);

// =====================================================
// KIRMIZI RESİM VERİLERİ
// =====================================================
console.log("\n\n═══ KIRMIZI RESİM VERİLERİNİN P3 UYUMLULUK TESTİ ═══");
const redData = enrichData(redImage);
for (const d of redData) {
  const predP3 = model3.C + model3.A * d.gy_net + model3.B * d.gk_net;
  const predP1 = modelP1.C + modelP1.A * d.gy_net + modelP1.B * d.gk_net;
  const predP2 = modelP2.C + modelP2.A * d.gy_net + modelP2.B * d.gk_net;
  const errP3 = d.puan - predP3;
  const errP1 = d.puan - predP1;
  const errP2 = d.puan - predP2;
  console.log(`${d.label}: PUAN=${d.puan.toFixed(2)} | P3=${predP3.toFixed(2)} (Δ=${errP3.toFixed(2)}) | P1=${predP1.toFixed(2)} (Δ=${errP1.toFixed(2)}) | P2=${predP2.toFixed(2)} (Δ=${errP2.toFixed(2)})`);
}

// =====================================================
// EN İYİ MODEL ÖZETİ
// =====================================================
console.log("\n\n╔═══════════════════════════════════════════════════╗");
console.log("║            EN İYİ MODEL KARŞILAŞTIRMASI           ║");
console.log("╠═══════════════════════════════════════════════════╣");
console.log(`║ Model 1 (Mevcut):     RMSE = ${Math.sqrt(totalResidual1 / data2024.length).toFixed(4).padStart(8)}           ║`);
console.log(`║ Model 2 (Basit):      RMSE = ${model2.rmse.toFixed(4).padStart(8)}, R²=${model2.rSquared.toFixed(4)} ║`);
console.log(`║ Model 3 (GY+GK):     RMSE = ${model3.rmse.toFixed(4).padStart(8)}, R²=${model3.rSquared.toFixed(4)} ║`);
if (model4) {
  console.log(`║ Model 4 (Polinom):   RMSE = ${model4.rmse.toFixed(4).padStart(8)}, R²=${model4.rSquared.toFixed(4)} ║`);
}
console.log("╚═══════════════════════════════════════════════════╝");

// Basitleştirilmiş formül önerisi
console.log("\n\n═══ ÖNERİLEN FORMÜL ═══");
console.log(`P3 = ${model3.C.toFixed(2)} + ${model3.A.toFixed(4)} × GY_net + ${model3.B.toFixed(4)} × GK_net`);
console.log(`\nYuvarlanmış katsayılar:`);
const roundedC = Math.round(model3.C * 100) / 100;
const roundedA = Math.round(model3.A * 10000) / 10000;
const roundedB = Math.round(model3.B * 10000) / 10000;
console.log(`P3 ≈ ${roundedC} + ${roundedA} × GY_net + ${roundedB} × GK_net`);
console.log(`\nGY ağırlığı: %${(roundedA / (roundedA + roundedB) * 100).toFixed(1)}`);
console.log(`GK ağırlığı: %${(roundedB / (roundedA + roundedB) * 100).toFixed(1)}`);
