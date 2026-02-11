import React from 'react';

export const Legend: React.FC = () => {
    const items = [
        { label: 'País', color: '#ec4899', type: 'fill' },
        { label: 'Departamento', color: '#a855f7', type: 'fill' },
        { label: 'Provincia', color: '#3b82f6', type: 'fill' },
        { label: 'Municipio', color: '#10b981', type: 'fill' },
        { label: 'Zona seleccionada', color: '#f97316', type: 'border' },
    ];

    return (
        <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-gray-200 z-10 pointer-events-none">
            <h4 className="text-sm font-bold mb-3 text-gray-800 tracking-tight">Mapa Electoral</h4>
            <div className="space-y-2">
                {items.map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                        <div
                            className="w-4 h-4 rounded-sm"
                            style={{
                                backgroundColor: item.type === 'fill' ? item.color : 'transparent',
                                borderWidth: item.type === 'border' ? '2px' : '1px',
                                borderColor: item.type === 'border' ? item.color : item.color,
                                opacity: item.type === 'fill' ? 0.6 : 1
                            }}
                        />
                        <span className="text-xs text-gray-700 font-medium">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
