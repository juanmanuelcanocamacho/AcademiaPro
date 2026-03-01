"use client";

import { useState, useEffect } from "react";
import { Upload, CheckCircle2, AlertCircle, FileText, ChevronRight, Sparkles } from "lucide-react";
import { parseMoodlePDF } from "@/actions/pdf";
import { importQuestions, getSubjectStats } from "@/actions/question";
import { Question } from "@/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function BulkImportPDFForm() {
    const router = useRouter();
    const [files, setFiles] = useState<File[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [previewQuestions, setPreviewQuestions] = useState<Partial<Question>[] | null>(null);
    const [subject, setSubject] = useState("");
    const [topic, setTopic] = useState("");
    const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);

    useEffect(() => {
        getSubjectStats().then(res => {
            if (res.success && res.stats) {
                setAvailableSubjects(res.stats.map((s: any) => s.subject));
            }
        });
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFiles(Array.from(e.target.files));
            setPreviewQuestions(null);
        }
    };

    const handleParse = async () => {
        if (files.length === 0) return;
        setIsParsing(true);
        try {
            const formData = new FormData();
            files.forEach(file => formData.append("file", file));

            const res = await parseMoodlePDF(formData);
            if (res.success && res.questions) {
                setPreviewQuestions(res.questions);
                toast.success(`Se han extraído ${res.questions.length} preguntas correctamente.`);
            } else {
                toast.error(res.error || "No se pudo extraer las preguntas del PDF.");
            }
        } catch (error) {
            toast.error("Hubo un error al procesar el servidor.");
        } finally {
            setIsParsing(false);
        }
    };

    const handleImport = async () => {
        if (!previewQuestions || !subject) {
            toast.error("Por favor, asigna una materia antes de importar.");
            return;
        }

        setIsImporting(true);
        try {
            // Add the written subject and topic
            const questionsToImport = previewQuestions.map(q => ({
                ...q,
                subject,
                topic: topic.trim() || null
            })) as Omit<Question, "id">[];

            const res = await importQuestions(questionsToImport);
            if (res?.success) {
                toast.success(`¡Se importaron ${res.count} preguntas correctamente!`);
                router.push("/admin");
            } else {
                toast.error("Error al importar a la base de datos.");
            }
        } catch (e) {
            toast.error("Error de conexión.");
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4 text-red-600 ring-8 ring-red-50/50">
                    <FileText className="w-8 h-8" />
                </div>
                <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold mb-3 border border-indigo-100/50 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                    Inteligencia Artificial (Opción Recomendada)
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Importar PDF (Moodle)</h2>
                <p className="text-sm text-gray-500 max-w-sm">
                    Utiliza la potencia de la IA para extraer y dar formato a tus preguntas automáticamente. Es la manera más rápida y precisa de subir tus simulacros a la plataforma.
                </p>
            </div>

            <div className="p-6 space-y-6">
                {!previewQuestions ? (
                    <div className="space-y-4">
                        <label className="flex flex-col items-center justify-center min-h-[160px] border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:bg-gray-50 hover:border-indigo-400 transition group focus-within:ring-4 focus-within:ring-indigo-500/10">
                            <input
                                type="file"
                                accept="application/pdf"
                                className="sr-only"
                                multiple
                                onChange={handleFileChange}
                            />
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 text-gray-400 mb-3 group-hover:text-indigo-500 transition" />
                                <p className="mb-2 text-sm text-gray-600 font-medium">
                                    <span className="font-bold text-indigo-600">Haz clic para buscar</span> o arrastra tus PDFs aquí
                                </p>
                                <p className="text-xs text-gray-400">PDF (.pdf)</p>
                            </div>
                        </label>

                        {files.length > 0 && (
                            <div className="bg-indigo-50 text-indigo-700 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between border border-indigo-100 gap-4">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-5 h-5 flex-shrink-0" />
                                    <p className="text-sm font-semibold">
                                        {files.length === 1 ? files[0].name : `${files.length} archivos seleccionados`}
                                    </p>
                                </div>
                                <button
                                    onClick={handleParse}
                                    disabled={isParsing}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 whitespace-nowrap"
                                >
                                    {isParsing ? "Procesando con IA..." : "Extraer con IA"} <Sparkles className="w-4 h-4 ml-1" />
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100">
                            <CheckCircle2 className="w-5 h-5" />
                            <p className="font-semibold text-sm">¡Éxito! Se han extraído {previewQuestions.length} preguntas del PDF.</p>
                            <button onClick={() => setPreviewQuestions(null)} className="ml-auto text-sm font-bold underline hover:text-emerald-900">Subir otro</button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Materia / Asignatura:</label>
                                <input
                                    type="text"
                                    list="subject-suggestions"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Ej: Seguridad Informática..."
                                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm font-medium transition"
                                />
                                <datalist id="subject-suggestions">
                                    {availableSubjects.map((sub, idx) => (
                                        <option key={idx} value={sub} />
                                    ))}
                                </datalist>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Tema / Etiqueta <span className="text-gray-400 font-normal">(Opcional)</span>:</label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="Ej: Tema 1, AWS..."
                                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm font-medium transition"
                                />
                            </div>
                        </div>

                        <div className="bg-gray-50 border border-gray-200 rounded-xl max-h-64 overflow-y-auto p-4 space-y-4">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest sticky top-0 bg-gray-50 pb-2">Vista Previa de Extracción</p>
                            {previewQuestions.map((q, i) => (
                                <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-2">
                                    <p className="text-sm font-bold text-gray-800"><span className="text-indigo-500 mr-2">{i + 1}.</span>{q.statement}</p>
                                    <ul className="text-sm text-gray-500 space-y-1">
                                        <li className={q.correctOption === 0 ? "font-bold text-emerald-600" : ""}>A. {q.optionA}</li>
                                        <li className={q.correctOption === 1 ? "font-bold text-emerald-600" : ""}>B. {q.optionB}</li>
                                        <li className={q.correctOption === 2 ? "font-bold text-emerald-600" : ""}>C. {q.optionC}</li>
                                        <li className={q.correctOption === 3 ? "font-bold text-emerald-600" : ""}>D. {q.optionD}</li>
                                    </ul>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleImport}
                            disabled={isImporting || !subject.trim()}
                            className="w-full py-3.5 bg-gray-900 text-white hover:bg-indigo-600 transition tracking-wide font-black rounded-xl disabled:opacity-50"
                        >
                            {isImporting ? 'Guardando en Base de Datos...' : `Almacenar estas ${previewQuestions.length} preguntas`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
