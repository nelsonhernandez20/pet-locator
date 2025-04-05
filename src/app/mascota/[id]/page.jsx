"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useParams } from "next/navigation";

export default function MascotaPage() {
  const [mascota, setMascota] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();
  const { id } = useParams();
  const color = searchParams.get("color") || "negro";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/mascotas/${id}`);
        if (!response.ok) throw new Error("Error al cargar los datos de la mascota.");
        const data = await response.json();
        setMascota(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleNotificar = async () => {
    const telefono = prompt("Ingresa tu número de teléfono:");

    if (!telefono) {
      alert("El número de teléfono es obligatorio.");
      return;
    }

    try {
      const response = await fetch(`/api/mascotas/${id}/notificar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ telefono }),
      });
      if (!response.ok) throw new Error("Error al notificar al dueño.");
      alert("Notificación enviada al dueño.");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleActualizarUbicacion = async () => {
    if (!navigator.geolocation) {
      alert("La geolocalización no es compatible con tu navegador.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`/api/mascotas/${id}/ubicacion`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lat: latitude,
              lng: longitude,
            }),
          });
          if (!response.ok) throw new Error("Error al actualizar la ubicación.");
          alert("Ubicación actualizada y notificación enviada al dueño.");
        } catch (err) {
          alert(err.message);
        }
      },
      (error) => {
        alert("No se pudo obtener la ubicación. Por favor, inténtalo de nuevo.");
        console.error("Error de geolocalización:", error);
      }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 text-lg">Cargando información...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center p-6"
      style={{ backgroundColor: getColor(color) }}
    >
      <div className="bg-white shadow-xl rounded-2xl p-6 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-teal-600 mb-4">
          🐾 {mascota.nombre_mascota}
        </h1>
        <img
          src={mascota.foto_url}
          alt="Foto de la mascota"
          className="rounded-xl w-full max-h-80 object-cover mb-4"
        />
        <div className="text-left space-y-2">
          <p className="text-lg text-teal-600">
            <span className="font-semibold text-black">👤 Dueño:</span>{" "}
            {mascota.nombre_dueno}
          </p>
          <p className="text-lg text-teal-600">
            <span className="font-semibold text-black">📞 Teléfono:</span>{" "}
            {mascota.telefono}
          </p>
        </div>
        <div className="mt-4 space-y-2">
          <button
            onClick={handleNotificar}
            className="bg-teal-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-teal-700"
          >
           Envia tu numero de teléfono
          </button>
          <button
            onClick={handleActualizarUbicacion}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-blue-700"
          >
            Envia tu ubicación
          </button>
        </div>
      </div>
    </div>
  );
}

function getColor(color) {
  const colores = {
    rojo: "#e74c3c",
    azul: "#3498db",
    rosado: "#ff69b4",
    verde: "#2ecc71",
    negro: "#000000",
  };
  return colores[color] || "#000000";
}