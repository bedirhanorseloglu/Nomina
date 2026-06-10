function stripUndefined(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(stripUndefined);
  }
  if (obj !== null && typeof obj === "object") {
    if (obj.constructor && obj.constructor.name !== "Object" && obj.constructor.name !== "Array") {
      return obj;
    }
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndefined(v)])
    );
  }
  return obj;
}

const data = {
  denemeler: [
    {
      id: "abc",
      name: "Test",
      date: "2026-06-11",
      publisher: undefined,
      note: undefined,
      examType: "brans",
      bransSubjectId: "matematik",
      scores: [
        { subjectId: "matematik", correct: 10, wrong: 5, empty: 15 }
      ]
    }
  ]
};

try {
  console.log(JSON.stringify(stripUndefined(data), null, 2));
} catch (e) {
  console.error("Error:", e);
}
