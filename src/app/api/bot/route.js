import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

const userState = new Map();

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
const WEB_URL = `https://368d-181-204-33-106.ngrok-free.app/mascota/`; // ej: https://miveterinaria.com/mascota/

export async function POST(req) {
  const body = await req.json();
  const message = body.message || body.callback_query?.message;
  const chatId = message.chat.id;
  const text = body.message?.text;
  const photo = body.message?.photo;

  const user = userState.get(chatId) || {};

  try {
    // Verificar si el chatId ya está en la base de datos
    const { data: existingUser, error: userError } = await supabase
      .from("mascotas")
      .select("user_telegram")
      .eq("user_telegram", chatId)
      .single();

    if (userError && userError.code !== "PGRST116") {
      // Si ocurre un error distinto a "no encontrado", lanza el error
      throw userError;
    }
    // Si ya completó todo y vuelve a mandar foto → resetea
    if (photo && user.telefono) {
      userState.delete(chatId);
      await sendMessage(
        chatId,
        "🔄 Registro finalizado. Para un nuevo registro, envía nuevamente la foto de tu mascota."
      );
      return NextResponse.json({});
    }

    // Paso 1: Espera foto
    if (!user.file_id) {
      if (!photo) {
        await sendMessage(
          chatId,
          "📸 Envía una foto de tu mascota para comenzar."
        );
        return NextResponse.json({});
      }

      const fileId = photo[photo.length - 1].file_id;
      user.file_id = fileId;
      userState.set(chatId, user);

      await sendMessage(chatId, "📛 ¿Cómo se llama tu mascota?");
      return NextResponse.json({});
    }

    // Paso 2: Nombre mascota
    if (!user.nombre_mascota) {
      user.nombre_mascota = text;
      userState.set(chatId, user);

      await sendMessage(chatId, "👤 ¿Cuál es tu nombre?");
      return NextResponse.json({});
    }

    // Paso 3: Nombre dueño
    if (!user.nombre_dueno) {
      user.nombre_dueno = text;
      userState.set(chatId, user);

      await sendMessage(
        chatId,
        "📞 ¿Cuál es tu número de teléfono? (ejemplo: +584123456789)"
      );
      return NextResponse.json({});
    }

    // Paso 4: Teléfono
    if (!user.telefono) {
      const telefonoRegex = /^\+?\d{10,15}$/;
      if (!telefonoRegex.test(text)) {
        await sendMessage(
          chatId,
          "❌ Número inválido. Debe ser tipo: +584123456789"
        );
        return NextResponse.json({});
      }

      user.telefono = text;
      userState.set(chatId, user);

      await sendMessage(chatId, "⏳ Guardando registro...");

      // Guardar foto en bucket Supabase
      const fileUrl = await uploadPhoto(user.file_id);

      // Guardar en DB
      const { data, error } = await supabase
        .from("mascotas")
        .insert({
          nombre_mascota: user.nombre_mascota,
          nombre_dueno: user.nombre_dueno,
          telefono: user.telefono,
          foto_url: fileUrl,
          user_telegram: chatId,
        })
        .select()
        .single();

      if (error) throw error;

      const idMascota = data.id;
      const qrUrl = await generateQR(`${WEB_URL}${idMascota}`);

      await sendPhoto(
        chatId,
        qrUrl,
        "🐶 ¡Registro completado! Escanea el QR para ver los datos de tu mascota."
      );

      userState.delete(chatId);
      return NextResponse.json({});
    }

    return NextResponse.json({});
  } catch (error) {
    console.error("Error:", error);
    await sendMessage(chatId, "❌ Ocurrió un error. Intenta más tarde.");
    return NextResponse.json({});
  }
}

// Funciones helpers

async function sendMessage(chatId, text) {
  await axios.post(`${API_URL}/sendMessage`, {
    chat_id: chatId,
    text,
  });
}

async function sendPhoto(chatId, photoUrl, caption) {
  await axios.post(`${API_URL}/sendPhoto`, {
    chat_id: chatId,
    photo: photoUrl,
    caption,
  });
}

async function uploadPhoto(fileId) {
  // Obtener link temporal de la foto de Telegram
  const res = await axios.get(`${API_URL}/getFile?file_id=${fileId}`);
  const filePath = res.data.result.file_path;
  const fileUrlTelegram = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;

  const fileName = `${uuidv4()}.jpg`;
  const { data, error } = await supabase.storage
    .from("fotos-mascotas")
    .upload(
      fileName,
      (
        await axios.get(fileUrlTelegram, { responseType: "arraybuffer" })
      ).data,
      {
        contentType: "image/jpeg",
      }
    );

  if (error) throw error;

  const { data: url } = supabase.storage
    .from("fotos-mascotas")
    .getPublicUrl(fileName);
  return url.publicUrl;
}

async function generateQR(data) {
  const res = await axios.get(
    `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
      data
    )}`
  );
  return res.request.res.responseUrl; // devuelve url de la imagen QR
}
