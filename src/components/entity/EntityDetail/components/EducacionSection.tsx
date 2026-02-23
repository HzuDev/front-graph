import React from "react";
import { GraduationCap, ExternalLink } from "lucide-react";
import { buildPath } from "../../../../lib/utils/paths";
import type { EducationItem } from "../types";
import { formatDate } from "../utils/formatters";
import { isIdLike } from "../utils/claimHelpers";

interface EducacionSectionProps {
  educacionItems: EducationItem[];
}

export const EducacionSection: React.FC<EducacionSectionProps> = ({ educacionItems }) => {
  return (
    <div className="bg-white p-10 rounded-[4rem] shadow-xl border border-primary-green/5">
      <div className="flex items-center gap-4 mb-10">
        <div className="p-4 bg-primary-green/5 rounded-2xl text-primary-green">
          <GraduationCap size={24} />
        </div>
        <h3 className="text-2xl font-black tracking-tight">
          Formación Académica
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {educacionItems.length > 0 ? (
          educacionItems.map((item) => (
            <div
              key={item.id}
              className="p-8 rounded-[2.5rem] border border-primary-green/10 bg-linear-to-br from-white to-primary-green/5 hover:shadow-xl transition-all"
            >
              {(() => {
                const title = item.universidad || item.titulo;
                const link = item.universidadId
                  ? buildPath(`/entity?id=${item.universidadId}`)
                  : null;
                if (link && !isIdLike(title)) {
                  return (
                    <a
                      href={link}
                      className="font-black text-sm mb-3 leading-snug inline-flex items-center gap-2 hover:underline"
                    >
                      {title}
                      <ExternalLink size={12} />
                    </a>
                  );
                }
                return <h4 className="font-black text-sm mb-3 leading-snug">{title}</h4>;
              })()}
              <div className="flex justify-between items-end">
                <p className="text-[10px] font-bold opacity-40 uppercase tracking-tighter max-w-30">
                  {item.titulo}
                </p>
                <span className="text-[9px] font-black bg-primary-green text-hunter px-2 py-1 rounded-md">
                  {formatDate(item.fecha || undefined)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-8 opacity-40 font-bold text-sm">
            No se encontró información académica.
          </div>
        )}
      </div>
    </div>
  );
};
