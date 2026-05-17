import TheoryGenerateForm from "@/components/TheoryGenerateForm";
import { Wand2 } from "lucide-react";

export const metadata = {
    title: "Generar Preguntas con IA",
};

export default function GeneratePage() {
    return (
        <div className="p-8 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shrink-0 shadow-md shadow-violet-500/20">
                    <Wand2 className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Generar con IA</h1>
                    <p className="text-gray-400 text-sm mt-0.5">
                        Crea preguntas tipo test automáticamente a partir de tus PDFs de teoría.
                    </p>
                </div>
            </div>

            <TheoryGenerateForm />
        </div>
    );
}
