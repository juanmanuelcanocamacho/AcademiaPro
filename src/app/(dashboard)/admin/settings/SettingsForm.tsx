"use client";

import { useState, useTransition } from "react";
import { updateSystemSettings } from "@/actions/settings";
import { toast } from "sonner";
import { Shield, BookOpen, DownloadCloud, FileUp } from "lucide-react";

export default function SettingsForm({ initialSettings }: { initialSettings: any }) {
    const [isPending, startTransition] = useTransition();
    const [allowPublicBank, setAllowPublicBank] = useState(initialSettings.allowPublicBank);
    const [allowStudentImport, setAllowStudentImport] = useState(initialSettings.allowStudentImport);
    const [allowStudentTheory, setAllowStudentTheory] = useState(initialSettings.allowStudentTheory ?? false);

    const handleToggle = (field: "publicBank" | "studentImport" | "studentTheory") => {
        startTransition(async () => {
            let newData = {};
            if (field === "publicBank") {
                const newValue = !allowPublicBank;
                setAllowPublicBank(newValue);
                newData = { allowPublicBank: newValue };
            } else if (field === "studentImport") {
                const newValue = !allowStudentImport;
                setAllowStudentImport(newValue);
                newData = { allowStudentImport: newValue };
            } else {
                const newValue = !allowStudentTheory;
                setAllowStudentTheory(newValue);
                newData = { allowStudentTheory: newValue };
            }

            const result = await updateSystemSettings(newData);
            if (result.success) {
                toast.success("Ajustes actualizados correctamente");
            } else {
                toast.error(result.error);
                // Revert UI on error
                if (field === "publicBank") setAllowPublicBank(!allowPublicBank);
                else if (field === "studentImport") setAllowStudentImport(!allowStudentImport);
                else setAllowStudentTheory(!allowStudentTheory);
            }
        });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Banco Oficial Toggle */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 flex items-start gap-5 shadow-sm">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
                    <DownloadCloud className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-black text-gray-900 mb-1">Banco Oficial</h3>
                    <p className="text-sm font-medium text-gray-500 leading-relaxed mb-4">
                        Habilita la sección "Banco Oficial" para que los estudiantes puedan ver y clonar las asignaturas que los administradores hayan marcado como públicas.
                    </p>
                    <button
                        onClick={() => handleToggle("publicBank")}
                        disabled={isPending}
                        className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center justify-start rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 disabled:opacity-50 ${allowPublicBank ? 'bg-indigo-500' : 'bg-gray-200'
                            }`}
                    >
                        <span className="sr-only">Toggle Banco Oficial</span>
                        <span
                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${allowPublicBank ? 'translate-x-7' : 'translate-x-0'
                                }`}
                        />
                    </button>
                    <span className="ml-3 text-sm font-bold text-gray-600 align-super">
                        {allowPublicBank ? "Habilitado" : "Deshabilitado"}
                    </span>
                </div>
            </div>

            {/* Importación Estudiantes Toggle */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 flex items-start gap-5 shadow-sm">
                <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center shrink-0">
                    <FileUp className="w-6 h-6 text-sky-600" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-black text-gray-900 mb-1">Importación de Estudiantes</h3>
                    <p className="text-sm font-medium text-gray-500 leading-relaxed mb-4">
                        Permite a los estudiantes usar la herramienta de Inteligencia Artificial para subir sus propios PDFs e importar preguntas a su banca personal.
                    </p>
                    <button
                        onClick={() => handleToggle("studentImport")}
                        disabled={isPending}
                        className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center justify-start rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 disabled:opacity-50 ${allowStudentImport ? 'bg-sky-500' : 'bg-gray-200'
                            }`}
                    >
                        <span className="sr-only">Toggle Importación</span>
                        <span
                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${allowStudentImport ? 'translate-x-7' : 'translate-x-0'
                                }`}
                        />
                    </button>
                    <span className="ml-3 text-sm font-bold text-gray-600 align-super">
                        {allowStudentImport ? "Habilitado" : "Deshabilitado"}
                    </span>
                </div>
            </div>

            {/* Teoría Estudiantes Toggle */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 flex items-start gap-5 shadow-sm">
                <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center shrink-0">
                    <BookOpen className="w-6 h-6 text-violet-600" />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-black text-gray-900 mb-1">Teoría de Estudiantes</h3>
                    <p className="text-sm font-medium text-gray-500 leading-relaxed mb-4">
                        Permite a los estudiantes subir sus propios PDFs de teoría para consultar con el asistente de IA durante los exámenes y repasos.
                    </p>
                    <button
                        onClick={() => handleToggle("studentTheory")}
                        disabled={isPending}
                        className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center justify-start rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2 disabled:opacity-50 ${allowStudentTheory ? 'bg-violet-500' : 'bg-gray-200'
                            }`}
                    >
                        <span className="sr-only">Toggle Teoría Estudiantes</span>
                        <span
                            className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${allowStudentTheory ? 'translate-x-7' : 'translate-x-0'
                                }`}
                        />
                    </button>
                    <span className="ml-3 text-sm font-bold text-gray-600 align-super">
                        {allowStudentTheory ? "Habilitado" : "Deshabilitado"}
                    </span>
                </div>
            </div>
        </div>
    );
}
