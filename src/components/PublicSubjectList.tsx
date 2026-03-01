"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DownloadCloud, CheckSquare, Loader2, Square, BookOpen } from "lucide-react";
import { cloneSubjectsToUser } from "@/actions/public-bank";

type SubjectStat = {
    subject: string;
    _count: { id: number };
};

export default function PublicSubjectList({ subjects }: { subjects: SubjectStat[] }) {
    const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSelect = (subject: string) => {
        const next = new Set(selectedSubjects);
        if (next.has(subject)) next.delete(subject);
        else next.add(subject);
        setSelectedSubjects(next);
    };

    const handleSelectAll = () => {
        if (selectedSubjects.size === subjects.length) {
            setSelectedSubjects(new Set());
        } else {
            setSelectedSubjects(new Set(subjects.map(s => s.subject)));
        }
    };

    const handleCloneSelected = () => {
        if (selectedSubjects.size === 0) return;
        if (!confirm(`¿Estás seguro de que quieres importar las ${selectedSubjects.size} asignaturas seleccionadas a tu perfil personal?`)) return;

        startTransition(async () => {
            const res = await cloneSubjectsToUser(Array.from(selectedSubjects));
            if (res.success) {
                alert(`¡Éxito! Se han importado ${res.count} preguntas en total. Ya puedes ir a "Asignaturas" para crear tus exámenes.`);
                setSelectedSubjects(new Set());
                router.refresh();
            } else {
                alert(res.error || "Error al clonar las asignaturas.");
            }
        });
    };

    if (subjects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 border-dashed rounded-xl text-center px-4">
                <div className="w-16 h-16 bg-gray-50 flex items-center justify-center rounded-2xl mb-4">
                    <DownloadCloud className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-gray-900 font-bold mb-1">Cargando la base de datos...</h3>
                <p className="text-gray-500 text-sm max-w-sm">No pudimos encontrar asignaturas públicas de los administradores todavía.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Clone Selected Bar */}
            {selectedSubjects.size > 0 && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-4 z-10 shadow-sm animate-in fade-in slide-in-from-top-4">
                    <span className="text-indigo-800 font-medium text-sm">
                        <span className="font-bold">{selectedSubjects.size}</span> asignaturas seleccionadas
                    </span>
                    <button
                        onClick={handleCloneSelected}
                        disabled={isPending}
                        className="w-full md:w-auto px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-lg text-sm transition flex items-center justify-center gap-2 shadow-sm"
                    >
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
                        Importar a Mi Perfil
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Select All Toggle as a Card */}
                <div
                    onClick={handleSelectAll}
                    className="group bg-gray-50 border border-gray-200 border-dashed rounded-xl p-5 hover:bg-gray-100 transition-all duration-300 cursor-pointer flex items-center gap-4"
                >
                    <div className="flex-shrink-0 text-gray-400 group-hover:text-indigo-600 transition">
                        {selectedSubjects.size === subjects.length ? (
                            <CheckSquare className="w-6 h-6 text-indigo-600" />
                        ) : (
                            <Square className="w-6 h-6" />
                        )}
                    </div>
                    <div>
                        <span className="text-sm font-bold text-gray-700 uppercase tracking-wider block">
                            Seleccionar Todo
                        </span>
                        <span className="text-xs text-gray-500">
                            {subjects.length} asignaturas totales
                        </span>
                    </div>
                </div>

                {subjects.map((s) => (
                    <div
                        key={s.subject}
                        onClick={() => handleSelect(s.subject)}
                        className={`group bg-white border rounded-xl p-5 hover:shadow-md transition-all duration-300 relative cursor-pointer flex items-start gap-4 ${selectedSubjects.has(s.subject) ? 'border-indigo-400 ring-4 ring-indigo-50' : 'border-gray-200 hover:border-indigo-200'
                            }`}
                    >
                        <div className="flex-shrink-0 mt-0.5 text-gray-300 group-hover:text-indigo-500 transition-colors">
                            {selectedSubjects.has(s.subject) ? (
                                <CheckSquare className="w-6 h-6 text-indigo-600" />
                            ) : (
                                <Square className="w-6 h-6 group-hover:text-indigo-300" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-3">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <h3 className="text-gray-900 font-bold text-lg mb-1 leading-snug truncate">
                                {s.subject}
                            </h3>
                            <p className="text-sm font-medium text-gray-500">
                                {s._count.id} preguntas
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
