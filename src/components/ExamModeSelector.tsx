"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    GraduationCap,
    BookOpen,
    ChevronRight,
    ChevronDown,
    LayoutGrid,
    RotateCcw,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    Circle,
    Trash2,
} from "lucide-react";
import { getProgressBySubject, resetSubjectProgress, resetAllProgress, type SubjectProgress } from "@/actions/progress";

type Mode = "repaso" | "examen";

// Sleek, dark tech accents
function getSubjectAccentDark(index: number) {
    const accents = [
        "border-indigo-500 text-indigo-400",
        "border-emerald-500 text-emerald-400",
        "border-rose-500 text-rose-400",
        "border-amber-500 text-amber-400",
        "border-cyan-500 text-cyan-400",
        "border-purple-500 text-purple-400",
    ];
    return accents[index % accents.length];
}

function TopicBadge({ status, bestScore }: { status: string; bestScore: number }) {
    if (status === "passed") {
        return (
            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg shrink-0">
                <CheckCircle2 className="w-3 h-3" />
                {Math.round(bestScore)}%
            </span>
        );
    }
    if (status === "failed") {
        return (
            <span className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg shrink-0">
                <AlertTriangle className="w-3 h-3" />
                {Math.round(bestScore)}%
            </span>
        );
    }
    return (
        <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-lg shrink-0">
            <Circle className="w-3 h-3" />
            Pendiente
        </span>
    );
}

export default function ExamModeSelector({ subjectsWithTopics }: { subjectsWithTopics: { subject: string, topics: string[] }[] }) {
    const [mode, setMode] = useState<Mode>("repaso");
    const [randomQ, setRandomQ] = useState(true);
    const [randomA, setRandomA] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

    // Progress state
    const [progressMap, setProgressMap] = useState<Record<string, SubjectProgress>>({});
    const [loadingProgress, setLoadingProgress] = useState(true);

    // Reset confirmation modals
    const [confirmResetSubject, setConfirmResetSubject] = useState<string | null>(null);
    const [confirmResetAll, setConfirmResetAll] = useState(false);
    const [resetting, setResetting] = useState(false);

    useEffect(() => {
        const savedMode = localStorage.getItem("examPref_mode") as Mode;
        const savedRandomQ = localStorage.getItem("examPref_randomQ");
        const savedRandomA = localStorage.getItem("examPref_randomA");

        if (savedMode) setMode(savedMode);
        if (savedRandomQ !== null) setRandomQ(savedRandomQ === "true");
        if (savedRandomA !== null) setRandomA(savedRandomA === "true");
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted) return;
        localStorage.setItem("examPref_mode", mode);
        localStorage.setItem("examPref_randomQ", randomQ.toString());
        localStorage.setItem("examPref_randomA", randomA.toString());
    }, [mode, randomQ, randomA, mounted]);

    // Fetch progress
    useEffect(() => {
        const fetchProgress = async () => {
            setLoadingProgress(true);
            const res = await getProgressBySubject();
            if (res.success && res.progress) {
                const map: Record<string, SubjectProgress> = {};
                res.progress.forEach((p) => {
                    map[p.subject] = p;
                });
                setProgressMap(map);
            }
            setLoadingProgress(false);
        };
        fetchProgress();
    }, []);

    const handleResetSubject = async (subject: string) => {
        setResetting(true);
        await resetSubjectProgress(subject);
        // Refresh progress
        const res = await getProgressBySubject();
        if (res.success && res.progress) {
            const map: Record<string, SubjectProgress> = {};
            res.progress.forEach((p) => {
                map[p.subject] = p;
            });
            setProgressMap(map);
        }
        setResetting(false);
        setConfirmResetSubject(null);
    };

    const handleResetAll = async () => {
        setResetting(true);
        await resetAllProgress();
        setProgressMap({});
        setResetting(false);
        setConfirmResetAll(false);
    };

    return (
        <div className="space-y-6">
            {/* Config bar */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-wrap gap-6 items-center">
                {/* Mode toggle */}
                <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Modo</span>
                    <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
                        <button
                            onClick={() => setMode("repaso")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === "repaso"
                                ? "bg-white text-indigo-700 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            <BookOpen className="w-3.5 h-3.5" />
                            REPASO
                        </button>
                        <button
                            onClick={() => setMode("examen")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${mode === "examen"
                                ? "bg-white text-indigo-700 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            <GraduationCap className="w-3.5 h-3.5" />
                            EXAMEN
                        </button>
                    </div>
                </div>

                {/* Divider */}
                <div className="w-px h-10 bg-gray-200 hidden sm:block" />

                {/* Toggles */}
                <div className="flex items-center gap-5">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Preguntas</span>
                            <span className="text-xs font-semibold text-gray-700">Orden aleatorio</span>
                        </div>
                        <div className="relative">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={randomQ}
                                onChange={(e) => setRandomQ(e.target.checked)}
                            />
                            <div className="w-10 h-5 bg-gray-300 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                        </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Opciones</span>
                            <span className="text-xs font-semibold text-gray-700">Barajar A,B,C,D</span>
                        </div>
                        <div className="relative">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={randomA}
                                onChange={(e) => setRandomA(e.target.checked)}
                            />
                            <div className="w-10 h-5 bg-gray-300 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                        </div>
                    </label>
                </div>

                {/* Mode description + Reset All */}
                <div className="ml-auto hidden md:flex items-center gap-4">
                    <p className="text-xs font-bold text-gray-500 text-right">
                        {mode === "repaso"
                            ? "Responde pregunta a pregunta. Corrección inmediata."
                            : "Responde todas. Se corrigen al terminar."}
                    </p>
                    <button
                        onClick={() => setConfirmResetAll(true)}
                        className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition-all"
                        title="Reiniciar toda la trayectoria"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Reiniciar todo
                    </button>
                </div>
            </div>

            {/* Subject grid */}
            {subjectsWithTopics.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LayoutGrid className="w-7 h-7 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-700 mb-1">Sin asignaturas</h3>
                    <p className="text-sm text-gray-400">Añade preguntas desde el panel de administración.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
                    {subjectsWithTopics.map(({ subject, topics }, i) => {
                        const hasTopics = topics.length > 0;
                        const isExpanded = expandedSubject === subject;
                        const baseHref = `/exam/${encodeURIComponent(subject)}?mode=${mode}&randomQ=${randomQ}&randomA=${randomA}`;
                        const accentClassDark = getSubjectAccentDark(i);

                        // Progress data for this subject
                        const sp = progressMap[subject];
                        const passedCount = sp?.passedTopics || 0;
                        const totalTopicCount = sp?.totalTopics || topics.length;
                        const progressPct = totalTopicCount > 0 ? Math.round((passedCount / totalTopicCount) * 100) : 0;
                        const hasAnyAttempts = sp?.totalAttempts > 0;

                        return (
                            <div key={subject} className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                {hasTopics ? (
                                    <button
                                        onClick={() => setExpandedSubject(isExpanded ? null : subject)}
                                        className="group flex flex-col w-full text-left"
                                    >
                                        {/* Dark Tech Cover */}
                                        <div className="relative h-44 flex flex-col justify-end p-6 bg-slate-900 overflow-hidden w-full">
                                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
                                            <GraduationCap className={`absolute -right-6 -top-4 w-32 h-32 opacity-10 transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-12 ${accentClassDark.split(' ')[1]}`} />
                                            
                                            {/* Stack title and progress info vertically to prevent overlap */}
                                            <div className="relative z-10 flex flex-col gap-3 w-full">
                                                <div className={`border-l-4 pl-4 ${accentClassDark.split(' ')[0]}`}>
                                                    <h3 className="text-lg font-black text-white leading-snug line-clamp-2 group-hover:text-gray-200 transition-colors">
                                                        {subject}
                                                    </h3>
                                                </div>

                                                {/* Progress bar info */}
                                                {hasAnyAttempts && (
                                                    <div className="w-full pl-4">
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <span className="text-[10px] font-bold text-gray-400">{passedCount} de {totalTopicCount} temas</span>
                                                            <span className="text-[10px] font-extrabold text-emerald-400">{progressPct}%</span>
                                                        </div>
                                                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                                                                style={{ width: `${progressPct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Card body */}
                                        <div className="p-4 flex-1 flex w-full items-center justify-between bg-white border-t border-gray-100">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <BookOpen className="w-3.5 h-3.5" />
                                                Módulo de Examen
                                            </span>
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center">
                                                {isExpanded ? (
                                                    <ChevronDown className="w-5 h-5 text-indigo-500" />
                                                ) : (
                                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ) : (
                                    <Link href={baseHref} className="group flex flex-col w-full text-left">
                                        <div className="relative h-44 flex flex-col justify-end p-6 bg-slate-900 overflow-hidden w-full">
                                            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
                                            <GraduationCap className={`absolute -right-6 -top-4 w-32 h-32 opacity-10 transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-12 ${accentClassDark.split(' ')[1]}`} />
                                            
                                            {/* Stack title and progress info vertically to prevent overlap */}
                                            <div className="relative z-10 flex flex-col gap-3 w-full">
                                                <div className={`border-l-4 pl-4 ${accentClassDark.split(' ')[0]}`}>
                                                    <h3 className="text-lg font-black text-white leading-snug line-clamp-2 group-hover:text-gray-200 transition-colors">
                                                        {subject}
                                                    </h3>
                                                </div>

                                                {/* Progress bar info */}
                                                {hasAnyAttempts && (
                                                    <div className="w-full pl-4">
                                                        <div className="flex items-center justify-between mb-1.5">
                                                            <span className="text-[10px] font-bold text-gray-400">{passedCount} de {totalTopicCount} temas</span>
                                                            <span className="text-[10px] font-extrabold text-emerald-400">{progressPct}%</span>
                                                        </div>
                                                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                                                                style={{ width: `${progressPct}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-4 flex-1 flex w-full items-center justify-between bg-white border-t border-gray-100">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <BookOpen className="w-3.5 h-3.5" />
                                                Módulo de Examen
                                            </span>
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center">
                                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </div>
                                    </Link>
                                )}

                                {/* Collapsible Topics Menu */}
                                {hasTopics && isExpanded && (
                                    <div className="border-t border-indigo-50 bg-indigo-50/30 p-4 space-y-2 animate-in slide-in-from-top-2 duration-300">
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 px-1">Elige temática</p>
                                        <Link href={baseHref} className="flex items-center justify-between w-full p-3 rounded-xl bg-white border border-indigo-100 text-sm font-bold text-indigo-900 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition shadow-sm group">
                                            <span>Todo el temario</span>
                                            <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100" />
                                        </Link>
                                        {topics.map(topic => {
                                            // Find topic progress
                                            const tp = sp?.topics.find(t => t.topic === topic);
                                            const status = tp?.status || "not_started";
                                            const bestScore = tp?.bestScore || 0;

                                            return (
                                                <Link key={topic} href={`${baseHref}&topic=${encodeURIComponent(topic)}`} className="flex items-center justify-between w-full p-3 rounded-xl bg-white border border-transparent text-sm font-medium text-slate-700 hover:border-indigo-200 hover:text-indigo-700 transition shadow-sm group">
                                                    <span>{topic}</span>
                                                    <div className="flex items-center gap-2">
                                                        <TopicBadge status={status} bestScore={bestScore} />
                                                        <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-indigo-400" />
                                                    </div>
                                                </Link>
                                            );
                                        })}

                                        {/* Reset subject progress button */}
                                        {hasAnyAttempts && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setConfirmResetSubject(subject);
                                                }}
                                                className="flex items-center gap-1.5 w-full justify-center mt-3 py-2.5 text-[10px] font-bold text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-dashed border-gray-200 hover:border-red-200 transition-all"
                                            >
                                                <RotateCcw className="w-3 h-3" />
                                                Reiniciar progreso de esta asignatura
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal: Confirm Reset Subject */}
            {confirmResetSubject && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => !resetting && setConfirmResetSubject(null)}>
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                            <RotateCcw className="w-7 h-7 text-red-600" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 text-center mb-2">¿Reiniciar progreso?</h3>
                        <p className="text-sm text-gray-500 text-center mb-6">
                            Se borrarán todos los resultados de tests de <span className="font-bold text-gray-700">{confirmResetSubject}</span>.
                            Esta acción no se puede deshacer.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmResetSubject(null)}
                                disabled={resetting}
                                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition disabled:opacity-40"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleResetSubject(confirmResetSubject)}
                                disabled={resetting}
                                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition shadow-md shadow-red-600/20 disabled:opacity-40 flex items-center justify-center gap-2"
                            >
                                {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                                {resetting ? "Reiniciando..." : "Reiniciar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Confirm Reset All */}
            {confirmResetAll && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => !resetting && setConfirmResetAll(false)}>
                    <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
                            <Trash2 className="w-7 h-7 text-red-600" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 text-center mb-2">¿Reiniciar toda la trayectoria?</h3>
                        <p className="text-sm text-gray-500 text-center mb-6">
                            Se borrarán <span className="font-bold text-red-600">TODOS</span> los resultados de tests de <span className="font-bold text-gray-700">todas las asignaturas</span>.
                            Esta acción no se puede deshacer.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmResetAll(false)}
                                disabled={resetting}
                                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition disabled:opacity-40"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleResetAll}
                                disabled={resetting}
                                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-sm transition shadow-md shadow-red-600/20 disabled:opacity-40 flex items-center justify-center gap-2"
                            >
                                {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                {resetting ? "Reiniciando..." : "Reiniciar todo"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
