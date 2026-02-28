import QuestionForm from "@/components/QuestionForm";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

export default async function EditQuestionPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const isNew = id === "new";

    let question = null;
    if (!isNew) {
        question = await prisma.question.findUnique({ where: { id } });
        if (!question) return notFound();
    }

    return (
        <div className="p-8 max-w-3xl mx-auto">
            <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-indigo-600 border border-gray-200 bg-white px-4 py-2 rounded-xl mb-8 transition"
            >
                <ArrowLeft className="w-4 h-4" /> Volver al Panel
            </Link>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-1">
                {isNew ? "Nueva Pregunta" : "Editar Pregunta"}
            </h1>
            <p className="text-gray-400 text-sm mb-8">
                Completa los datos y señala cuál es la opción correcta.
            </p>
            <QuestionForm initialData={question || undefined} />
        </div>
    );
}
