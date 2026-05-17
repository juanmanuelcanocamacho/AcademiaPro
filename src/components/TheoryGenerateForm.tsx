"use client";

import { useState, useEffect } from "react";
import { getSubjects } from "@/actions/exam";
import { importQuestions } from "@/actions/question";
import {
    Sparkles, Loader2, CheckCircle2, AlertCircle, BookOpen,
    Pencil, Trash2, Save, RotateCcw, ChevronDown, ChevronUp, Wand2
} from "lucide-react";

interface GeneratedQuestion {
    statement: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: number;
}

export default function TheoryGenerateForm() {
    const [subject, setSubject] = useState("");
    const [topic, setTopic] = useState("");
    const [count, setCount] = useState(10);
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);

    // Subject/topic dropdown states
    const [availableSubjects, setAvailableSubjects] = useState<{ subject: string; topics: string[] }[]>([]);
    const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);

    useEffect(() => {
        const loadSubjects = async () => {
            const res = await getSubjects();
            if (res.success && res.subjectsWithTopics) {
                setAvailableSubjects(res.subjectsWithTopics);
                if (res.subjectsWithTopics.length > 0) {
                    const first = res.subjectsWithTopics[0];
                    setSubject(first.subject);
                    if (first.topics.length > 0) {
                        setTopic(first.topics[0]);
                    }
                }
            }
        };
        loadSubjects();
    }, []);

    const currentSubjectObj = availableSubjects.find(s => s.subject === subject);
    const subjectTopics = currentSubjectObj?.topics || [];

    const handleGenerate = async () => {
        if (!subject.trim()) return;

        setGenerating(true);
        setError(null);
        setSuccess(null);
        setQuestions([]);

        try {
            const res = await fetch("/api/theory-generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject: subject.trim(),
                    topic: topic.trim() || undefined,
                    count,
                }),
            });

            const data = await res.json();

            if (!data.success) {
                setError(data.error || "Error desconocido al generar preguntas.");
            } else {
                setQuestions(data.questions);
                setSuccess(`Se han generado ${data.count} preguntas correctamente.`);
            }
        } catch {
            setError("Error de conexión. Inténtalo de nuevo.");
        } finally {
            setGenerating(false);
        }
    };

    const handleSaveAll = async () => {
        if (questions.length === 0) return;

        setSaving(true);
        setError(null);

        try {
            const questionsToSave = questions.map(q => ({
                ...q,
                subject: subject.trim(),
                topic: topic.trim() || null,
                image: null,
            }));

            const res = await importQuestions(questionsToSave);

            if (res.success) {
                setSuccess(`¡${res.count} preguntas guardadas exitosamente en el banco!`);
                setQuestions([]);
            } else {
                setError(res.error || "Error al guardar las preguntas.");
            }
        } catch {
            setError("Error al guardar. Inténtalo de nuevo.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteQuestion = (index: number) => {
        setQuestions(prev => prev.filter((_, i) => i !== index));
        if (editingIndex === index) setEditingIndex(null);
        if (expandedQuestion === index) setExpandedQuestion(null);
    };

    const handleUpdateQuestion = (index: number, field: keyof GeneratedQuestion, value: string | number) => {
        setQuestions(prev => prev.map((q, i) => i === index ? { ...q, [field]: value } : q));
    };

    const correctLabels = ["A", "B", "C", "D"];

    return (
        <div className="space-y-8">
            {/* Generator Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 animate-in slide-in-from-bottom-4">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-violet-500/20">
                        <Wand2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-gray-900">Generar Preguntas con IA</h2>
                        <p className="text-xs text-gray-400">
                            La IA creará preguntas tipo test basándose exclusivamente en la teoría que hayas subido.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Subject */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Asignatura</label>
                        {availableSubjects.length > 0 ? (
                            <select
                                value={subject}
                                onChange={(e) => {
                                    setSubject(e.target.value);
                                    const subObj = availableSubjects.find(s => s.subject === e.target.value);
                                    if (subObj && subObj.topics.length > 0) {
                                        setTopic(subObj.topics[0]);
                                    } else {
                                        setTopic("");
                                    }
                                }}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition"
                            >
                                {availableSubjects.map((s) => (
                                    <option key={s.subject} value={s.subject}>{s.subject}</option>
                                ))}
                            </select>
                        ) : (
                            <p className="text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
                                No hay asignaturas disponibles. Crea preguntas o sube teoría primero.
                            </p>
                        )}
                    </div>

                    {/* Topic */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Unidad / Tema <span className="text-gray-400 font-medium">(opcional)</span></label>
                        {subjectTopics.length > 0 ? (
                            <select
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition"
                            >
                                <option value="">Todas las unidades</option>
                                {subjectTopics.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="Ej: Unidad 1, Tema 2..."
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition"
                            />
                        )}
                    </div>

                    {/* Count */}
                    <div>
                        <label className="block text-xs font-bold text-gray-600 mb-1.5">Número de preguntas</label>
                        <div className="flex gap-2">
                            {[5, 10, 15, 20].map((n) => (
                                <button
                                    key={n}
                                    type="button"
                                    onClick={() => setCount(n)}
                                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition ${
                                        count === n
                                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                                            : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100"
                                    }`}
                                >
                                    {n}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Generate button */}
                    <button
                        onClick={handleGenerate}
                        disabled={generating || !subject.trim()}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm py-3.5 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-violet-600/20"
                    >
                        {generating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generando preguntas...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Generar {count} Preguntas
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Success */}
            {success && questions.length === 0 && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{success}</p>
                </div>
            )}

            {/* Generated Questions Preview */}
            {questions.length > 0 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-gray-900">{questions.length} preguntas generadas</h3>
                                <p className="text-xs text-gray-400">Revisa, edita o elimina antes de guardar.</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Regenerar
                            </button>
                            <button
                                onClick={handleSaveAll}
                                disabled={saving || questions.length === 0}
                                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-emerald-600/20 disabled:opacity-40"
                            >
                                {saving ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Save className="w-3.5 h-3.5" />
                                )}
                                Guardar todas ({questions.length})
                            </button>
                        </div>
                    </div>

                    {/* Question Cards */}
                    <div className="space-y-3">
                        {questions.map((q, i) => {
                            const isExpanded = expandedQuestion === i;
                            const isEditing = editingIndex === i;

                            return (
                                <div
                                    key={i}
                                    className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-sm transition-all"
                                >
                                    {/* Collapsed Header */}
                                    <div
                                        className="flex items-center gap-3 px-5 py-3.5 cursor-pointer select-none"
                                        onClick={() => setExpandedQuestion(isExpanded ? null : i)}
                                    >
                                        <span className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center text-xs font-black text-indigo-700 shrink-0">
                                            {i + 1}
                                        </span>
                                        <p className="flex-1 text-sm font-semibold text-gray-800 line-clamp-1">{q.statement}</p>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                                {correctLabels[q.correctOption]}
                                            </span>
                                            {isExpanded ? (
                                                <ChevronUp className="w-4 h-4 text-gray-400" />
                                            ) : (
                                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="px-5 pb-4 pt-0 border-t border-gray-100">
                                            {isEditing ? (
                                                /* Edit Mode */
                                                <div className="space-y-3 mt-3">
                                                    <div>
                                                        <label className="block text-[10px] font-bold text-gray-500 mb-1">ENUNCIADO</label>
                                                        <textarea
                                                            value={q.statement}
                                                            onChange={(e) => handleUpdateQuestion(i, "statement", e.target.value)}
                                                            rows={2}
                                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition resize-none"
                                                        />
                                                    </div>
                                                    {(["optionA", "optionB", "optionC", "optionD"] as const).map((field, fi) => (
                                                        <div key={field} className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleUpdateQuestion(i, "correctOption", fi)}
                                                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition ${
                                                                    q.correctOption === fi
                                                                        ? "bg-emerald-600 text-white"
                                                                        : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                                                                }`}
                                                            >
                                                                {correctLabels[fi]}
                                                            </button>
                                                            <input
                                                                type="text"
                                                                value={q[field]}
                                                                onChange={(e) => handleUpdateQuestion(i, field, e.target.value)}
                                                                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition"
                                                            />
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => setEditingIndex(null)}
                                                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition"
                                                    >
                                                        Listo
                                                    </button>
                                                </div>
                                            ) : (
                                                /* View Mode */
                                                <div className="space-y-2 mt-3">
                                                    {(["optionA", "optionB", "optionC", "optionD"] as const).map((field, fi) => (
                                                        <div
                                                            key={field}
                                                            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium ${
                                                                q.correctOption === fi
                                                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                                                    : "bg-gray-50 text-gray-600"
                                                            }`}
                                                        >
                                                            <span className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                                                                q.correctOption === fi
                                                                    ? "bg-emerald-600 text-white"
                                                                    : "bg-white border border-gray-200 text-gray-400"
                                                            }`}>
                                                                {correctLabels[fi]}
                                                            </span>
                                                            {q[field]}
                                                            {q.correctOption === fi && (
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-auto shrink-0" />
                                                            )}
                                                        </div>
                                                    ))}
                                                    <div className="flex gap-2 mt-3">
                                                        <button
                                                            onClick={() => setEditingIndex(i)}
                                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition"
                                                        >
                                                            <Pencil className="w-3 h-3" />
                                                            Editar
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteQuestion(i)}
                                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Bottom Save */}
                    <div className="sticky bottom-6 flex justify-center z-20 pointer-events-none">
                        <button
                            onClick={handleSaveAll}
                            disabled={saving || questions.length === 0}
                            className="pointer-events-auto flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-black text-sm shadow-2xl shadow-emerald-600/30 hover:-translate-y-1 transition-all duration-300 disabled:opacity-40 disabled:hover:translate-y-0"
                        >
                            {saving ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            GUARDAR {questions.length} PREGUNTAS EN EL BANCO
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
