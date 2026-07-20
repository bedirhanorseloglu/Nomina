async function test() {
  const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
  const proxy = "https://api.allorigins.win/get?url=";
  try {
    const res = await fetch(proxy + encodeURIComponent(url));
    if (!res.ok) throw new Error("status: " + res.status);
    const data = await res.json();
    const text = data.contents;
    console.log("Success! Length:", text.length);
    console.log("Has captions?", text.includes('"captions":'));
  } catch (err) {
    console.error("Error:", err);
  }
}
test();
