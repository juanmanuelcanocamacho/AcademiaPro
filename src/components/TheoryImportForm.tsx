"use client";

import { useState, useEffect } from "react";
import { uploadTheory, getTheoryDocuments, deleteTheoryDocument } from "@/actions/theory";
import { getSubjects } from "@/actions/exam";
import { FileText, Upload, Trash2, Loader2, CheckCircle2, AlertCircle, BookOpen, Layers, X } from "lucide-react";

interface FileConfig {
    file: File;
    subject: string;
    topic: string;
    showNewSubjectInput: boolean;
    customSubject: string;
    showNewTopicInput: boolean;
    customTopic: string;
}

export default function TheoryImportForm() {
    const [fileConfigs, setFileConfigs] = useState<FileConfig[]>([]);
    const [uploading, setUploading] = useState(false);
    const [currentUploadingIndex, setCurrentUploadingIndex] = useState<number>(0);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Subject/topic dropdown states
    const [availableSubjects, setAvailableSubjects] = useState<{ subject: string; topics: string[] }[]>([]);
    const [masterSubject, setMasterSubject] = useState("");
    const [showMasterNewSubject, setShowMasterNewSubject] = useState(false);
    const [masterCustomSubject, setMasterCustomSubject] = useState("");

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
                setMasterSubject(res.subjectsWithTopics[0].subject);
            } else {
                setShowMasterNewSubject(true);
            }
        }
    };

    useEffect(() => {
        fetchDocuments();
        loadSubjects();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFiles = Array.from(e.target.files);
            const defaultSubject = availableSubjects.length > 0 ? availableSubjects[0].subject : "";
            
            const configs: FileConfig[] = selectedFiles.map(file => {
                const defaultTopic = file.name.replace(/\.pdf$/i, "").trim();
                const subObj = availableSubjects.find(s => s.subject === defaultSubject);
                const hasExistingTopics = subObj && subObj.topics.length > 0;
                const defaultTopicSelect = hasExistingTopics ? subObj.topics[0] : "";

                return {
                    file,
                    subject: defaultSubject,
                    topic: defaultTopicSelect,
                    showNewSubjectInput: defaultSubject === "",
                    customSubject: "",
                    showNewTopicInput: !hasExistingTopics,
                    customTopic: defaultTopic,
                };
            });
            setFileConfigs(configs);
            setResult(null);
        }
    };

    // Apply master subject to all files
    const applyMasterSubjectToAll = (subj: string, isCustom = false, customVal = "") => {
        setFileConfigs(prev => prev.map(cfg => {
            const subObj = availableSubjects.find(s => s.subject === subj);
            const hasExistingTopics = !isCustom && subObj && subObj.topics.length > 0;
            const defaultTopicSelect = hasExistingTopics ? subObj.topics[0] : "";

            return {
                ...cfg,
                subject: isCustom ? "" : subj,
                showNewSubjectInput: isCustom,
                customSubject: customVal,
                showNewTopicInput: isCustom || !hasExistingTopics,
                topic: defaultTopicSelect,
            };
        }));
    };

    const removeFile = (idxToRemove: number) => {
        setFileConfigs(prev => prev.filter((_, idx) => idx !== idxToRemove));
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (fileConfigs.length === 0) return;

        setUploading(true);
        setResult(null);

        let successCount = 0;
        let totalChars = 0;
        const results: { fileName: string; success: boolean; error?: string }[] = [];

        for (let i = 0; i < fileConfigs.length; i++) {
            const config = fileConfigs[i];
            setCurrentUploadingIndex(i);

            const formData = new FormData();
            formData.append("files", config.file);
            
            const finalSubject = config.showNewSubjectInput ? config.customSubject.trim() : config.subject.trim();
            const finalTopic = config.showNewTopicInput ? config.customTopic.trim() : config.topic.trim();

            formData.append("subject", finalSubject);
            formData.append("topic", finalTopic);

            try {
                const res = await uploadTheory(formData);
                if (res.success) {
                    successCount++;
                    totalChars += res.chars || 0;
                    results.push({ fileName: config.file.name, success: true });
                } else {
                    results.push({ fileName: config.file.name, success: false, error: res.error });
                }
            } catch (err) {
                results.push({ fileName: config.file.name, success: false, error: "Error de conexión." });
            }
        }

        if (successCount === fileConfigs.length) {
            setResult({
                success: true,
                message: `¡Subida completada con éxito! Se han procesado los ${successCount} archivos correctamente (${totalChars.toLocaleString()} caracteres extraídos).`,
            });
            setFileConfigs([]);
            const input = document.getElementById("theory-file-input") as HTMLInputElement;
            if (input) input.value = "";
        } else if (successCount > 0) {
            setResult({
                success: true,
                message: `Se subieron ${successCount} de ${fileConfigs.length} archivos de teoría correctamente. Por favor revisa los archivos fallidos.`,
            });
            // Keep only failed files in editor list so they can fix and retry
            setFileConfigs(prev => prev.filter((_, idx) => !results[idx].success));
        } else {
            setResult({
                success: false,
                message: `Error al subir la teoría: ${results.map(r => `${r.fileName}: ${r.error}`).join(", ")}`,
            });
        }

        setUploading(false);
        await fetchDocuments();
        await loadSubjects();
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

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 animate-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                    <h2 className="text-lg font-black text-gray-900">Subir Teoría (PDF)</h2>
                    <p className="text-xs text-gray-400">
                        Sube uno o varios archivos PDF y asígnalos a sus respectivas materias y unidades para entrenar la IA.
                    </p>
                </div>
            </div>

            <form onSubmit={handleUpload} className="space-y-6 mb-8">
                {fileConfigs.length === 0 ? (
                    <div>
                        <label className="flex flex-col items-center justify-center min-h-[160px] border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:bg-gray-50 hover:border-indigo-400 transition group focus-within:ring-4 focus-within:ring-indigo-500/10">
                            <input
                                id="theory-file-input"
                                type="file"
                                accept=".pdf"
                                multiple
                                onChange={handleFileChange}
                                className="sr-only"
                                required
                            />
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 text-gray-400 mb-3 group-hover:text-indigo-500 transition" />
                                <p className="mb-2 text-sm text-gray-600 font-medium">
                                    <span className="font-bold text-indigo-600">Haz clic para buscar</span> o arrastra tus PDFs aquí
                                </p>
                                <p className="text-xs text-gray-400">Puedes seleccionar uno o varios archivos PDF (.pdf)</p>
                            </div>
                        </label>
                    </div>
                ) : (
                    <div className="space-y-5 animate-in fade-in duration-300">
                        {/* Master Subject Selection Shortcut */}
                        {fileConfigs.length > 1 && (
                            <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-indigo-600" />
                                    <span className="text-xs font-bold text-indigo-900">Asignar misma materia a todos:</span>
                                </div>
                                {!showMasterNewSubject ? (
                                    <div className="flex gap-2">
                                        <select
                                            value={masterSubject}
                                            onChange={(e) => {
                                                if (e.target.value === "__NEW__") {
                                                    setShowMasterNewSubject(true);
                                                    setMasterSubject("");
                                                    applyMasterSubjectToAll("", true, "");
                                                } else {
                                                    setMasterSubject(e.target.value);
                                                    applyMasterSubjectToAll(e.target.value);
                                                }
                                            }}
                                            className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition"
                                        >
                                            {availableSubjects.map((s) => (
                                                <option key={s.subject} value={s.subject}>
                                                    {s.subject}
                                                </option>
                                            ))}
                                            <option value="__NEW__" className="text-indigo-600 font-extrabold">
                                                + Crear nueva asignatura...
                                            </option>
                                        </select>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={masterCustomSubject}
                                            onChange={(e) => {
                                                setMasterCustomSubject(e.target.value);
                                                applyMasterSubjectToAll("", true, e.target.value);
                                            }}
                                            placeholder="Ej: Programación Móvil"
                                            className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-indigo-500/30 outline-none transition"
                                        />
                                        {availableSubjects.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowMasterNewSubject(false);
                                                    setMasterSubject(availableSubjects[0].subject);
                                                    setMasterCustomSubject("");
                                                    applyMasterSubjectToAll(availableSubjects[0].subject);
                                                }}
                                                className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition"
                                            >
                                                Cancelar
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Asignación de unidades por archivo</span>
                            <button
                                type="button"
                                onClick={() => {
                                    setFileConfigs([]);
                                    const input = document.getElementById("theory-file-input") as HTMLInputElement;
                                    if (input) input.value = "";
                                }}
                                className="text-xs font-bold text-red-600 hover:underline flex items-center gap-1"
                            >
                                <X className="w-3.5 h-3.5" /> Limpiar todo
                            </button>
                        </div>

                        {/* List of File Configuration Cards */}
                        <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1 scrollbar-thin">
                            {fileConfigs.map((cfg, idx) => {
                                const currentSubjectObj = availableSubjects.find(s => s.subject === cfg.subject);
                                const subjectTopics = currentSubjectObj?.topics || [];
                                
                                return (
                                    <div key={idx} className="border border-gray-200 hover:border-indigo-200 rounded-2xl p-5 bg-gray-50/50 space-y-4 relative transition-all shadow-sm">
                                        <button
                                            type="button"
                                            onClick={() => removeFile(idx)}
                                            className="absolute top-4 right-4 p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition"
                                            title="Quitar archivo"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>

                                        {/* File Info */}
                                        <div className="flex items-center gap-2.5 max-w-[85%]">
                                            <FileText className="w-4 h-4 text-violet-500 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-gray-800 truncate" title={cfg.file.name}>{cfg.file.name}</p>
                                                <p className="text-[10px] text-gray-400">{(cfg.file.size / 1024 / 1024).toFixed(2)} MB</p>
                                            </div>
                                        </div>

                                        {/* Inputs Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                            {/* Subject Select */}
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-bold text-gray-500 block">Asignatura:</label>
                                                {!cfg.showNewSubjectInput ? (
                                                    <select
                                                        value={cfg.subject}
                                                        onChange={(e) => {
                                                            if (e.target.value === "__NEW__") {
                                                                const newConfigs = [...fileConfigs];
                                                                newConfigs[idx].showNewSubjectInput = true;
                                                                newConfigs[idx].subject = "";
                                                                newConfigs[idx].showNewTopicInput = true;
                                                                newConfigs[idx].topic = "";
                                                                setFileConfigs(newConfigs);
                                                            } else {
                                                                const newConfigs = [...fileConfigs];
                                                                newConfigs[idx].subject = e.target.value;
                                                                const subObj = availableSubjects.find(s => s.subject === e.target.value);
                                                                const hasExisting = subObj && subObj.topics.length > 0;
                                                                newConfigs[idx].showNewTopicInput = !hasExisting;
                                                                newConfigs[idx].topic = hasExisting ? subObj.topics[0] : "";
                                                                setFileConfigs(newConfigs);
                                                            }
                                                        }}
                                                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition"
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
                                                    <div className="flex gap-1.5">
                                                        <input
                                                            type="text"
                                                            value={cfg.customSubject}
                                                            onChange={(e) => {
                                                                const newConfigs = [...fileConfigs];
                                                                newConfigs[idx].customSubject = e.target.value;
                                                                setFileConfigs(newConfigs);
                                                            }}
                                                            placeholder="Ej: Servidores web"
                                                            className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500/30 outline-none transition"
                                                            required
                                                        />
                                                        {availableSubjects.length > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newConfigs = [...fileConfigs];
                                                                    newConfigs[idx].showNewSubjectInput = false;
                                                                    newConfigs[idx].subject = availableSubjects[0].subject;
                                                                    newConfigs[idx].customSubject = "";
                                                                    const subObj = availableSubjects.find(s => s.subject === availableSubjects[0].subject);
                                                                    const hasExisting = subObj && subObj.topics.length > 0;
                                                                    newConfigs[idx].showNewTopicInput = !hasExisting;
                                                                    newConfigs[idx].topic = hasExisting ? subObj.topics[0] : "";
                                                                    setFileConfigs(newConfigs);
                                                                }}
                                                                className="px-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-[10px] font-bold transition"
                                                            >
                                                                X
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Topic Selector / Input */}
                                            <div className="space-y-1">
                                                <label className="text-[11px] font-bold text-gray-500 block">Unidad / Tema:</label>
                                                {!cfg.showNewTopicInput && subjectTopics.length > 0 ? (
                                                    <select
                                                        value={cfg.topic}
                                                        onChange={(e) => {
                                                            if (e.target.value === "__NEW__") {
                                                                const newConfigs = [...fileConfigs];
                                                                newConfigs[idx].showNewTopicInput = true;
                                                                newConfigs[idx].topic = "";
                                                                setFileConfigs(newConfigs);
                                                            } else {
                                                                const newConfigs = [...fileConfigs];
                                                                newConfigs[idx].topic = e.target.value;
                                                                setFileConfigs(newConfigs);
                                                            }
                                                        }}
                                                        className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition"
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
                                                    <div className="flex gap-1.5">
                                                        <input
                                                            type="text"
                                                            value={cfg.customTopic}
                                                            onChange={(e) => {
                                                                const newConfigs = [...fileConfigs];
                                                                newConfigs[idx].customTopic = e.target.value;
                                                                setFileConfigs(newConfigs);
                                                            }}
                                                            placeholder="Ej: Unidad 1, Configuración..."
                                                            className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300 outline-none transition"
                                                            required
                                                        />
                                                        {subjectTopics.length > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newConfigs = [...fileConfigs];
                                                                    newConfigs[idx].showNewTopicInput = false;
                                                                    newConfigs[idx].topic = subjectTopics[0];
                                                                    setFileConfigs(newConfigs);
                                                                }}
                                                                className="px-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-[10px] font-bold transition shrink-0"
                                                                title="Volver al desplegable"
                                                            >
                                                                Cancelar
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Submit Actions */}
                        <div className="space-y-3 pt-2">
                            {uploading && (
                                <div className="space-y-2 bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/50">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            Subiendo "{fileConfigs[currentUploadingIndex]?.file.name}"...
                                        </span>
                                        <span className="text-xs font-bold text-indigo-700">{currentUploadingIndex + 1} de {fileConfigs.length}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                                            style={{ width: `${((currentUploadingIndex) / fileConfigs.length) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={uploading || fileConfigs.length === 0}
                                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-3 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Subiendo Teoría...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-4 h-4" />
                                        Subir y Procesar {fileConfigs.length} Archivos de Teoría
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
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
                                                                <span className="text-[9px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded shrink-0" title={doc.topic}>
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
