import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request, context) {
  const { params } = await context; // <- necesario await
  const { id } = await params;

  console.log('ID de mascota:', id);

  const { data, error } = await supabase
    .from('mascotas')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Mascota no encontrada' }, { status: 404 });
  }

  return NextResponse.json(data, { status: 200 });
}
