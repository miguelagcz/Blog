
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { texto, idioma } = await req.json();

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `Eres un traductor literario especializado en poesía.
Traduce el siguiente poema del español al ${idioma}.
Responde ÚNICAMENTE en ${idioma}. No incluyas ninguna palabra en español.
Preserva los saltos de línea exactamente como están en el original.
Mantén el tono poético, la brevedad, el ritmo y la emoción del original.
No agregues título, comillas, explicaciones ni notas.

Poema:
${texto}`,
      }],
    }),
  });

  const data = await res.json();
  const traduccion = data.content?.[0]?.text ?? texto;
  return NextResponse.json({ traduccion: traduccion.trim() });
}