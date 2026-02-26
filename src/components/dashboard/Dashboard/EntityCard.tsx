import React from 'react';
import { ArrowUpRight, MapPin, ShieldCheck } from 'lucide-react';
import type { Entity, Authority } from '../../../lib/queries';
import { buildPath } from '../../../lib/utils/paths';

interface EntityCardProps {
  entity: Entity | Authority;
  municipalityName?: string;
}

export const EntityCard: React.FC<EntityCardProps> = ({
  entity,
  municipalityName,
}) => {
  const authority = entity as Authority;
  const hasRole = !!authority.role;
  const hasParty = !!authority.party;

  return (
    <a
      href={buildPath(`/entity?id=${entity.$id}`)}
      className="group bg-white border border-primary-green/5 p-6 rounded-[2.5rem] hover:border-primary-green hover:shadow-2xl hover:shadow-primary-green/5 transition-all cursor-pointer relative flex flex-col justify-between min-h-[240px]"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-1.5">
          {hasRole && (
            <span className="bg-hunter text-primary-green px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter w-fit border border-primary-green/10 shadow-sm">
              {authority.role}
            </span>
          )}
          <div className="flex items-center gap-1.5 text-primary-green/40">
            <MapPin size={12} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {municipalityName || 'Bolivia'}
            </span>
          </div>
        </div>
        <div className="bg-emerald-500/10 text-emerald-600 p-2 rounded-full border border-emerald-500/20 shadow-sm">
          <ShieldCheck size={16} strokeWidth={3} />
        </div>
      </div>

      <div>
        <h4 className="text-3xl font-black leading-[0.85] tracking-tighter text-primary-green mb-4 group-hover:translate-x-1 transition-transform">
          {entity.label || 'Sin nombre'}
        </h4>
        {hasParty && (
          <div className="flex items-center gap-3 py-2.5 px-4 bg-primary-green/5 rounded-2xl border border-primary-green/5 w-fit group-hover:bg-primary-green group-hover:text-hunter transition-colors">
            <div className="w-6 h-6 bg-primary-green rounded-lg flex items-center justify-center text-[9px] text-hunter font-black border border-white/20">
              {authority.party?.label?.substring(0, 3).toUpperCase() || 'POL'}
            </div>
            <span className="text-[11px] font-bold leading-none opacity-70">
              {authority.party?.label || 'Partido Desconocido'}
            </span>
          </div>
        )}
      </div>

      <div className="mt-8 pt-5 border-t border-primary-green/5 flex justify-between items-center">
        <div className="flex gap-6">
          <div>
            <p className="text-[9px] uppercase font-black opacity-30 tracking-widest mb-1">
              Preferencia
            </p>
            <p className="text-sm font-black text-primary-green">--%</p>
          </div>
          <div>
            <p className="text-[9px] uppercase font-black opacity-30 tracking-widest mb-1">
              Propuestas
            </p>
            <p className="text-sm font-black text-primary-green">--</p>
          </div>
        </div>
        <div className="w-10 h-10 bg-primary-green text-hunter rounded-full flex items-center justify-center translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all shadow-xl">
          <ArrowUpRight size={20} />
        </div>
      </div>
    </a>
  );
};
