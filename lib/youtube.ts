export async function fetchTranscript(videoId: string): Promise<string> {
  try {
    const response = await fetch(`/api/transcript?videoId=${videoId}`);
    const data = await response.json();
    
    if (!response.ok) {
      console.warn("Sunucu hatası:", data.error);
      throw new Error(data.error || "Altyazı çekilirken bir hata oluştu.");
    }
    
    if (!data.transcript) {
      throw new Error("Altyazı boş döndü.");
    }
    
    return data.transcript;
  } catch (error: any) {
    console.warn("Vercel sunucusu başarısız oldu, istemci tarafı (client-side) yedeğine geçiliyor...", error);
    
    try {
      return await fetchTranscriptClientFallback(videoId);
    } catch (fallbackError: any) {
      console.error("İstemci yedeği de başarısız oldu:", fallbackError);
      throw new Error("Altyazı çekilemedi. YouTube sunucularımız engellemiş olabilir veya videonun altyazısı yok. Lütfen farklı bir video ile tekrar deneyin.");
    }
  }
}

async function fetchTranscriptClientFallback(videoId: string): Promise<string> {
  // İstemci tarafında CORS aşmak için allorigins proxy'sini kullanıyoruz.
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`;
  const response = await fetch(proxyUrl);
  const data = await response.json();
  const html = data.contents;
  
  if (!html) throw new Error("Proxy boş yanıt döndü");

  const match = html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*;\s*(?:var\s+meta|<\/script|\n)/);
  if (!match) throw new Error("Player response bulunamadı");
  
  const playerResponse = JSON.parse(match[1]);
  const tracks = playerResponse.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  
  if (!tracks || !tracks.length) throw new Error("Videonun altyazısı bulunamadı");
  
  // Önce Türkçe, yoksa ilk altyazıyı seç
  const track = tracks.find((t: any) => t.languageCode === 'tr') || tracks[0];
  
  const xmlProxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(track.baseUrl)}`;
  const xmlResponse = await fetch(xmlProxyUrl);
  const xmlData = await xmlResponse.json();
  const xmlText = xmlData.contents;
  
  if (!xmlText) throw new Error("XML boş döndü");

  const regex = /<text[^>]*start="([^"]+)"[^>]*>([^<]+)<\/text>/g;
  const lines = [];
  let m;
  
  while ((m = regex.exec(xmlText)) !== null) {
    const start = parseFloat(m[1]);
    const min = Math.floor(start / 60);
    const sec = Math.floor(start % 60);
    const time = `${min}:${sec.toString().padStart(2, '0')}`;
    // Temel HTML entity çözme
    const text = m[2].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
    lines.push(`[${time}] ${text}`);
  }
  
  if (lines.length === 0) throw new Error("Altyazı satırları ayrıştırılamadı");
  return lines.join('\n');
}

export function extractVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regex);
  return match ? match[1] : null;
}
