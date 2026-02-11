import { MapPin } from 'lucide-react';

export default function Logo() {
    return (
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight transition-all duration-300 hover:scale-105 group cursor-default">
            <div className="bg-hunter p-2 rounded-xl group-hover:bg-hunter/80 transition-colors shadow-sm">
                <MapPin className="text-primary-green w-8 h-8" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col -gap-1 leading-tight">
                <span className="text-primary-green">Monitor elecciones</span>
                <span className="text-primary-green/60 text-sm uppercase tracking-[0.2em]">subnacionales</span>
            </div>
        </div>
    );
}
