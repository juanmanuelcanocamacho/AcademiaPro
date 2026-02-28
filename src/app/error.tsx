"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Here you would log the error to an error reporting service like Sentry or LogRocket
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white border border-red-100 rounded-3xl p-10 max-w-md w-full text-center shadow-sm">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">¡Ups! Algo salió mal</h2>
                <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                    Hemos encontrado un error inesperado al cargar esta página. El equipo técnico ha sido notificado.
                </p>

                {error.message && (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-8 text-left overflow-hidden">
                        <p className="text-xs font-mono text-slate-600 line-clamp-2">{error.message}</p>
                    </div>
                )}

                <button
                    onClick={() => reset()}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl transition shadow-lg shadow-gray-900/10"
                >
                    <RotateCcw className="w-4 h-4" />
                    Intentar nuevamente
                </button>
            </div>
        </div>
    );
}
