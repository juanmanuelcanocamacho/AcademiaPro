"use client";

import { useTransition, useState, useOptimistic } from "react";
import Link from "next/link";
import { deleteQuestion, deleteQuestions, updateQuestion } from "@/actions/question";
import {
    Pencil, Trash2, Database, Upload, Plus, ChevronDown, ChevronRight, Hash,
    CheckSquare, Square, X, Save
} from "lucide-react";
import { toast } from "sonner";
import { Question } from "@/types";

export default function QuestionList({ questions }: { questions: Question[] }) {
    const [isPending, startTransition] = useTransition();
    const [expandedSubjects, setExpandedSubjects] = useState<Record<string, boolean>>({});
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Question>>({});

    const [optimisticQuestions, addOptimisticAction] = useOptimistic(
        questions,
        (state, action: { type: 'delete', id?: string, ids?: string[] } | { type: 'update', question: Question }) => {
            if (action.type === 'delete') {
                if (action.id) return state.filter(q => q.id !== action.id);
                if (action.ids) return state.filter(q => !action.ids!.includes(q.id));
            }
            if (action.type === 'update') {
                return state.map(q => q.id === action.question.id ? action.question : q);
            }
            return state;
        }
    );

    const toggleSubject = (subject: string) => {
        setExpandedSubjects(prev => ({ ...prev, [subject]: !prev[subject] }));
    };

    const handleDelete = (id: string) => {
        toast("¿Eliminar pregunta?", {
            description: "Esta acción no se puede deshacer.",
            action: {
                label: "Confirmar",
                onClick: () => {
                    startTransition(async () => {
                        addOptimisticAction({ type: 'delete', id });
                        const res = await deleteQuestion(id);
                        if (res?.success) {
                            toast.success("Pregunta eliminada");
                            setSelectedIds(prev => {
                                const newSet = new Set(prev);
                                newSet.delete(id);
                                return newSet;
                            });
                        }
                        else toast.error("Error al eliminar");
                    });
                }
            },
            cancel: { label: "Cancelar", onClick: () => { } }
        });
    };

    const handleBulkDelete = () => {
        const ids = Array.from(selectedIds);
        if (ids.length === 0) return;
        toast(`¿Eliminar ${ids.length} preguntas?`, {
            description: "Esta acción no se puede deshacer.",
            action: {
                label: "Confirmar",
                onClick: () => {
                    startTransition(async () => {
                        addOptimisticAction({ type: 'delete', ids });
                        setSelectedIds(new Set());
                        const res = await deleteQuestions(ids);
                        if (res?.success) toast.success(`${ids.length} preguntas eliminadas`);
                        else toast.error("Error al eliminar masivamente");
                    });
                }
            },
            cancel: { label: "Cancelar", onClick: () => { } }
        });
    };

    const handleSaveInline = async (q: Question) => {
        try {
            const updated: Question = { ...q, ...editForm } as Question;
            startTransition(async () => {
                addOptimisticAction({ type: 'update', question: updated });
                setEditingId(null);
                setEditForm({});
                const res = await updateQuestion(q.id, editForm);
                if (res?.success) toast.success("Guardado correctamente");
                else toast.error("Error al guardar");
            });
        } catch (e) {
            toast.error("Error inesperado");
        }
    };

    if (optimisticQuestions.length === 0) {
        return (
            <div className="text-center p-16 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center transition hover:shadow-md">
                <div className="bg-indigo-50 p-6 rounded-full mb-5 ring-8 ring-indigo-50/50">
                    <Database className="w-10 h-10 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">No tienes preguntas</h3>
                <p className="text-slate-500 mb-8 max-w-sm">Empieza creando preguntas manualmente o importa un archivo Excel para llenar tu base de datos rápidamente.</p>
                <div className="flex flex-wrap justify-center gap-3">
                    <Link href="/admin/import" className="inline-flex items-center text-slate-600 bg-white border border-slate-200 px-6 py-2.5 rounded-xl font-medium hover:bg-slate-50 hover:text-indigo-600 transition shadow-sm">
                        <Upload className="w-4 h-4 mr-2" /> Importar Excel
                    </Link>
                    <Link href="/admin/new" className="inline-flex items-center bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition shadow-md shadow-indigo-600/20">
                        <Plus className="w-4 h-4 mr-2" /> Crear Manual
                    </Link>
                </div>
            </div>
        );
    }

    const groupedQuestions = optimisticQuestions.reduce((acc, q) => {
        if (!acc[q.subject]) acc[q.subject] = [];
        acc[q.subject].push(q);
        return acc;
    }, {} as Record<string, Question[]>);

    return (
        <div className="relative pb-24 space-y-4">
            {Object.entries(groupedQuestions).map(([subject, subjectQuestions]) => {
                const isExpanded = expandedSubjects[subject] !== false; // defaulted to expanded usually, but logic inverted for UX initially ok
                // Let's actually keep the default behavior where it's closed unless explicitly opened if too many. I will default to expanded if fewer subjects.
                const opened = expandedSubjects[subject] || (Object.keys(groupedQuestions).length <= 3 && expandedSubjects[subject] === undefined);

                return (
                    <div key={subject} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-200">
                        {/* Summary / Header */}
                        <div
                            onClick={() => toggleSubject(subject)}
                            className="flex items-center justify-between p-4 bg-slate-50 cursor-pointer hover:bg-slate-100 transition border-b border-transparent data-[state=open]:border-slate-200"
                            data-state={opened ? "open" : "closed"}
                        >
                            <div className="flex items-center gap-3">
                                <div className="text-slate-400">
                                    {opened ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                                </div>
                                <h3 className="font-semibold text-slate-800 text-lg md:text-xl">{subject}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center text-xs font-medium bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">
                                    <Hash className="w-3 h-3 mr-1" />
                                    {subjectQuestions.length} {subjectQuestions.length === 1 ? 'pregunta' : 'preguntas'}
                                </span>
                            </div>
                        </div>

                        {/* Collapsible Content */}
                        {opened && (
                            <div className="overflow-x-auto animate-in fade-in slide-in-from-top-2 duration-200">
                                <table className="w-full text-left border-collapse min-w-full">
                                    <thead>
                                        <tr className="border-b border-slate-200 text-slate-500 text-sm bg-white">
                                            <th className="p-4 font-medium w-10 text-center">
                                                <button onClick={(e) => {
                                                    e.stopPropagation();
                                                    const newSet = new Set(selectedIds);
                                                    const allSelectedInGroup = subjectQuestions.every(q => selectedIds.has(q.id));
                                                    if (allSelectedInGroup) {
                                                        subjectQuestions.forEach(q => newSet.delete(q.id));
                                                    } else {
                                                        subjectQuestions.forEach(q => newSet.add(q.id));
                                                    }
                                                    setSelectedIds(newSet);
                                                }} className="text-slate-400 hover:text-indigo-600 outline-none block w-full">
                                                    {subjectQuestions.every(q => selectedIds.has(q.id)) ? <CheckSquare className="w-5 h-5 text-indigo-600 mx-auto" /> : <Square className="w-5 h-5 mx-auto" />}
                                                </button>
                                            </th>
                                            <th className="p-4 font-medium w-full">Enunciado</th>
                                            <th className="p-4 font-medium text-right min-w-[120px]">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                        {subjectQuestions.map((q) => {
                                            const isSelected = selectedIds.has(q.id);
                                            const isEditing = editingId === q.id;

                                            return (
                                                <tr key={q.id} className={`transition group ${isSelected ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}>
                                                    <td className="p-4 align-top w-10">
                                                        <button onClick={() => {
                                                            const newSet = new Set(selectedIds);
                                                            if (isSelected) newSet.delete(q.id);
                                                            else newSet.add(q.id);
                                                            setSelectedIds(newSet);
                                                        }} className="text-slate-400 hover:text-indigo-600 transition outline-none block w-full">
                                                            {isSelected ? <CheckSquare className="w-5 h-5 text-indigo-600 mx-auto" /> : <Square className="w-5 h-5 mx-auto opacity-0 group-hover:opacity-100 transition-opacity" />}
                                                        </button>
                                                    </td>
                                                    <td className="p-4 align-top text-slate-700">
                                                        {isEditing ? (
                                                            <div className="space-y-3 p-1">
                                                                <textarea
                                                                    defaultValue={q.statement}
                                                                    onChange={(e) => setEditForm(prev => ({ ...prev, statement: e.target.value }))}
                                                                    className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none bg-white shadow-sm"
                                                                    rows={3}
                                                                />
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                                                    {['A', 'B', 'C', 'D'].map((letter, idx) => (
                                                                        <div key={idx} className="flex flex-col gap-1.5 p-2 bg-slate-50 border border-slate-100 rounded-lg ring-1 ring-white">
                                                                            <label className="flex items-center gap-2 cursor-pointer w-max">
                                                                                <input
                                                                                    type="radio"
                                                                                    name={`correct-${q.id}`}
                                                                                    defaultChecked={q.correctOption === idx}
                                                                                    onChange={() => setEditForm(prev => ({ ...prev, correctOption: idx }))}
                                                                                    className="text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                                                                                />
                                                                                <span className="font-bold text-slate-500">Opción {letter} (Correcta)</span>
                                                                            </label>
                                                                            <input
                                                                                defaultValue={idx === 0 ? q.optionA : idx === 1 ? q.optionB : idx === 2 ? q.optionC : q.optionD}
                                                                                onChange={(e) => {
                                                                                    const field = `option${letter}` as keyof Question;
                                                                                    setEditForm(prev => ({ ...prev, [field]: e.target.value }));
                                                                                }}
                                                                                className="w-full border border-slate-200 rounded-md p-2 focus:border-indigo-500 outline-none font-medium text-slate-800"
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="pt-0.5">
                                                                <p className="font-medium line-clamp-3 group-hover:text-slate-900 transition-colors leading-relaxed">{q.statement}</p>
                                                                {/* Options Preview */}
                                                                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm text-slate-500">
                                                                    <div className={`p-2.5 rounded-xl border ${q.correctOption === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium tracking-tight shadow-sm' : 'bg-white border-slate-100 shadow-sm'}`}><span className="font-bold mr-1 opacity-50">A.</span> {q.optionA}</div>
                                                                    <div className={`p-2.5 rounded-xl border ${q.correctOption === 1 ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium tracking-tight shadow-sm' : 'bg-white border-slate-100 shadow-sm'}`}><span className="font-bold mr-1 opacity-50">B.</span> {q.optionB}</div>
                                                                    <div className={`p-2.5 rounded-xl border ${q.correctOption === 2 ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium tracking-tight shadow-sm' : 'bg-white border-slate-100 shadow-sm'}`}><span className="font-bold mr-1 opacity-50">C.</span> {q.optionC}</div>
                                                                    <div className={`p-2.5 rounded-xl border ${q.correctOption === 3 ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-medium tracking-tight shadow-sm' : 'bg-white border-slate-100 shadow-sm'}`}><span className="font-bold mr-1 opacity-50">D.</span> {q.optionD}</div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-4 align-top text-right">
                                                        <div className="flex items-center justify-end gap-1 relative z-10">
                                                            {isEditing ? (
                                                                <>
                                                                    <button
                                                                        onClick={() => { setEditingId(null); setEditForm({}); }}
                                                                        className="p-2.5 text-slate-400 hover:text-slate-600 transition rounded-lg hover:bg-slate-100"
                                                                        title="Cancelar"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleSaveInline(q)}
                                                                        disabled={isPending}
                                                                        className="p-2.5 text-white bg-indigo-600 hover:bg-indigo-700 transition rounded-lg disabled:opacity-50 shadow-md shadow-indigo-600/20"
                                                                        title="Guardar"
                                                                    >
                                                                        <Save className="w-4 h-4" />
                                                                    </button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingId(q.id);
                                                                            setEditForm({}); // Reset form
                                                                        }}
                                                                        className="p-2.5 text-slate-400 hover:text-indigo-600 transition rounded-lg hover:bg-indigo-50"
                                                                        title="Editar Rápido"
                                                                    >
                                                                        <Pencil className="w-4 h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDelete(q.id)}
                                                                        disabled={isPending}
                                                                        className="p-2.5 text-slate-400 hover:text-red-600 transition rounded-lg hover:bg-red-50 disabled:opacity-50"
                                                                        title="Eliminar"
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Floating Bulk Actions Bar */}
            {selectedIds.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white rounded-full px-6 py-4 shadow-2xl flex items-center justify-between gap-8 z-50 animate-in slide-in-from-bottom-5 duration-300">
                    <span className="font-medium text-sm">
                        {selectedIds.size} {selectedIds.size === 1 ? 'pregunta seleccionada' : 'preguntas seleccionadas'}
                    </span>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="text-gray-400 hover:text-white px-3 py-1.5 text-sm font-medium transition"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleBulkDelete}
                            disabled={isPending}
                            className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 transition disabled:opacity-50"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Borrar todas
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
