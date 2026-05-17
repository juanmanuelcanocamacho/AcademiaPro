"use client";

import { useState } from "react";
import BulkImportForm from "@/components/BulkImportForm";
import BulkImportPDFForm from "@/components/BulkImportPDFForm";
import QuestionForm from "@/components/QuestionForm";
import { FileText, Table, Plus } from "lucide-react";

export default function ImportPage() {
    const [mode, setMode] = useState<"excel" | "pdf" | "manual">("pdf");

    return (
        <div className="p-8 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-sky-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Importar Preguntas</h1>
                    <p className="text-gray-400 text-sm mt-0.5">
                        Elige el formato de origen de tus preguntas para subirlas a la plataforma.
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mx-auto mb-8 bg-gray-100 p-1.5 rounded-2xl">
                <button
                    onClick={() => setMode("pdf")}
                    className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-sm font-bold tracking-tight transition gap-2 ${mode === 'pdf' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:bg-gray-200/50'}`}
                >
                    <FileText className="w-4 h-4" /> Importar PDF (IA)
                </button>
                <button
                    onClick={() => setMode("excel")}
                    className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-sm font-bold tracking-tight transition gap-2 ${mode === 'excel' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:bg-gray-200/50'}`}
                >
                    <Table className="w-4 h-4" /> Importar Excel
                </button>
                <button
                    onClick={() => setMode("manual")}
                    className={`flex-1 flex items-center justify-center py-2.5 rounded-xl text-sm font-bold tracking-tight transition gap-2 ${mode === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:bg-gray-200/50'}`}
                >
                    <Plus className="w-4 h-4" /> Añadir Manual
                </button>
            </div>

            {mode === "excel" && <BulkImportForm />}
            {mode === "pdf" && <BulkImportPDFForm />}
            {mode === "manual" && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 animate-in slide-in-from-bottom-4">
                    <QuestionForm />
                </div>
            )}
        </div>
    );
}
