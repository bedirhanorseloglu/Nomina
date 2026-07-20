import { NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
  }

  try {
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
    // Combine transcript pieces with their timestamps
    const fullText = transcriptItems.map(item => {
      // item.offset is in milliseconds
      const totalSeconds = Math.floor(item.offset / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const formattedTime = `[${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}]`;
      return `${formattedTime} ${item.text}`;
    }).join('\n');
    
    return NextResponse.json({ transcript: fullText });
  } catch (error: any) {
    console.error('Transcript API Error:', error);
    return NextResponse.json({ 
      error: 'Bu videonun altyazısı alınamadı. Manuel veya otomatik altyazısı olmayabilir veya YouTube tarafından engellenmiş olabilir.' 
    }, { status: 500 });
  }
}
