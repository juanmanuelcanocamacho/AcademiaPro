"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Trophy, CircleHelp } from "lucide-react";
import { Question } from "@/types";

export default function ReviewForm({ questions: initialQuestions, subject }: { questions: Question[]; subject: string }) {
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
    const [index, setIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [correct, setCorrect] = useState(0);
    const [done, setDone] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [promptResume, setPromptResume] = useState(false);
    const [tempSavedData, setTempSavedData] = useState<any>(null);

    // Auto-save logic
    const storageKey = `review_state_${subject}`;

    useEffect(() => {
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed.index > 0 || (parsed.answers && Object.keys(parsed.answers).length > 0)) {
                    setTempSavedData(parsed);
                    setPromptResume(true);
                }
            } catch (e) {
                console.error("Failed to parse saved review state");
            }
        }
        setMounted(true);
    }, [storageKey]);

    useEffect(() => {
        if (!mounted || promptResume) return;
        localStorage.setItem(storageKey, JSON.stringify({ questions, index, answers, correct, done }));
    }, [questions, index, answers, correct, done, mounted, promptResume, storageKey]);



    const current = questions[index];
    const answered = answers[current?.id] !== undefined;
    const total = questions.length;

    const handleSelect = (opt: number) => {
        if (answered) return;
        setAnswers((p) => ({ ...p, [current.id]: opt }));
        if (opt === current.correctOption) setCorrect((c) => c + 1);
    };

    const handleNext = () => {
        if (index < total - 1) setIndex((i) => i + 1);
        else setDone(true);
    };

    const reset = () => {
        setIndex(0);
        setAnswers({});
        setCorrect(0);
        setDone(false);
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (done || !current) return;
            const k = e.key.toLowerCase();
            if (!answered) {
                if ((k === "1" || k === "a") && current.optionA) handleSelect(0);
                else if ((k === "2" || k === "b") && current.optionB) handleSelect(1);
                else if ((k === "3" || k === "c") && current.optionC) handleSelect(2);
                else if ((k === "4" || k === "d") && current.optionD) handleSelect(3);
            } else if (k === "enter") {
                e.preventDefault();
                handleNext();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [done, answered, index, answers, current]);

    if (!mounted) return <div className="min-h-[400px] flex animate-pulse bg-gray-50 rounded-2xl" />;

    if (promptResume && tempSavedData) {
        return (
            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center max-w-lg mx-auto shadow-sm">
                <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5">
                    <RotateCcw className="w-8 h-8 text-amber-600" />
                </div>
                <h2 className="text-xl font-black text-gray-900 mb-2">Progreso Guardado</h2>
                <p className="text-gray-500 text-sm mb-8">Tienes un test a medias para esta asignatura. ¿Quieres retomarlo donde lo dejaste o empezar uno nuevo?</p>
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
                        if (tempSavedData.index !== undefined) setIndex(tempSavedData.index);
                        if (tempSavedData.answers) setAnswers(tempSavedData.answers);
                        if (tempSavedData.correct !== undefined) setCorrect(tempSavedData.correct);
                        if (tempSavedData.done !== undefined) setDone(tempSavedData.done);
                        setPromptResume(false);
                        setTempSavedData(null);
                    }} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition shadow-md shadow-indigo-600/20">
                        Continuar test
                    </button>
                </div>
            </div>
        );
    }

    if (!questions || questions.length === 0) {
        return (
            <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
                <CircleHelp className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-700 mb-2">Sin preguntas</h3>
                <p className="text-sm text-gray-400 mb-6">No hay preguntas disponibles para esta asignatura.</p>
                <Link href="/exam" className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition">
                    Volver
                </Link>
            </div>
        );
    }

    const pct = Math.round((correct / total) * 100);

    if (done) {
        return (
            <div className="max-w-lg mx-auto text-center">
                <div className="bg-white border border-gray-200 rounded-2xl p-12 relative overflow-hidden">
                    <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400" />
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Trophy className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-1">¡Repaso Completado!</h2>
                    <p className="text-gray-400 text-sm mb-8">{subject}</p>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Aciertos</p>
                            <p className="text-3xl font-black text-emerald-600">{correct}<span className="text-gray-300 text-xl font-bold">/{total}</span></p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Nota</p>
                            <p className="text-3xl font-black text-indigo-600">{pct}<span className="text-gray-300 text-xl font-bold">%</span></p>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                        <Link href="/exam" className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition flex items-center justify-center">
                            Asignaturas
                        </Link>

                        {correct < total && (
                            <button onClick={() => {
                                const failed = questions.filter(q => answers[q.id] !== q.correctOption);
                                setQuestions(shuffleQuestions(failed));
                                reset();
                                localStorage.removeItem(storageKey);
                            }} className="px-6 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2">
                                <RotateCcw className="w-4 h-4" /> Repetir falladas ({total - correct})
                            </button>
                        )}

                        <button onClick={() => {
                            setQuestions(shuffleQuestions(initialQuestions));
                            reset();
                            localStorage.removeItem(storageKey);
                        }} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2">
                            <RotateCcw className="w-4 h-4" /> Repetir todas
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const options = [current.optionA, current.optionB, current.optionC, current.optionD];
    const keys = ["A", "B", "C", "D"];

    return (
        <div className="max-w-3xl mx-auto space-y-5">
            {/* Progress */}
            <div className="flex items-center gap-4">
                <div className="flex-1 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${(index / total) * 100}%` }}
                    />
                </div>
                <span className="text-xs font-bold text-gray-500 w-16 text-right">{index + 1} / {total}</span>
            </div>

            {/* Question card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
                <div className="flex items-start gap-5 mb-8">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 font-black text-indigo-700">
                        {index + 1}
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 leading-snug pt-1.5">{current.statement}</h2>
                </div>

                <div className="space-y-3">
                    {options.map((opt, i) => {
                        const isSelected = answers[current.id] === i;
                        const isCorrect = current.correctOption === i;
                        const show = answered;

                        let cls = "border-gray-100 bg-white hover:border-indigo-300 hover:bg-indigo-50/30";
                        let iconEl = null;

                        if (show) {
                            if (isCorrect) {
                                cls = "border-emerald-400 bg-emerald-50 border-2";
                                iconEl = <div className="p-1 bg-emerald-500 rounded-lg"><CheckCircle2 className="w-3.5 h-3.5 text-white" /></div>;
                            } else if (isSelected) {
                                cls = "border-red-400 bg-red-50 border-2";
                                iconEl = <div className="p-1 bg-red-500 rounded-lg"><XCircle className="w-3.5 h-3.5 text-white" /></div>;
                            } else {
                                cls = "border-gray-100 opacity-40";
                            }
                        }

                        return (
                            <button
                                key={i}
                                onClick={() => handleSelect(i)}
                                disabled={answered || !opt}
                                aria-pressed={isSelected}
                                className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all flex items-center justify-between gap-5 ${cls} ${!answered ? "cursor-pointer" : "cursor-default"}`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs font-black transition-colors shrink-0 ${show && isCorrect ? "bg-emerald-600 border-emerald-600 text-white" :
                                        show && isSelected ? "bg-red-600 border-red-600 text-white" :
                                            "bg-white border-gray-200 text-gray-400"
                                        }`}>{keys[i]}</span>
                                    <span className="text-sm font-semibold text-gray-700">{opt}</span>
                                </div>
                                {iconEl}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Next button */}
            {answered && (
                <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <button
                        onClick={handleNext}
                        className="group flex items-center gap-3 px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:-translate-y-0.5 transition-all"
                    >
                        {index < total - 1 ? "Siguiente" : "Ver resultados"}
                        <kbd className="bg-indigo-500/50 text-indigo-100 text-[10px] px-1.5 py-0.5 rounded font-mono hidden sm:inline">ENTER</kbd>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            )}
        </div>
    );
}
