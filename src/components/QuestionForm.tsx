"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createQuestion, updateQuestion } from "@/actions/question";
import { toast } from "sonner";
import { Question } from "@/types";

export default function QuestionForm({
    initialData,
}: {
    initialData?: Partial<Question>;
}) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const isEditing = !!initialData?.id;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = {
            subject: formData.get("subject") as string,
            statement: formData.get("statement") as string,
            optionA: formData.get("optionA") as string,
            optionB: formData.get("optionB") as string,
            optionC: formData.get("optionC") as string,
            optionD: formData.get("optionD") as string,
            correctOption: parseInt(formData.get("correctOption") as string, 10),
        };

        startTransition(async () => {
            let result;
            if (isEditing && initialData?.id) {
                result = await updateQuestion(initialData.id, data);
            } else {
                result = await createQuestion(data);
            }

            if (result.success) {
                toast.success(isEditing ? "Pregunta actualizada correctamente" : "Pregunta generada correctamente");
                router.push("/admin");
            } else {
                toast.error(result.error || "Ocurrió un error");
            }
        });
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Asignatura / Módulo
                        </label>
                        <input
                            type="text"
                            name="subject"
                            required
                            defaultValue={initialData?.subject || ""}
                            placeholder="Ej. Redes Locales"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Enunciado de la Pregunta
                        </label>
                        <textarea
                            name="statement"
                            required
                            rows={4}
                            defaultValue={initialData?.statement || ""}
                            placeholder="Escribe el enunciado aquí..."
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition resize-y"
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4">
                        Opciones y Respuesta Correcta
                    </h3>

                    <div className="grid gap-4">
                        {["A", "B", "C", "D"].map((letter, index) => (
                            <div
                                key={letter}
                                className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition"
                            >
                                <div className="flex items-center">
                                    <input
                                        type="radio"
                                        name="correctOption"
                                        value={index}
                                        required
                                        defaultChecked={initialData?.correctOption === index}
                                        className="w-5 h-5 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                    />
                                    <span className="ml-3 font-semibold text-slate-600">
                                        {letter}
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    name={`option${letter}`}
                                    required
                                    defaultValue={(initialData as any)?.[`option${letter}`] || ""}
                                    placeholder={`Texto de la opción ${letter}`}
                                    className="flex-1 bg-transparent outline-none p-1 border-b border-transparent focus:border-indigo-500 transition"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-6 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        disabled={isPending}
                        className="px-6 py-2.5 rounded-xl text-slate-600 font-medium hover:bg-slate-100 transition disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center"
                    >
                        {isPending ? "Guardando..." : isEditing ? "Actualizar Pregunta" : "Guardar Pregunta"}
                    </button>
                </div>
            </form>
        </div>
    );
}
