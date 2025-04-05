// app/api/mascotas/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req) {
  const formData = await req.formData()

  const nombre_mascota = formData.get('nombre_mascota')
  const nombre_dueno = formData.get('nombre_dueno')
  const telefono = formData.get('telefono')
  const file = formData.get('foto')

  const filename = `${uuidv4()}.jpg`
  const { data: fileData, error: uploadError } = await supabase.storage
    .from('fotos-mascotas')
    .upload(filename, file, {
      contentType: file.type,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const foto_url = `https://${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/fotos-mascotas/${filename}`

  const { data, error } = await supabase.from('mascotas').insert([
    {
      nombre_mascota,
      nombre_dueno,
      telefono,
      foto_url,
    },
  ]).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ id: data.id }, { status: 201 })
}
