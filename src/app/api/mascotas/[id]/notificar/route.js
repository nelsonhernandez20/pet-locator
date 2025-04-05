import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`

export async function POST(req, { params }) {
  const { id } = await params;
  const { telefono } = await req.json(); // Recibe el teléfono del frontend

  const { data, error } = await supabase
    .from('mascotas')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Mascota no encontrada' }, { status: 404 });
  }

  const text = `🐾 ¡Alguien ha escaneado el código QR de tu mascota ${data.nombre_mascota}!\n📞 Teléfono del encontrador: ${telefono}`;

  const response = await fetch(TELEGRAM_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: data.user_telegram, // Asegúrate de que este campo contiene el chat_id correcto
      text,
    }),
  });

  const result = await response.json();
  if (!response.ok) {
    return NextResponse.json({ error: 'Error al enviar el mensaje a Telegram', details: result }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}