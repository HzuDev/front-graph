import React from "react";
import { History, Landmark, Calendar, ExternalLink, ChevronRight } from "lucide-react";
import { buildPath } from "../../../../lib/utils/paths";
import type { TimelineItem } from "../types";
import { formatDate } from "../utils/formatters";

interface TrayectoriaSectionProps {
  trayectoriaItems: TimelineItem[];
}

export const TrayectoriaSection: React.FC<TrayectoriaSectionProps> = ({ trayectoriaItems }) => {
  return (
    <div className="bg-white p-10 rounded-[4rem] shadow-2xl shadow-primary-green/5 border border-primary-green/5">
      <div className="flex items-center gap-4 mb-12">
        <div className="p-4 bg-primary-green text-hunter rounded-2xl">
          <History size={24} />
        </div>
        <div>
          <h3 className="text-3xl font-black tracking-tight">
            Servicio Público
          </h3>
          <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.3em]">
            Cargos desempeñados con fechas exactas
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {trayectoriaItems.length > 0 ? (
          trayectoriaItems.map((item) => (
            <div
              key={item.id}
              className="group block p-8 rounded-[3rem] bg-primary-green/5 border border-transparent hover:border-primary-green hover:bg-white transition-all duration-500"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-primary-green shadow-sm group-hover:bg-hunter transition-colors">
                    <Landmark size={24} />
                  </div>
                  <div>
                    {(() => {
                      const claimTarget = item.entidad || item.cargo;
                      const link = item.entidadId ? buildPath(`/entity?id=${item.entidadId}`) : null;
                      if (link) {
                        return (
                          <a
                            href={link}
                            className="text-xl font-black leading-tight mb-1 inline-flex items-center gap-2 hover:underline"
                          >
                            {claimTarget}
                            <ExternalLink size={14} />
                          </a>
                        );
                      }

                      return (
                        <h4 className="text-xl font-black leading-tight mb-1">
                          {claimTarget}
                        </h4>
                      );
                    })()}
                    <div className="flex items-center gap-2 text-primary-green/40 font-bold uppercase text-[10px] tracking-widest">
                      <span>{item.cargo}</span>
                      <ChevronRight size={10} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-hunter px-5 py-2.5 rounded-2xl border border-primary-green/10 shadow-sm">
                  <Calendar size={14} className="opacity-40" />
                  <span className="text-xs font-black">
                    {item.inicio || item.fin
                      ? `${formatDate(item.inicio || undefined)} — ${formatDate(item.fin || undefined)}`
                      : formatDate(undefined)}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 opacity-40 font-bold text-sm">
            No se encontró información de servicio público.
          </div>
        )}
      </div>
    </div>
  );
};
