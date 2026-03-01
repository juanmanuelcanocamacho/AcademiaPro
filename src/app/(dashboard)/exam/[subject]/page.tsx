import { generateExamBySubject } from "@/actions/exam";
import ExamForm from "@/components/ExamForm";
import ReviewForm from "@/components/ReviewForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function SubjectExamPage({
    params,
    searchParams,
}: {
    params: Promise<{ subject: string }>;
    searchParams: Promise<{ mode?: string; randomQ?: string; randomA?: string; topic?: string }>;
}) {
    const { subject: rawSubject } = await params;
    const { mode, randomQ: rq, randomA: ra, topic: rawTopic } = await searchParams;

    const subject = decodeURIComponent(rawSubject);
    const topic = rawTopic ? decodeURIComponent(rawTopic) : undefined;
    const isRepaso = mode === "repaso";
    const randomQ = rq !== "false";
    const randomA = ra === "true";

    let { questions = [] } = await generateExamBySubject(subject, 1000, randomQ, topic);

    // Shuffle answer options if randomA
    if (randomA) {
        questions = questions.map((q: any) => {
            const pairs = [
                { text: q.optionA, correct: q.correctOption === 0 },
                { text: q.optionB, correct: q.correctOption === 1 },
                { text: q.optionC, correct: q.correctOption === 2 },
                { text: q.optionD, correct: q.correctOption === 3 },
            ].sort(() => Math.random() - 0.5);

            return {
                ...q,
                optionA: pairs[0].text,
                optionB: pairs[1].text,
                optionC: pairs[2].text,
                optionD: pairs[3].text,
                correctOption: pairs.findIndex((p) => p.correct),
            };
        });
    }

    return (
        <div className="p-8">
            <Link
                href="/exam"
                className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-indigo-600 border border-gray-200 bg-white px-4 py-2 rounded-xl mb-8 transition"
            >
                <ArrowLeft className="w-4 h-4" /> Asignaturas
            </Link>

            <div className="mb-8">
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                    {subject} {topic && <span className="text-indigo-600 font-bold ml-2 text-xl bg-indigo-50 px-3 py-1 rounded-lg">/ {topic}</span>}
                </h1>
                <p className="text-gray-400 text-sm mt-2">
                    {isRepaso
                        ? `Modo Repaso · ${questions.length} preguntas`
                        : `Modo Examen · ${questions.length} preguntas`}
                    {randomQ ? " · Aleatorio" : " · Orden original"}
                    {randomA ? " · Opciones barajadas" : ""}
                </p>
            </div>

            {isRepaso
                ? <ReviewForm questions={questions} subject={subject} />
                : <ExamForm questions={questions} subject={subject} />}
        </div>
    );
}
