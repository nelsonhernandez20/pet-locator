import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`

export async function POST(req, { params }) {
  const body = await req.json()
  const {id} = await params
  const { lat, lng} = body

  const { data: mascota, error } = await supabase
    .from('mascotas')
    .update({
      encontrado: true,
      ubicacion: { lat, lng },
    })
    .eq('id', id)
    .select()
    .single()

  if (error || !mascota) {
    return NextResponse.json({ error: 'Mascota no encontrada' }, { status: 404 })
  }

  const text = `📍 ¡Han enviado la ubicación de ${mascota.nombre_mascota}!\n\nUbicación:\nhttps://maps.google.com/?q=${lat},${lng}`

  const response = await fetch(TELEGRAM_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: mascota.user_telegram, // de nuevo, debe ser el chat_id del dueño
      text,
    }),
  })

  return NextResponse.json({ success: true })
}