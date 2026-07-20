import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const INNERTUBE_API_URL = 'https://www.youtube.com/youtubei/v1/player?prettyPrint=false';

// Multiple client configs to try — if one is blocked, try the next
const CLIENT_CONFIGS = [
  {
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
  },
  {
    name: 'IOS',
    context: {
      client: {
        clientName: 'IOS',
        clientVersion: '20.10.38',
        deviceMake: 'Apple',
        deviceModel: 'iPhone16,2',
        hl: 'tr',
        gl: 'TR',
      },
    },
    userAgent: 'com.google.ios.youtube/20.10.38 (iPhone16,2; U; CPU iOS 18_1 like Mac OS X)',
  },
  {
    name: 'ANDROID_EMBEDDED',
    context: {
      client: {
        clientName: 'ANDROID_EMBEDDED_PLAYER',
        clientVersion: '20.10.38',
        androidSdkVersion: 34,
        hl: 'tr',
        gl: 'TR',
      },
    },
    userAgent: 'com.google.android.youtube/20.10.38 (Linux; U; Android 14)',
  },
];

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)));
}

function formatTimestamp(seconds: number): string {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function parseTranscriptXml(xml: string): string {
  const lines: string[] = [];

  // srv3 format: <p t="ms" d="ms"><s>word</s>...</p>
  const pRegex = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
  let match;
  while ((match = pRegex.exec(xml)) !== null) {
    const ms = parseInt(match[1], 10);
    const sec = Math.floor(ms / 1000);
    let text = match[3].replace(/<[^>]+>/g, '');
    text = decodeEntities(text).trim().replace(/\n/g, ' ');
    if (text) {
      lines.push(`[${formatTimestamp(sec)}] ${text}`);
    }
  }

  if (lines.length > 0) return lines.join('\n');

  // Classic format: <text start="s" dur="s">content</text>
  const classicRegex = /<text[^>]*start="([^"]*)"[^>]*>([\s\S]*?)<\/text>/g;
  while ((match = classicRegex.exec(xml)) !== null) {
    const sec = parseFloat(match[1]);
    let text = match[2].replace(/<[^>]+>/g, '');
    text = decodeEntities(text).trim().replace(/\n/g, ' ');
    if (text) {
      lines.push(`[${formatTimestamp(sec)}] ${text}`);
    }
  }

  return lines.join('\n');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: 'Missing videoId parameter' }, { status: 400 });
  }

  let lastError = '';

  // Try each client config
  for (const config of CLIENT_CONFIGS) {
    try {
      console.log(`[Transcript] Trying ${config.name} client for video ${videoId}...`);

      const playerResponse = await fetch(INNERTUBE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': config.userAgent,
        },
        body: JSON.stringify({
          context: config.context,
          videoId,
        }),
      });

      if (!playerResponse.ok) {
        lastError = `${config.name}: HTTP ${playerResponse.status}`;
        continue;
      }

      const data = await playerResponse.json();

      if (data?.playabilityStatus?.status !== 'OK') {
        lastError = `${config.name}: ${data?.playabilityStatus?.status || 'UNKNOWN'}`;
        continue;
      }

      const captionTracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (!Array.isArray(captionTracks) || captionTracks.length === 0) {
        lastError = `${config.name}: No caption tracks`;
        continue;
      }

      // Prefer Turkish, else first track
      const track = captionTracks.find((t: any) => t.languageCode === 'tr') || captionTracks[0];
      const captionUrl = track.baseUrl;

      if (!captionUrl) {
        lastError = `${config.name}: No baseUrl in track`;
        continue;
      }

      // Fetch the actual caption XML
      const captionResponse = await fetch(captionUrl, {
        headers: { 'User-Agent': config.userAgent },
      });

      if (!captionResponse.ok) {
        lastError = `${config.name}: Caption fetch HTTP ${captionResponse.status}`;
        continue;
      }

      const xml = await captionResponse.text();

      if (!xml || xml.length < 50 || xml.includes('Error 404')) {
        lastError = `${config.name}: Empty or error caption response`;
        continue;
      }

      const transcript = parseTranscriptXml(xml);
      if (!transcript || transcript.length < 50) {
        lastError = `${config.name}: Parsed transcript too short`;
        continue;
      }

      console.log(`[Transcript] Success with ${config.name}! Lines: ${transcript.split('\n').length}`);
      return NextResponse.json({ transcript });
    } catch (error: any) {
      lastError = `${config.name}: ${error.message}`;
      console.error(`[Transcript] ${config.name} failed:`, error.message);
    }
  }

  // All clients failed — try youtube-transcript library as last resort
  try {
    console.log('[Transcript] All InnerTube clients failed, trying youtube-transcript library...');
    const { YoutubeTranscript } = await import('youtube-transcript');
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);

    const formattedTranscript = transcriptItems.map((item: any) => {
      const startSec = Math.floor(item.offset / 1000);
      const timeStr = formatTimestamp(startSec);
      const cleanText = decodeEntities(item.text.replace(/\n/g, ' '));
      return `[${timeStr}] ${cleanText}`;
    }).join('\n');

    return NextResponse.json({ transcript: formattedTranscript });
  } catch (error: any) {
    console.error('[Transcript] youtube-transcript library also failed:', error.message);
  }

  return NextResponse.json(
    { error: `Altyazı çekilemedi. Tüm yöntemler başarısız oldu. (${lastError})` },
    { status: 500 }
  );
}
