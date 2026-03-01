"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Trophy, AlertTriangle, GraduationCap } from "lucide-react";
import { Question } from "@/types";

export default function ExamForm({ questions: initialQuestions, subject }: { questions: Question[]; subject: string }) {
    const searchParams = useSearchParams();
    const randomQ = searchParams.get("randomQ") !== "false";
    const randomA = searchParams.get("randomA") === "true";

    const shuffleQuestions = (qs: Question[]) => {
        let result = [...qs];
        if (randomQ) result.sort(() => Math.random() - 0.5);
        if (randomA) {
            result = result.map(q => {
                const pairs = [
                    { text: q.optionA, correct: q.correctOption === 0 },
                    { text: q.optionB, correct: q.correctOption === 1 },
                    { text: q.optionC, correct: q.correctOption === 2 },
                    { text: q.optionD, correct: q.correctOption === 3 },
                ].sort(() => Math.random() - 0.5);
                return { ...q, optionA: pairs[0].text, optionB: pairs[1].text, optionC: pairs[2].text, optionD: pairs[3].text, correctOption: pairs.findIndex((p) => p.correct) } as Question;
            });
        }
        return result;
    };

    const [questions, setQuestions] = useState(initialQuestions);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState({ correct: 0, total: 0 });
    const [mounted, setMounted] = useState(false);
    const [promptResume, setPromptResume] = useState(false);
    const [tempSavedData, setTempSavedData] = useState<any>(null);

    // Auto-save logic
    const storageKey = `exam_state_${subject}`;

    useEffect(() => {
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed.answers && Object.keys(parsed.answers).length > 0) {
                    setTempSavedData(parsed);
                    setPromptResume(true);
                }
            } catch (e) {
                console.error("Failed to parse saved exam state");
            }
        }
        setMounted(true);
    }, [storageKey]);

    useEffect(() => {
        if (!mounted || promptResume) return;
        localStorage.setItem(storageKey, JSON.stringify({ questions, answers, submitted, score }));
    }, [questions, answers, submitted, score, mounted, promptResume, storageKey]);

    const handleSelect = (qId: string, opt: number) => {
        if (submitted) return;
        setAnswers((p) => ({ ...p, [qId]: opt }));
    };

    const submit = () => {
        const correctCount = questions.reduce((acc, q) => {
            return acc + (answers[q.id] === q.correctOption ? 1 : 0);
        }, 0);
        setScore({ correct: correctCount, total: questions.length });
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    if (!mounted) return <div className="min-h-[400px] flex animate-pulse bg-gray-50 rounded-2xl" />;

    if (promptResume && tempSavedData) {
        return (
            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center max-w-lg mx-auto shadow-sm">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5">
                    <RotateCcw className="w-8 h-8 text-amber-600" />
                </div>
                <h2 className="text-xl font-black text-gray-900 mb-2">Progreso Guardado</h2>
                <p className="text-gray-500 text-sm mb-8">Tienes un simulacro a medias para esta asignatura. ¿Quieres retomarlo donde lo dejaste o empezar uno nuevo?</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button onClick={() => {
                        localStorage.removeItem(storageKey);
                        setPromptResume(false);
                        setTempSavedData(null);
                    }} className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition">
                        Empezar de cero
                    </button>
                    <button onClick={() => {
                        if (tempSavedData.questions) setQuestions(tempSavedData.questions);
                        if (tempSavedData.answers) setAnswers(tempSavedData.answers);
                        if (tempSavedData.submitted) setSubmitted(tempSavedData.submitted);
                        if (tempSavedData.score) setScore(tempSavedData.score);
                        setPromptResume(false);
                        setTempSavedData(null);
                    }} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition shadow-md shadow-indigo-600/20">
                        Continuar simulacro
                    </button>
                </div>
            </div>
        );
    }

    if (!questions || questions.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
                <p className="text-gray-400 text-sm mb-4">No hay preguntas para esta asignatura.</p>
                <Link href="/exam" className="inline-flex px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition">Volver</Link>
            </div>
        );
    }

    const answered = Object.keys(answers).length;

    return (
        <div className="max-w-3xl mx-auto space-y-5">
            {/* Progress */}
            <div className="flex items-center gap-4">
                <div className="flex-1 bg-gray-200 h-1.5 rounded-full overflow-hidden sticky top-4">
                    <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                        style={{ width: `${(answered / questions.length) * 100}%` }}
                    />
                </div>
                <span className="text-xs font-bold text-gray-500 w-20 text-right">{answered} / {questions.length}</span>
            </div>

            {/* Results */}
            {submitted && (
                <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400" />
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-5">
                        <Trophy className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-1">Resultados</h2>
                    <p className="text-gray-400 text-sm mb-7">{subject}</p>
                    <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-7">
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Aciertos</p>
                            <p className="text-3xl font-black text-emerald-600">{score.correct}<span className="text-gray-300 text-xl">/{score.total}</span></p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nota</p>
                            <p className="text-3xl font-black text-indigo-600">{(score.correct / score.total * 10).toFixed(1)}<span className="text-gray-300 text-xl">/10</span></p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center mt-7">
                        <Link href="/exam" className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition">Asignaturas</Link>

                        {score.correct < score.total && (
                            <button onClick={() => {
                                const failed = questions.filter(q => answers[q.id] !== q.correctOption);
                                setQuestions(shuffleQuestions(failed));
                                setAnswers({});
                                setSubmitted(false);
                                setScore({ correct: 0, total: 0 });
                                localStorage.removeItem(storageKey);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                            }} className="px-6 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> Repetir falladas ({score.total - score.correct})
                            </button>
                        )}

                        <button onClick={() => {
                            setQuestions(shuffleQuestions(initialQuestions));
                            setAnswers({});
                            setSubmitted(false);
                            setScore({ correct: 0, total: 0 });
                            localStorage.removeItem(storageKey);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                        }} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2">
                            <RotateCcw className="w-4 h-4" /> Repetir simulacro
                        </button>
                    </div>
                </div>
            )}

            {/* Questions */}
            {questions.map((q, qi) => {
                const opts = [q.optionA, q.optionB, q.optionC, q.optionD];
                return (
                    <div key={q.id} className="bg-white border border-gray-200 rounded-2xl p-8">
                        <div className="flex items-start gap-5 mb-7">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 font-black text-indigo-700 text-sm">
                                {qi + 1}
                            </div>
                            <h3 className="text-[15px] font-bold text-gray-800 leading-snug pt-1.5">{q.statement}</h3>
                        </div>

                        <div className="space-y-2.5">
                            {opts.map((opt, i) => {
                                const selected = answers[q.id] === i;
                                const isCorrect = q.correctOption === i;
                                const show = submitted;

                                let cls = "border-gray-100 bg-white hover:border-indigo-300 hover:bg-indigo-50/20";
                                let icon = null;
                                if (show) {
                                    if (isCorrect) { cls = "border-emerald-400 bg-emerald-50 border-2"; icon = <div className="p-1 bg-emerald-500 rounded-lg"><CheckCircle2 className="w-3.5 h-3.5 text-white" /></div>; }
                                    else if (selected) { cls = "border-red-400 bg-red-50 border-2"; icon = <div className="p-1 bg-red-500 rounded-lg"><XCircle className="w-3.5 h-3.5 text-white" /></div>; }
                                    else { cls = "border-gray-100 opacity-40 border-2"; }
                                } else if (selected) {
                                    cls = "border-indigo-500 bg-indigo-50 border-2";
                                }

                                return (
                                    <button
                                        key={i}
                                        onClick={() => handleSelect(q.id, i)}
                                        aria-pressed={selected}
                                        disabled={submitted || !opt}
                                        className={`w-full text-left px-5 py-3.5 rounded-xl border-2 transition-all flex items-center justify-between gap-4 ${cls} ${!submitted ? "cursor-pointer" : "cursor-default"}`}
                                    >
                                        <div className="flex items-center gap-3.5">
                                            <span className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-black shrink-0 ${show && isCorrect ? "bg-emerald-600 border-emerald-600 text-white" :
                                                show && selected ? "bg-red-600 border-red-600 text-white" :
                                                    selected ? "bg-indigo-600 border-indigo-600 text-white" :
                                                        "bg-white border-gray-200 text-gray-400"
                                                }`}>{["A", "B", "C", "D"][i]}</span>
                                            <span className="text-sm font-semibold text-gray-700">{opt}</span>
                                        </div>
                                        {icon}
                                    </button>
                                );
                            })}
                        </div>

                        {submitted && answers[q.id] === undefined && (
                            <div className="mt-4 flex items-center gap-2 text-amber-600 text-xs font-bold bg-amber-50 rounded-xl px-4 py-2.5">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Sin responder — la correcta era {["A", "B", "C", "D"][q.correctOption]}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Submit */}
            {!submitted && (
                <div className="sticky bottom-6 flex justify-center z-20 pointer-events-none">
                    <button
                        onClick={submit}
                        disabled={answered === 0}
                        className="pointer-events-auto flex items-center gap-3 px-10 py-4 bg-gray-900 hover:bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-2xl hover:-translate-y-1 transition-all duration-300 disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:bg-gray-900"
                    >
                        <GraduationCap className="w-5 h-5" />
                        EVALUAR EXAMEN
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            )}
        </div>
    );
}
