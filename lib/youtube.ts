// ============================================================
// YouTube Transcript Fetcher — Multi-Strategy
// ============================================================
// Strategy 1: Our Vercel API route (server-side InnerTube API)
// Strategy 2: Client-side InnerTube API via CORS proxy
// Strategy 3: Client-side YouTube page scrape via CORS proxy
// All automatic — user sees nothing.
// ============================================================

export function extractVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regex);
  return match ? match[1] : null;
}

// ── Helpers ──────────────────────────────────────────────────

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/\n/g, " ");
}

function formatTimestamp(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

/** Parse YouTube's timedtext XML (both srv3 and classic formats) */
function parseTimedTextXml(xml: string): string {
  const lines: string[] = [];

  // srv3 format: <p t="ms" d="ms"><s>word</s>...</p>
  const pRegex = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
  let match: RegExpExecArray | null;
  while ((match = pRegex.exec(xml)) !== null) {
    const ms = parseInt(match[1], 10);
    const sec = Math.floor(ms / 1000);
    let text = match[3].replace(/<[^>]+>/g, "");
    text = decodeHtmlEntities(text).trim();
    if (text) {
      lines.push(`[${formatTimestamp(sec)}] ${text}`);
    }
  }
  if (lines.length > 0) return lines.join("\n");

  // Classic format: <text start="s" dur="s">content</text>
  const classicRegex = /<text[^>]*start="([^"]*)"[^>]*>([\s\S]*?)<\/text>/g;
  while ((match = classicRegex.exec(xml)) !== null) {
    const sec = parseFloat(match[1]);
    let text = match[2].replace(/<[^>]+>/g, "");
    text = decodeHtmlEntities(text).trim();
    if (text) {
      lines.push(`[${formatTimestamp(sec)}] ${text}`);
    }
  }
  return lines.join("\n");
}

/** Extract caption track URLs from YouTube watch page HTML */
function extractCaptionTracksFromHtml(html: string): { baseUrl: string; languageCode: string }[] {
  // Method 1: Parse ytInitialPlayerResponse properly (brace counting)
  const startToken = "var ytInitialPlayerResponse = ";
  let startIndex = html.indexOf(startToken);
  if (startIndex === -1) {
    // Try without 'var'
    const altToken = "ytInitialPlayerResponse = ";
    startIndex = html.indexOf(altToken);
    if (startIndex !== -1) startIndex += altToken.length;
  } else {
    startIndex += startToken.length;
  }

  if (startIndex !== -1 && startIndex > 0) {
    let depth = 0;
    for (let i = startIndex; i < html.length && i < startIndex + 500000; i++) {
      if (html[i] === "{") depth++;
      else if (html[i] === "}") {
        depth--;
        if (depth === 0) {
          try {
            const json = JSON.parse(html.slice(startIndex, i + 1));
            const tracks = json?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
            if (Array.isArray(tracks) && tracks.length > 0) {
              return tracks.map((t: any) => ({
                baseUrl: t.baseUrl as string,
                languageCode: t.languageCode as string,
              }));
            }
          } catch {
            // Parse failed
          }
          break;
        }
      }
    }
  }

  // Method 2: Regex fallback for captionTracks array
  const fallback = html.match(/"captionTracks"\s*:\s*(\[[\s\S]*?\])\s*,/);
  if (fallback) {
    try {
      const tracks = JSON.parse(fallback[1]);
      if (Array.isArray(tracks) && tracks.length > 0) {
        return tracks.map((t: any) => ({
          baseUrl: (t.baseUrl as string).replace(/\\u0026/g, "&"),
          languageCode: t.languageCode as string,
        }));
      }
    } catch {
      // ignore
    }
  }

  return [];
}

function pickBestTrack(tracks: { baseUrl: string; languageCode: string }[]): string | null {
  const turkish = tracks.find((t) => t.languageCode === "tr");
  if (turkish) return turkish.baseUrl;
  return tracks[0]?.baseUrl ?? null;
}

// ── CORS Proxy helpers ───────────────────────────────────────

type ProxyFn = (url: string) => string;

const CORS_PROXIES: ProxyFn[] = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
];

async function fetchViaProxy(url: string, proxy: ProxyFn, timeoutMs = 12000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(proxy(url), { signal: controller.signal });
    if (!res.ok) throw new Error(`Proxy returned ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

// ── Strategy 1: Our Vercel API ───────────────────────────────

async function fetchViaServerApi(videoId: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(`/api/transcript?videoId=${videoId}`, {
      signal: controller.signal,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Server API failed");
    if (!data.transcript) throw new Error("Empty transcript from server");
    return data.transcript;
  } finally {
    clearTimeout(timer);
  }
}

// ── Strategy 2: Client-side YouTube page scrape via CORS proxy ──

async function fetchViaClientScrape(videoId: string): Promise<string> {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  let lastError: Error | null = null;

  for (const proxy of CORS_PROXIES) {
    try {
      console.log(`[Transcript] Trying client-side scrape via proxy...`);

      // Step 1: Fetch YouTube watch page HTML via CORS proxy
      const html = await fetchViaProxy(videoUrl, proxy, 15000);
      if (!html || html.length < 5000) {
        throw new Error("Page HTML too short");
      }

      // Step 2: Extract caption tracks from the HTML
      const tracks = extractCaptionTracksFromHtml(html);
      if (tracks.length === 0) {
        throw new Error("No caption tracks found in page HTML");
      }

      // Step 3: Pick best track and fetch caption XML
      const captionUrl = pickBestTrack(tracks);
      if (!captionUrl) throw new Error("No usable caption track URL");

      // Fetch caption XML — try via same proxy
      let xml: string | null = null;
      for (const p of CORS_PROXIES) {
        try {
          xml = await fetchViaProxy(captionUrl, p, 12000);
          if (xml && xml.length > 100 && !xml.includes("Error 404")) break;
          xml = null;
        } catch {
          // Try next proxy
        }
      }

      if (!xml) throw new Error("Could not fetch caption XML via any proxy");

      // Step 4: Parse the XML
      const transcript = parseTimedTextXml(xml);
      if (!transcript || transcript.length < 50) {
        throw new Error("Parsed transcript too short");
      }

      console.log(`[Transcript] Client-side scrape succeeded!`);
      return transcript;
    } catch (err: any) {
      console.warn(`[Transcript] Client proxy failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("All client-side proxy attempts failed");
}

// ── Strategy 3: Client-side InnerTube via proxy ──────────────────

async function fetchViaClientInnerTube(videoId: string): Promise<string> {
  const config = {
    name: 'ANDROID',
    context: {
      client: {
        clientName: 'ANDROID',
        clientVersion: '20.10.38',
        androidSdkVersion: 34,
        hl: 'tr',
        gl: 'TR',
      },
    },
    userAgent: 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)',
  };

  const INNERTUBE_URL = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';
  const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(INNERTUBE_URL)}`;

  console.log(`[Transcript] Trying Client InnerTube via corsproxy.io...`);
  
  const res = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-corsproxy-headers': JSON.stringify({ 'User-Agent': config.userAgent })
    },
    body: JSON.stringify({
      context: config.context,
      videoId,
    }),
  });

  if (!res.ok) throw new Error(`InnerTube Proxy HTTP ${res.status}`);
  const data = await res.json();
  
  if (data?.playabilityStatus?.status !== 'OK') {
     throw new Error(`InnerTube: ${data?.playabilityStatus?.status || 'UNKNOWN'}`);
  }

  const captionTracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!Array.isArray(captionTracks) || captionTracks.length === 0) {
     throw new Error(`InnerTube: No caption tracks`);
  }

  const track = captionTracks.find((t: any) => t.languageCode === 'tr') || captionTracks[0];
  const captionUrl = track.baseUrl;

  const captionProxyUrl = `https://corsproxy.io/?${encodeURIComponent(captionUrl)}`;
  const captionRes = await fetch(captionProxyUrl, {
    headers: {
      'x-corsproxy-headers': JSON.stringify({ 'User-Agent': config.userAgent })
    }
  });

  if (!captionRes.ok) throw new Error(`Caption Proxy HTTP ${captionRes.status}`);
  const xml = await captionRes.text();
  
  const transcript = parseTimedTextXml(xml);
  if (!transcript || transcript.length < 50) throw new Error("Parsed transcript too short");
  
  console.log(`[Transcript] Client InnerTube succeeded!`);
  return transcript;
}

// ── Main export ──────────────────────────────────────────────

export async function fetchTranscript(videoId: string): Promise<string> {
  const errors: string[] = [];

  // Strategy 1: Server API (custom InnerTube + youtube-transcript fallback)
  try {
    console.log("[Transcript] Trying server API...");
    const result = await fetchViaServerApi(videoId);
    console.log("[Transcript] Server API succeeded!");
    return result;
  } catch (serverErr: any) {
    const msg = serverErr.message;
    console.warn("[Transcript] Server API failed:", msg);
    errors.push(`Sunucu API: ${msg.includes('Unexpected token') ? 'API bulunamadı (Statik sunucu)' : msg}`);
  }

  // Strategy 2: Client-side InnerTube via proxy
  try {
    const result = await fetchViaClientInnerTube(videoId);
    return result;
  } catch (clientInnerErr: any) {
    console.warn("[Transcript] Client InnerTube failed:", clientInnerErr.message);
    errors.push(`Client Proxy: ${clientInnerErr.message}`);
  }

  // Strategy 3: Client-side YouTube page scrape via CORS proxies
  try {
    console.log("[Transcript] Falling back to client-side scrape...");
    const result = await fetchViaClientScrape(videoId);
    return result;
  } catch (clientErr: any) {
    console.warn("[Transcript] Client-side scrape failed:", clientErr.message);
    errors.push(`Web Scrape: ${clientErr.message}`);
  }

  // All strategies exhausted
  throw new Error(
    `Altyazı çekilemedi.\nHatalar:\n${errors.join('\n')}\nLütfen manuel olarak eklemeyi deneyin.`
  );
}
