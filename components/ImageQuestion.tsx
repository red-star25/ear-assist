"use client";

import { ChangeEvent, useState } from "react";

export default function ImageQuestion() {
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleImage(event: ChangeEvent<HTMLInputElement>) {
    const image = event.target.files?.[0];

    if (!image) return;

    try {
      setLoading(true);
      setAnswer("");

      const formData = new FormData();
      formData.append("image", image);

      const response = await fetch("/api/analyze-image", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Image analysis failed");
      }

      setAnswer(result.answer);

      // Basic MVP speech output.
      window.speechSynthesis.cancel();

      const speech = new SpeechSynthesisUtterance(result.answer);

      speech.rate = 1.2;
      speech.volume = 0.8;

      window.speechSynthesis.speak(speech);
    } catch (error) {
      console.error(error);
      setAnswer("The image could not be analyzed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-slate-800 p-5">
      <h2 className="text-lg font-semibold">Visual Question</h2>

      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImage}
        className="mt-4 block w-full"
      />

      {loading && <p className="mt-4 text-slate-400">Analyzing image...</p>}

      {answer && <p className="mt-4 whitespace-pre-wrap">{answer}</p>}
    </section>
  );
}
