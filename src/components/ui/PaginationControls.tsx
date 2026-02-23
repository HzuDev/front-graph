import React from "react";

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
    currentPage,
    totalPages,
    onPageChange,
}) => {
    return (
        <div className="mt-20 flex flex-col md:flex-row justify-between items-center gap-8 py-10 border-t border-primary-green/5">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">
                Página {currentPage} de {totalPages}
            </p>
            <div className="flex gap-3">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-8 py-4 bg-white border border-primary-green/10 text-primary-green rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary-green/5"
                >
                    Anterior
                </button>
                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-8 py-4 bg-primary-green text-hunter rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                    Siguiente Página
                </button>
            </div>
        </div>
    );
};
