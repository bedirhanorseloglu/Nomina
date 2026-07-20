import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';

export const dynamic = 'force-dynamic';
export const revalidate = 0;


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: 'Missing videoId parameter' }, { status: 400 });
  }

  try {
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
    
    // Convert array of objects to a single string with timestamps
    const formattedTranscript = transcriptItems.map(item => {
      // Convert offset in ms to mm:ss format
      const startSec = Math.floor(item.offset / 1000);
      const min = Math.floor(startSec / 60);
      const sec = startSec % 60;
      const timeStr = `${min}:${sec.toString().padStart(2, '0')}`;
      
      // Escape special characters and remove newlines in text
      const cleanText = item.text.replace(/\n/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
      return `[${timeStr}] ${cleanText}`;
    }).join('\n');

    return NextResponse.json({ transcript: formattedTranscript });
  } catch (error: any) {
    console.error('Transcript API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transcript. The video might not have captions or is restricted.' },
      { status: 500 }
    );
  }
}
