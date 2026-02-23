import React from "react";
import { BarChart3, ExternalLink, ChevronRight } from "lucide-react";
import type { LinkItem } from "../types";

interface EncuestasSectionProps {
  encuestasItems: LinkItem[];
}

export const EncuestasSection: React.FC<EncuestasSectionProps> = ({ encuestasItems }) => {
  return (
    <div className="bg-white p-10 rounded-[4rem] shadow-xl border border-primary-green/5">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-4 bg-primary-green/5 rounded-2xl text-primary-green">
          <BarChart3 size={24} />
        </div>
        <div>
          <h3 className="text-2xl font-black tracking-tight">Encuestas asociadas</h3>
          <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.3em]">
            Estudios de opinion vinculados al candidato
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {encuestasItems.length > 0 ? (
          encuestasItems.map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 rounded-[2rem] bg-primary-green/5 border border-transparent hover:border-primary-green/10 transition-all gap-4">
              <div className="flex items-center gap-4">
                <span className="px-2 py-1 bg-primary-green text-hunter rounded text-[8px] font-black uppercase tracking-widest">
                  {item.tipo}
                </span>
                <p className="text-sm font-bold text-primary-green">
                  {item.link ? (
                    <a href={item.link} className="hover:underline inline-flex items-center gap-1">
                      {item.detalle}
                      <ExternalLink size={10} />
                    </a>
                  ) : (
                    item.detalle
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2 opacity-40 italic text-[10px] font-bold uppercase tracking-tighter">
                <span>{item.relacion || "Sujeto de estudio"}</span>
                <ChevronRight size={12} />
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 opacity-40 font-bold text-sm">
            No se encontraron encuestas asociadas.
          </div>
        )}
      </div>
    </div>
  );
};
