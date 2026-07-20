export async function fetchTranscript(videoId: string): Promise<string> {
  try {
    const response = await fetch(`/api/transcript?videoId=${videoId}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Altyazı çekilirken bir hata oluştu.");
    }
    
    if (!data.transcript) {
      throw new Error("Altyazı boş döndü.");
    }
    
    return data.transcript;
  } catch (error: any) {
    console.error("Transcript fetch error:", error);
    throw new Error(error.message || "Altyazı çekilirken bir hata oluştu. Lütfen videonun otomatik veya manuel altyazısı olduğundan emin olun.");
  }
}

export function extractVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regex);
  return match ? match[1] : null;
}
