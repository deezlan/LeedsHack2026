// app/api/stt/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // ensure Node runtime

export async function POST(req: Request) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing ELEVENLABS_API_KEY" }, { status: 500 });
    }

    // Expect multipart/form-data with a "file" field
    const form = await req.formData();
    const file = form.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Expected "file" in multipart/form-data' }, { status: 400 });
    }

    // Forward to ElevenLabs STT
    const upstream = new FormData();
    upstream.append("file", file, (file as any).name ?? "audio.webm");
    upstream.append("model_id", "scribe_v2");         // from docs quickstart
    upstream.append("diarize", "false");              // optional
    upstream.append("tag_audio_events", "false");     // optional
    // upstream.append("language_code", "eng");        // optional; auto-detect if omitted

    const resp = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        // NOTE: do NOT set Content-Type for FormData; fetch will set it with boundary
      },
      body: upstream,
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return NextResponse.json(
        { error: "ElevenLabs STT failed", details: errText },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    // ElevenLabs returns a transcription object; commonly has "text"
    const text = data?.text ?? data?.transcript ?? "";
    return NextResponse.json({ text, raw: data });
  } catch (e: any) {
    return NextResponse.json({ error: "STT route error", details: String(e) }, { status: 500 });
  }
}
