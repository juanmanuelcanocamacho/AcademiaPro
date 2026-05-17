"use client";

import { useState, useEffect } from "react";
import { uploadTheory, getTheoryDocuments, deleteTheoryDocument } from "@/actions/theory";
import { getSubjects } from "@/actions/exam";
import { FileText, Upload, Trash2, Loader2, CheckCircle2, AlertCircle, BookOpen } from "lucide-react";

export default function TheoryImportForm() {
    const [subject, setSubject] = useState("");
    const [topic, setTopic] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Subject/topic dropdown states
    const [availableSubjects, setAvailableSubjects] = useState<{ subject: string; topics: string[] }[]>([]);
    const [showNewSubjectInput, setShowNewSubjectInput] = useState(false);
    const [showNewTopicInput, setShowNewTopicInput] = useState(false);
    const [customSubject, setCustomSubject] = useState("");
    const [customTopic, setCustomTopic] = useState("");

    const fetchDocuments = async () => {
        setLoadingDocs(true);
        const res = await getTheoryDocuments();
        if (res.success && res.documents) {
            setDocuments(res.documents);
        }
        setLoadingDocs(false);
    };

    const loadSubjects = async () => {
        const res = await getSubjects();
        if (res.success && res.subjectsWithTopics) {
            setAvailableSubjects(res.subjectsWithTopics);
            if (res.subjectsWithTopics.length > 0) {
                const initialSub = res.subjectsWithTopics[0];
                setSubject(initialSub.subject);
                if (initialSub.topics.length > 0) {
                    setTopic(initialSub.topics[0]);
                } else {
                    setTopic("");
                    setShowNewTopicInput(true);
                }
            } else {
                setShowNewSubjectInput(true);
                setShowNewTopicInput(true);
            }
        }
    };

    useEffect(() => {
        fetchDocuments();
        loadSubjects();
    }, []);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !subject.trim()) return;

        setUploading(true);
        setResult(null);

        const formData = new FormData();
        formData.append("file", file);
        formData.append("subject", subject.trim());
        formData.append("topic", topic.trim());

        const res = await uploadTheory(formData);

        if (res.success) {
            setResult({
                success: true,
                message: `Teoría subida correctamente. Se extrajeron ${res.chars?.toLocaleString()} caracteres.`,
            });
            setFile(null);
            setCustomTopic("");
            // Reset file input
            const input = document.getElementById("theory-file-input") as HTMLInputElement;
            if (input) input.value = "";
            await fetchDocuments();
            await loadSubjects();
        } else {
            setResult({ success: false, message: res.error || "Error desconocido" });
        }

        setUploading(false);
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        const res = await deleteTheoryDocument(id);
        if (res.success) {
            await fetchDocuments();
            await loadSubjects();
        }
        setDeletingId(null);
    };

    // Group documents by subject
    const groupedDocs = documents.reduce((acc: Record<string, any[]>, doc) => {
        if (!acc[doc.subject]) acc[doc.subject] = [];
        acc[doc.subject].push(doc);
        return acc;
    }, {});

    const currentSubjectObj = availableSubjects.find(s => s.subject === subject);
    const subjectTopics = currentSubjectObj?.topics || [];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 animate-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                    <h2 className="text-lg font-black text-gray-900">Subir Teoría (PDF)</h2>
                    <p className="text-xs text-gray-400">
                        Sube documentos de teoría para que la IA pueda responder preguntas basándose en ellos.
                    </p>
                </div>
            </div>

            <form onSubmit={handleUpload} className="space-y-4 mb-8">
                {/* Asignatura Selector */}
                <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Asignatura</label>
                    {!showNewSubjectInput ? (
                        <select
                            value={subject}
                            onChange={(e) => {
                                if (e.target.value === "__NEW__") {
                                    setShowNewSubjectInput(true);
                                    setSubject("");
                                    setShowNewTopicInput(true);
                                    setTopic("");
                                } else {
                                    setSubject(e.target.value);
                                    setShowNewTopicInput(false);
                                    const subObj = availableSubjects.find(s => s.subject === e.target.value);
                                    if (subObj && subObj.topics.length > 0) {
                                        setTopic(subObj.topics[0]);
                                    } else {
                                        setTopic("");
                                        setShowNewTopicInput(true);
                                    }
                                }
                            }}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition"
                        >
                            {availableSubjects.map((s) => (
                                <option key={s.subject} value={s.subject}>
                                    {s.subject}
                                </option>
                            ))}
                            <option value="__NEW__" className="text-indigo-600 font-bold">
                                + Crear nueva asignatura...
                            </option>
                        </select>
                    ) : (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={customSubject}
                                onChange={(e) => {
                                    setCustomSubject(e.target.value);
                                    setSubject(e.target.value);
                                }}
                                placeholder="Ej: Lenguaje de Marcas"
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition"
                                required
                            />
                            {availableSubjects.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowNewSubjectInput(false);
                                        setSubject(availableSubjects[0].subject);
                                        setCustomSubject("");
                                        setShowNewTopicInput(false);
                                        const subObj = availableSubjects[0];
                                        if (subObj.topics.length > 0) {
                                            setTopic(subObj.topics[0]);
                                        } else {
                                            setTopic("");
                                            setShowNewTopicInput(true);
                                        }
                                    }}
                                    className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition"
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Unidad Selector */}
                <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Unidad / Tema</label>
                    {!showNewTopicInput && subjectTopics.length > 0 ? (
                        <select
                            value={topic}
                            onChange={(e) => {
                                if (e.target.value === "__NEW__") {
                                    setShowNewTopicInput(true);
                                    setTopic("");
                                } else {
                                    setTopic(e.target.value);
                                }
                            }}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition"
                        >
                            {subjectTopics.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                            <option value="__NEW__" className="text-indigo-600 font-bold">
                                + Crear nueva unidad...
                            </option>
                        </select>
                    ) : (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={customTopic}
                                onChange={(e) => {
                                    setCustomTopic(e.target.value);
                                    setTopic(e.target.value);
                                }}
                                placeholder="Ej: Unidad 1, Tema 2, Flexbox..."
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition"
                                required
                            />
                            {subjectTopics.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowNewTopicInput(false);
                                        setTopic(subjectTopics[0]);
                                        setCustomTopic("");
                                    }}
                                    className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition"
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Archivo PDF</label>
                    <div className="relative">
                        <input
                            id="theory-file-input"
                            type="file"
                            accept=".pdf"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 file:cursor-pointer focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={uploading || !file || !subject.trim()}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-3 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20"
                >
                    {uploading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Procesando PDF...
                        </>
                    ) : (
                        <>
                            <Upload className="w-4 h-4" />
                            Subir Teoría
                        </>
                    )}
                </button>
            </form>

            {/* Result */}
            {result && (
                <div
                    className={`flex items-start gap-3 p-4 rounded-xl mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                        result.success
                            ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                            : "bg-red-50 border border-red-200 text-red-800"
                    }`}
                >
                    {result.success ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    )}
                    <p className="text-sm font-medium">{result.message}</p>
                </div>
            )}

            {/* Existing documents */}
            <div>
                <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    Documentos subidos
                </h3>

                {loadingDocs ? (
                    <div className="flex items-center justify-center py-8 text-gray-400 text-sm gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Cargando...
                    </div>
                ) : Object.keys(groupedDocs).length === 0 ? (
                    <div className="bg-gray-50 rounded-xl p-6 text-center">
                        <p className="text-sm text-gray-400">No hay documentos de teoría subidos todavía.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(groupedDocs)
                            .sort(([a], [b]) => a.localeCompare(b, "es", { numeric: true }))
                            .map(([subjectName, docs]) => (
                                <div key={subjectName} className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs font-bold text-indigo-700 bg-indigo-50 inline-block px-2.5 py-1 rounded-lg mb-3">
                                        {subjectName}
                                    </p>
                                    <div className="space-y-2">
                                        {(docs as any[]).map((doc) => (
                                            <div
                                                key={doc.id}
                                                className="flex items-center justify-between bg-white rounded-lg px-3 py-2.5 border border-gray-100"
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <FileText className="w-4 h-4 text-violet-500 shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-gray-700 truncate">{doc.fileName}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            {doc.topic && (
                                                                <span className="text-[9px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded shrink-0">
                                                                    {doc.topic}
                                                                </span>
                                                            )}
                                                            <p className="text-[10px] text-gray-400">
                                                                {new Date(doc.createdAt).toLocaleDateString("es-ES")}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleDelete(doc.id)}
                                                    disabled={deletingId === doc.id}
                                                    className="p-1.5 hover:bg-red-50 rounded-lg transition text-gray-400 hover:text-red-600 shrink-0 disabled:opacity-40"
                                                >
                                                    {deletingId === doc.id ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    )}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
}
