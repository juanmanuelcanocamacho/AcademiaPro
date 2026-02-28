"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { importQuestions } from "@/actions/question";
import { UploadCloud, AlertCircle } from "lucide-react";

export default function BulkImportForm() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");
    const [preview, setPreview] = useState<any[]>([]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError("");
        setPreview([]);
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.match(/\.(xlsx|xls)$/)) {
            setError("Por favor, sube un archivo Excel (.xlsx o .xls) válido.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: "array" });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];

                // Convert to array of objects
                const results = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

                // Normalizamos las cabeceras para ser más flexibles (ignora espacios y mayúsculas)
                const normalizedResults = results.map(row => {
                    const normalizedRow: Record<string, any> = {};
                    if (row && typeof row === 'object') {
                        for (const key of Object.keys(row)) {
                            normalizedRow[key.trim().toLowerCase()] = (row as Record<string, any>)[key];
                        }
                    }
                    return normalizedRow;
                });

                // Detectar si el usuario usó índice 0-3 o 1-4
                let isZeroIndexed = false;
                for (const row of normalizedResults) {
                    const val = String(row.correctoption ?? row.orrectoption ?? "").trim();
                    if (val === "0") isZeroIndexed = true;
                }

                const parsedData: any[] = [];
                const errors: string[] = [];

                normalizedResults.forEach((row: any, i: number) => {
                    const rowNum = i + 2; // +1 por base-0, +1 por cabecera
                    let sub = String(row.subject ?? "").trim();
                    let stm = String(row.statement ?? "").trim();
                    let optA = String(row.optiona ?? row.option_a ?? "").trim();
                    let optB = String(row.optionb ?? row.option_b ?? "").trim();
                    let optC = String(row.optionc ?? row.option_c ?? "").trim();
                    let optD = String(row.optiond ?? row.option_d ?? "").trim();

                    let rawCorrect = String(row.correctoption ?? row.orrectoption ?? "").trim().toUpperCase();
                    let correctOpt = -1;

                    if (rawCorrect === "A") correctOpt = 0;
                    else if (rawCorrect === "B") correctOpt = 1;
                    else if (rawCorrect === "C") correctOpt = 2;
                    else if (rawCorrect === "D") correctOpt = 3;
                    else if (isZeroIndexed) {
                        if (rawCorrect === "0") correctOpt = 0;
                        if (rawCorrect === "1") correctOpt = 1;
                        if (rawCorrect === "2") correctOpt = 2;
                        if (rawCorrect === "3") correctOpt = 3;
                    } else {
                        if (rawCorrect === "1") correctOpt = 0;
                        if (rawCorrect === "2") correctOpt = 1;
                        if (rawCorrect === "3") correctOpt = 2;
                        if (rawCorrect === "4") correctOpt = 3;
                    }

                    if (!sub || !stm || !optA || !optB || !optC || !optD) {
                        errors.push(`Fila ${rowNum}: Faltan campos obligatorios. Revisa las columnas.`);
                        return;
                    }
                    if (correctOpt === -1) {
                        errors.push(`Fila ${rowNum}: "correctOption" inválido ("${rawCorrect}"). Usa A,B,C,D o 1,2,3,4.`);
                        return;
                    }

                    parsedData.push({
                        subject: sub,
                        statement: stm,
                        optionA: optA,
                        optionB: optB,
                        optionC: optC,
                        optionD: optD,
                        correctOption: correctOpt
                    });
                });

                if (errors.length > 0) {
                    setError(`Errores detectados en el Excel:\n${errors.slice(0, 3).join("\n")}${errors.length > 3 ? '\n...y más.' : ''}`);
                    return;
                }

                setPreview(parsedData);
            } catch (err) {
                setError("Ocurrió un error al procesar el archivo Excel.");
            }
        };
        reader.onerror = () => {
            setError("No se pudo leer el archivo.");
        };
        reader.readAsArrayBuffer(file);
    };

    const handleImport = () => {
        if (preview.length === 0) return;

        startTransition(async () => {
            const result = await importQuestions(preview);
            if (result.success) {
                alert(`Se importaron ${result.count} preguntas correctamente.`);
                router.push("/admin");
            } else {
                setError(result.error || "Error en la importación masiva.");
            }
        });
    };

    const downloadTemplate = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        const headers = ["subject", "statement", "optionA", "optionB", "optionC", "optionD", "correctOption"];
        const sample = ["Matemáticas", "¿Cuánto es 2+2?", "3", "4", "5", "6", 1];

        const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Plantilla");

        const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([wbout], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "plantilla_preguntas.xlsx");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center bg-slate-50 hover:bg-slate-100 transition relative">
                <input
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <UploadCloud className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-700">
                    Haz clic o arrastra un archivo Excel (.xlsx) aquí
                </h3>
                <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                    El archivo debe contener las cabeceras: <code>subject</code>, <code>statement</code>, <code>optionA</code>, <code>optionB</code>, <code>optionC</code>, <code>optionD</code>, <code>correctOption</code> (0 al 3).
                </p>
                <div className="mt-6">
                    <button
                        type="button"
                        onClick={downloadTemplate}
                        className="relative z-10 text-sm font-medium text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition inline-flex items-center"
                    >
                        Descargar plantilla de ejemplo (.xlsx)
                    </button>
                </div>
            </div>

            {error && (
                <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-xl flex items-start gap-3 border border-red-100">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {preview.length > 0 && !error && (
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-slate-800">
                            Vista previa: {preview.length} preguntas encontradas
                        </h4>
                        <button
                            onClick={handleImport}
                            disabled={isPending}
                            className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition shadow-md shadow-indigo-600/20 disabled:opacity-50"
                        >
                            {isPending ? "Importando..." : "Confirmar Importación"}
                        </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl text-sm">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 sticky top-0">
                                <tr>
                                    <th className="p-3 font-medium text-slate-600 border-b border-slate-200">Asignatura</th>
                                    <th className="p-3 font-medium text-slate-600 border-b border-slate-200">Enunciado</th>
                                    <th className="p-3 font-medium text-slate-600 border-b border-slate-200 text-center">Correcta</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {preview.slice(0, 10).map((q, i) => (
                                    <tr key={i}>
                                        <td className="p-3 text-slate-600 whitespace-nowrap">{q.subject}</td>
                                        <td className="p-3 text-slate-800 line-clamp-1">{q.statement}</td>
                                        <td className="p-3 text-center">
                                            <span className="bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded">
                                                {["A", "B", "C", "D"][q.correctOption]}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {preview.length > 10 && (
                            <p className="p-3 text-center text-slate-500 bg-slate-50">
                                Mostrando 10 de {preview.length} preguntas previsualizadas.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
