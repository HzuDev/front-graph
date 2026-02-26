import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { Search, ChevronRight, ArrowUpRight, UserCheck } from 'lucide-react';

interface Candidate {
  nombre: string;
  partido: string;
  link: string;
}

interface CandidateListProps {
  candidatos: Candidate[];
  titulo: string;
}

export function CandidateList({ candidatos, titulo }: CandidateListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const filteredCandidates = useMemo(() => {
    if (!searchTerm) return candidatos;
    const lower = searchTerm.toLowerCase();
    return candidatos.filter((c) => c.nombre.toLowerCase().includes(lower));
  }, [candidatos, searchTerm]);

  const visibleCandidates = useMemo(() => {
    return filteredCandidates.slice(0, page * ITEMS_PER_PAGE);
  }, [filteredCandidates, page]);

  const hasMore = visibleCandidates.length < filteredCandidates.length;

  const observerTarget = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(() => {
    if (hasMore) {
      setPage((p) => p + 1);
    }
  }, [hasMore]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: '100px' }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    const currentTarget = observerTarget.current;
    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loadMore]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-primary-green/5 pb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary-green text-hunter rounded-xl shrink-0">
            <UserCheck size={20} />
          </div>
          <h3
            className="text-3xl font-black tracking-tight"
            style={{ textWrap: 'balance' }}
          >
            Postulantes registrados
          </h3>
        </div>
        <div className="relative group w-full sm:w-auto">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 opacity-20 group-focus-within:opacity-100 transition-opacity"
            size={14}
          />
          <input
            type="text"
            placeholder="Buscar candidato..."
            value={searchTerm}
            onChange={handleSearch}
            className="bg-primary-green/5 border-none rounded-xl py-2.5 pl-9 pr-4 text-xs font-bold focus:ring-2 focus:ring-primary-green transition-all w-full sm:w-48 outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {visibleCandidates.length > 0 ? (
          visibleCandidates.map((c) => (
            <a
              key={c.link || `${c.nombre}-${c.partido}`}
              href={c.link}
              className="group bg-white border border-primary-green/5 p-6 rounded-[3rem] hover:border-primary-green hover:shadow-2xl hover:shadow-primary-green/5 transition-all relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                <ArrowUpRight size={20} className="text-primary-green" />
              </div>

              <div className="pt-2">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-30 mb-4">
                  {titulo}
                </p>

                <h4
                  className="text-xl font-black leading-none mb-6 group-hover:text-primary-green pr-8"
                  style={{ textWrap: 'balance' }}
                >
                  {c.nombre}
                </h4>
              </div>

              <div className="flex justify-between items-center pt-5 border-t border-primary-green/5 mt-auto">
                <span className="text-[9px] font-black bg-hunter text-primary-green px-3 py-1 rounded-lg uppercase tracking-wider">
                  Ver Perfil Completo
                </span>
                <ChevronRight
                  size={14}
                  className="opacity-20 group-hover:translate-x-1 transition-transform"
                />
              </div>
            </a>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-primary-green/40 font-medium">
            No se encontraron postulantes que coincidan con su búsqueda.
          </div>
        )}
      </div>

      {hasMore && (
        <div
          ref={observerTarget}
          className="py-8 flex flex-col items-center justify-center gap-3"
        >
          <div className="flex gap-1">
            <div
              className="w-2 h-2 rounded-full bg-primary-green animate-bounce"
              style={{ animationDelay: '0ms' }}
            ></div>
            <div
              className="w-2 h-2 rounded-full bg-primary-green animate-bounce"
              style={{ animationDelay: '150ms' }}
            ></div>
            <div
              className="w-2 h-2 rounded-full bg-primary-green animate-bounce"
              style={{ animationDelay: '300ms' }}
            ></div>
          </div>
          <span className="text-[10px] uppercase font-black tracking-widest text-primary-green/40">
            Cargando resultados...
          </span>
        </div>
      )}
    </div>
  );
}
