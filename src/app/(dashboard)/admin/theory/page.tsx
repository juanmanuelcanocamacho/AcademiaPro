import TheoryImportForm from "@/components/TheoryImportForm";
import { BookOpen } from "lucide-react";

export const metadata = {
    title: "Teoría — Documentos PDF",
};

export default function TheoryPage() {
    return (
        <div className="p-8 max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Mis Documentos de Teoría</h1>
                    <p className="text-gray-400 text-sm mt-0.5">
                        Sube PDFs de teoría para que la IA pueda responder preguntas y generar tests.
                    </p>
                </div>
            </div>

            <TheoryImportForm />
        </div>
    );
}
