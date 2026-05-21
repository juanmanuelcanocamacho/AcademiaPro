"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Trophy, CircleHelp, AlertTriangle } from "lucide-react";
import { Question } from "@/types";
import TheoryChat from "./TheoryChat";
import FormattedStatement from "./FormattedStatement";
import { saveExamAttempt } from "@/actions/progress";

export default function ReviewForm({
    questions: initialQuestions,
    subject,
    nextTopic,
}: {
    questions: Question[];
    subject: string;
    nextTopic?: string | null;
}) {
    const searchParams = useSearchParams();
    const mode = searchParams.get("mode") || "repaso";
    const randomQ = searchParams.get("randomQ") !== "false";
    const randomA = searchParams.get("randomA") === "true";

    const nextUnitUrl = nextTopic
        ? `/exam/${encodeURIComponent(subject)}?mode=${mode}&randomQ=${randomQ}&randomA=${randomA}&topic=${encodeURIComponent(nextTopic)}`
        : null;

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [tempSavedData, setTempSavedData] = useState<any>(null);
    const [darkMode, setDarkMode] = useState(false);

    // New features states & refs
    const [autoAdvance, setAutoAdvance] = useState(true);
    const [autoAdvanceDelay, setAutoAdvanceDelay] = useState(1200);
    const [concentrationMode, setConcentrationMode] = useState(false);
    const [skippedQuestions, setSkippedQuestions] = useState<Set<string>>(new Set());
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showChatButton, setShowChatButton] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const autoAdvanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage((curr) => curr === msg ? null : curr);
        }, 3500);
    };

    // Load preferences on mount
    useEffect(() => {
        const savedAuto = localStorage.getItem("exam_auto_advance");
        if (savedAuto !== null) {
            setAutoAdvance(savedAuto === "true");
        }
        const savedDelay = localStorage.getItem("exam_auto_advance_delay");
        if (savedDelay !== null) {
            setAutoAdvanceDelay(Number(savedDelay));
        }
        const savedConcentration = localStorage.getItem("exam_concentration_mode") === "true";
        setConcentrationMode(savedConcentration);
        if (savedConcentration) {
            document.body.classList.add("concentration-mode");
        }
        const savedChatBtn = localStorage.getItem("exam_show_chat_button");
        if (savedChatBtn !== null) {
            setShowChatButton(savedChatBtn === "true");
        }
        const savedDark = localStorage.getItem("exam_dark_mode") === "true";
        setDarkMode(savedDark);
        if (savedDark) {
            document.body.classList.add("dark");
        }
        return () => {
            document.body.classList.remove("concentration-mode");
            document.body.classList.remove("dark");
        };
    }, []);

    const toggleDarkMode = () => {
        setDarkMode(prev => {
            const next = !prev;
            localStorage.setItem("exam_dark_mode", String(next));
            if (next) {
                document.body.classList.add("dark");
            } else {
                document.body.classList.remove("dark");
            }
            return next;
        });
    };

    const toggleConcentrationMode = () => {
        setConcentrationMode(prev => {
            const next = !prev;
            localStorage.setItem("exam_concentration_mode", String(next));
            if (next) {
                document.body.classList.add("concentration-mode");
            } else {
                document.body.classList.remove("concentration-mode");
            }
            return next;
        });
    };

    // Click outside dropdown handler
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        if (showDropdown) {
            document.addEventListener("mousedown", handleOutsideClick);
        }
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, [showDropdown]);

    // Clear autoAdvance timeout on question index change
    useEffect(() => {
        return () => {
            if (autoAdvanceTimeoutRef.current) {
                clearTimeout(autoAdvanceTimeoutRef.current);
            }
        };
    }, [index]);

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
            } catch {
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

    const handleNext = (updatedAnswers: Record<string, number> = answers) => {
        if (index < total - 1) {
            setIndex((i) => i + 1);
        } else {
            // Reached the end! Let's search for the first unanswered/skipped question
            const firstUnansweredIndex = questions.findIndex(q => updatedAnswers[q.id] === undefined);
            if (firstUnansweredIndex !== -1) {
                setIndex(firstUnansweredIndex);
                showToast("¡Has llegado al final! Te redirigimos a las preguntas pendientes.");
            } else {
                setDone(true);

                // Guardar intento en la DB (fire-and-forget)
                const finalCorrect = questions.reduce((acc, q) => {
                    return acc + (updatedAnswers[q.id] === q.correctOption ? 1 : 0);
                }, 0);
                const topic = searchParams.get("topic") || null;
                saveExamAttempt({
                    subject,
                    topic: topic ? decodeURIComponent(topic) : null,
                    score: (finalCorrect / total) * 100,
                    correct: finalCorrect,
                    total: total,
                    mode: "repaso",
                });
            }
        }
    };

    const handleSelect = (opt: number) => {
        if (answered) return;
        const updatedAnswers = { ...answers, [current.id]: opt };
        setAnswers(updatedAnswers);
        if (opt === current.correctOption) setCorrect((c) => c + 1);

        setSkippedQuestions((prev) => {
            const next = new Set(prev);
            next.delete(current.id);
            return next;
        });

        if (autoAdvance) {
            if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);
            autoAdvanceTimeoutRef.current = setTimeout(() => {
                handleNext(updatedAnswers);
            }, autoAdvanceDelay);
        }
    };

    const handleSkip = () => {
        setSkippedQuestions((prev) => {
            const next = new Set(prev);
            next.add(current.id);
            return next;
        });
        handleNext(answers);
    };

    const reset = () => {
        setIndex(0);
        setAnswers({});
        setCorrect(0);
        setDone(false);
        setSkippedQuestions(new Set());
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (done || !current) return;

            // Ignore shortcuts if the user is typing in any input field or textarea
            const activeEl = document.activeElement;
            if (activeEl && (
                activeEl.tagName === "INPUT" ||
                activeEl.tagName === "TEXTAREA" ||
                (activeEl as HTMLElement).isContentEditable
            )) {
                return;
            }

            const k = e.key.toLowerCase();
            if (!answered) {
                if (e.key === " ") {
                    e.preventDefault();
                    handleSkip();
                } else if ((k === "1" || k === "a") && current.optionA) {
                    handleSelect(0);
                } else if ((k === "2" || k === "b") && current.optionB) {
                    handleSelect(1);
                } else if ((k === "3" || k === "c") && current.optionC) {
                    handleSelect(2);
                } else if ((k === "4" || k === "d") && current.optionD) {
                    handleSelect(3);
                }
            } else if (k === "enter") {
                e.preventDefault();
                handleNext();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [done, answered, index, answers, current, autoAdvance]);

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
                    <div className="space-y-3 mt-8">
                        {/* Primary actions row: Up to 2 main buttons side by side */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                            {nextUnitUrl ? (
                                <>
                                    {correct < total ? (
                                        <button onClick={() => {
                                            const failed = questions.filter(q => answers[q.id] !== q.correctOption);
                                            setQuestions(shuffleQuestions(failed));
                                            reset();
                                            localStorage.removeItem(storageKey);
                                        }} className="w-full px-5 py-3 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2">
                                            <RotateCcw className="w-4 h-4" /> Repetir falladas ({total - correct})
                                        </button>
                                    ) : (
                                        <button onClick={() => {
                                            setQuestions(shuffleQuestions(initialQuestions));
                                            reset();
                                            localStorage.removeItem(storageKey);
                                        }} className="w-full px-5 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2">
                                            <RotateCcw className="w-4 h-4" /> Repetir todas
                                        </button>
                                    )}
                                    <Link href={nextUnitUrl} className="w-full px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-95 duration-200">
                                        Siguiente Unidad <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </>
                            ) : (
                                <>
                                    {correct < total ? (
                                        <>
                                            <button onClick={() => {
                                                const failed = questions.filter(q => answers[q.id] !== q.correctOption);
                                                setQuestions(shuffleQuestions(failed));
                                                reset();
                                                localStorage.removeItem(storageKey);
                                            }} className="w-full px-5 py-3 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2">
                                                <RotateCcw className="w-4 h-4" /> Repetir falladas ({total - correct})
                                            </button>
                                            <button onClick={() => {
                                                setQuestions(shuffleQuestions(initialQuestions));
                                                reset();
                                                localStorage.removeItem(storageKey);
                                            }} className="w-full px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2">
                                                <RotateCcw className="w-4 h-4" /> Repetir todas
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => {
                                            setQuestions(shuffleQuestions(initialQuestions));
                                            reset();
                                            localStorage.removeItem(storageKey);
                                        }} className="w-full px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2">
                                            <RotateCcw className="w-4 h-4" /> Repetir todas
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Secondary utilities row: Centered and compact */}
                        <div className="flex justify-center gap-3 pt-1">
                            <Link href="/exam" className="w-full sm:w-auto min-w-[140px] px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 font-semibold rounded-xl text-xs border border-gray-200 transition flex items-center justify-center">
                                Asignaturas
                            </Link>

                            {nextUnitUrl && correct < total && (
                                <button onClick={() => {
                                    setQuestions(shuffleQuestions(initialQuestions));
                                    reset();
                                    localStorage.removeItem(storageKey);
                                }} className="w-full sm:w-auto min-w-[140px] px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 font-semibold rounded-xl text-xs border border-gray-200 transition flex items-center justify-center gap-1.5">
                                    <RotateCcw className="w-3.5 h-3.5" /> Repetir todas
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const options = [current.optionA, current.optionB, current.optionC, current.optionD];
    const keys = ["A", "B", "C", "D"];

    return (
        <div className="max-w-3xl mx-auto space-y-5">
            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-gray-800 animate-in fade-in slide-in-from-bottom-5 duration-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs font-bold tracking-wide">{toastMessage}</span>
                </div>
            )}

            {/* Question card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-8">
                <div className="flex items-start gap-5 mb-8">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 font-black text-indigo-700">
                        {index + 1}
                    </div>
                    <div className="text-lg font-bold text-gray-800 leading-snug pt-1.5 flex-1">
                        <FormattedStatement text={current.statement} />
                    </div>
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

                {!answered && (
                    <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-300">
                        <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                            Puedes usar <kbd className="px-1.5 py-0.5 bg-gray-50 border border-gray-200 rounded font-mono text-[9px] text-gray-500 shadow-sm">Espacio</kbd> para saltar esta pregunta.
                        </span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSkip();
                            }}
                            className="px-4 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition flex items-center gap-1.5 self-end sm:self-auto cursor-pointer font-sans"
                        >
                            Saltar pregunta
                        </button>
                    </div>
                )}
            </div>

            {/* Next button */}
            {answered && (
                <div className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <button
                        onClick={() => handleNext()}
                        className="group flex items-center gap-3 px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 hover:-translate-y-0.5 transition-all"
                    >
                        {index < total - 1 ? "Siguiente" : "Ver resultados"}
                        <kbd className="bg-indigo-500/50 text-indigo-100 text-[10px] px-1.5 py-0.5 rounded font-mono hidden sm:inline">ENTER</kbd>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                </div>
            )}

            {/* Questions Navigation Map */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Navegación de Preguntas</h3>
                    <span className="text-xs text-gray-400 font-semibold">{Object.keys(answers).length} / {total} respondidas</span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {questions.map((q, idx) => {
                        const isCurrent = index === idx;
                        const isAnswered = answers[q.id] !== undefined;
                        const isCorrect = answers[q.id] === q.correctOption;
                        const isSkipped = skippedQuestions.has(q.id);

                        let badgeCls = "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 hover:text-gray-700";
                        if (isCurrent) {
                            badgeCls = "bg-indigo-50 text-indigo-700 border-indigo-500 font-black ring-2 ring-indigo-500/10 scale-105";
                        } else if (isAnswered) {
                            if (isCorrect) {
                                badgeCls = "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800";
                            } else {
                                badgeCls = "bg-red-50 text-red-700 border-red-300 hover:bg-red-100 hover:text-red-800";
                            }
                        } else if (isSkipped) {
                            badgeCls = "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 hover:text-amber-800";
                        }

                        return (
                            <button
                                key={q.id}
                                onClick={() => setIndex(idx)}
                                className={`w-9 h-9 rounded-xl border text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${badgeCls} active:scale-95 duration-100`}
                            >
                                {idx + 1}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Header Control Bar (positioned at the bottom) */}
            <div className="relative bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm select-none">
                {/* Thin progress bar at the bottom edge */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 rounded-b-2xl overflow-hidden">
                    <div
                        className="h-full bg-indigo-600 transition-all duration-500 rounded-r-full"
                        style={{ width: `${((index + 1) / total) * 100}%` }}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                            Pregunta {index + 1} de {total}
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">
                            {Math.round(((index + 1) / total) * 100)}% completado
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Standalone Premium Dark Mode Switch */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500">Modo Oscuro</span>
                            <button
                                onClick={toggleDarkMode}
                                aria-label="Cambiar Modo Oscuro"
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    darkMode ? "bg-indigo-600" : "bg-gray-200"
                                }`}
                            >
                                <span
                                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                        darkMode ? "translate-x-4" : "translate-x-0"
                                    }`}
                                />
                            </button>
                        </div>

                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 text-gray-700 hover:text-indigo-600 rounded-xl transition text-xs font-bold border border-gray-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            >
                                <span>Ajustes de Concentración</span>
                                <svg
                                    className={`w-3.5 h-3.5 transform transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {showDropdown && (
                                <div className="absolute right-0 bottom-full mb-2 w-80 bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl shadow-xl z-30 p-4 space-y-4 text-left animate-in fade-in slide-in-from-bottom-2 duration-200 font-sans">
                                    <div>
                                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Ajustes de concentración</h4>
                                        
                                        <div className="space-y-3.5">
                                            {/* Auto Advance Toggle */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-xs font-bold text-gray-800 block">Auto-avanzar</span>
                                                        <span className="text-[9px] text-gray-400 font-medium">Siguiente pregunta al responder</span>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setAutoAdvance(prev => {
                                                                const next = !prev;
                                                                localStorage.setItem("exam_auto_advance", String(next));
                                                                return next;
                                                            });
                                                        }}
                                                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                            autoAdvance ? "bg-indigo-600" : "bg-gray-200"
                                                        }`}
                                                    >
                                                        <span
                                                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                                autoAdvance ? "translate-x-4" : "translate-x-0"
                                                            }`}
                                                        />
                                                    </button>
                                                </div>

                                                {autoAdvance && (
                                                    <div className="bg-gray-50/80 rounded-xl p-2 flex flex-col gap-1 border border-gray-100 animate-in fade-in slide-in-from-top-1 duration-200">
                                                        <span className="text-[8px] font-extrabold text-gray-400 uppercase tracking-wider block">Espera de avance</span>
                                                        <div className="flex items-center justify-between gap-1">
                                                            {[
                                                                { label: "0.3s", value: 300 },
                                                                { label: "0.8s", value: 800 },
                                                                { label: "1.5s", value: 1500 },
                                                                { label: "3.0s", value: 3000 }
                                                            ].map((item) => {
                                                                const isSelected = autoAdvanceDelay === item.value;
                                                                return (
                                                                    <button
                                                                        key={item.value}
                                                                        onClick={() => {
                                                                            setAutoAdvanceDelay(item.value);
                                                                            localStorage.setItem("exam_auto_advance_delay", String(item.value));
                                                                        }}
                                                                        className={`flex-1 py-1 rounded-lg text-[9px] font-black tracking-tight border transition-all cursor-pointer ${
                                                                            isSelected
                                                                                ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                                                                                : "bg-white border-gray-200 text-gray-450 hover:text-gray-700 hover:bg-gray-50"
                                                                        }`}
                                                                    >
                                                                        {item.label}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Concentration Mode Toggle */}
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-xs font-bold text-gray-800 block">Modo Zen (Sin distracciones)</span>
                                                    <span className="text-[9px] text-gray-400 font-medium">Oculta menú lateral y cabeceras</span>
                                                </div>
                                                <button
                                                    onClick={toggleConcentrationMode}
                                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                        concentrationMode ? "bg-indigo-600" : "bg-gray-200"
                                                    }`}
                                                >
                                                    <span
                                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                            concentrationMode ? "translate-x-4" : "translate-x-0"
                                                        }`}
                                                    />
                                                </button>
                                            </div>

                                            {/* Show Chat Button Toggle */}
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-xs font-bold text-gray-800 block">Botón de chat flotante</span>
                                                    <span className="text-[9px] text-gray-400 font-medium">Burbuja de la IA en la esquina</span>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setShowChatButton(prev => {
                                                            const next = !prev;
                                                            localStorage.setItem("exam_show_chat_button", String(next));
                                                            return next;
                                                        });
                                                    }}
                                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                                        showChatButton ? "bg-indigo-600" : "bg-gray-200"
                                                    }`}
                                                >
                                                    <span
                                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                                            showChatButton ? "translate-x-4" : "translate-x-0"
                                                        }`}
                                                    />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Open AI Chat Button as secondary utility inside settings */}
                                    <div className="pt-3 border-t border-gray-100">
                                        <button
                                            onClick={() => {
                                                setIsChatOpen(true);
                                                setShowDropdown(false);
                                            }}
                                            className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                            Preguntar al Asistente IA
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Theory Chat */}
            <TheoryChat
                subject={subject}
                currentQuestion={current?.statement}
                isOpen={isChatOpen}
                onOpenChange={setIsChatOpen}
                showFloatingButton={showChatButton}
            />
        </div>
    );
}
