

async function testProxy() {
  const videoId = 'dQw4w9WgXcQ'; // Rick roll
  const url = `https://api.allorigins.win/get?url=${encodeURIComponent('https://www.youtube.com/watch?v=' + videoId)}`;
  console.log("Fetching from", url);
  const response = await fetch(url);
  const data = await response.json();
  const html = data.contents;
  
  if (html.includes('captions')) {
    console.log("Found captions!");
  } else if (html.includes('consent')) {
    console.log("Got consent page :(");
  } else {
    console.log("Got something else. Length:", html.length);
  }
}

testProxy();
