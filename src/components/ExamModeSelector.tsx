"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    GraduationCap,
    BookOpen,
    ChevronRight,
    ChevronDown,
    LayoutGrid,
} from "lucide-react";

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

export default function ExamModeSelector({ subjectsWithTopics }: { subjectsWithTopics: { subject: string, topics: string[] }[] }) {
    const [mode, setMode] = useState<Mode>("repaso");
    const [randomQ, setRandomQ] = useState(true);
    const [randomA, setRandomA] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

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

                {/* Mode description */}
                <div className="ml-auto hidden md:block text-right">
                    <p className="text-xs font-bold text-gray-500">
                        {mode === "repaso"
                            ? "Responde pregunta a pregunta. Corrección inmediata."
                            : "Responde todas. Se corrigen al terminar."}
                    </p>
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
                                            <div className={`relative z-10 border-l-4 pl-4 ${accentClassDark.split(' ')[0]}`}>
                                                <h3 className="text-xl font-bold text-white leading-snug line-clamp-3 group-hover:text-gray-200 transition-colors">
                                                    {subject}
                                                </h3>
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
                                            <div className={`relative z-10 border-l-4 pl-4 ${accentClassDark.split(' ')[0]}`}>
                                                <h3 className="text-xl font-bold text-white leading-snug line-clamp-3 group-hover:text-gray-200 transition-colors">
                                                    {subject}
                                                </h3>
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
                                        {topics.map(topic => (
                                            <Link key={topic} href={`${baseHref}&topic=${encodeURIComponent(topic)}`} className="flex items-center justify-between w-full p-3 rounded-xl bg-white border border-transparent text-sm font-medium text-slate-700 hover:border-indigo-200 hover:text-indigo-700 transition shadow-sm group">
                                                <span>{topic}</span>
                                                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-indigo-400" />
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
