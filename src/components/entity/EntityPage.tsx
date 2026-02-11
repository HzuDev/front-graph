import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { fetchEntityDetails, type Entity, type Claim } from "../../lib/queries";
import { EntityDetail } from "./EntityDetail";
import { buildPath } from "../../lib/utils/paths";

export default function EntityPage() {
  const [entity, setEntity] = useState<Entity | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const id = params.get("id");

        if (!id) {
          setError("ID de entidad no proporcionado");
          return;
        }

        const data = await fetchEntityDetails(id);
        setEntity(data.entity);
        setClaims(data.claims);
      } catch (err: any) {
        console.error("Error loading entity:", err);
        setError("Error cargando la entidad. Verifique el ID o su conexión.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#14281d]" />
          <p className="text-[#14281d]/60 font-medium">Cargando detalles...</p>
        </div>
      </div>
    );
  }

  if (error || !entity) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">
            {error || "Entidad no encontrada"}
          </p>
          <a
            href={buildPath("/")}
            className="inline-flex items-center justify-center px-6 py-3 bg-[#14281d] text-white rounded-xl font-bold hover:opacity-90 transition-opacity w-full"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  return <EntityDetail entity={entity} claims={claims} />;
}
