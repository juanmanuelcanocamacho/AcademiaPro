"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Trophy, AlertTriangle, GraduationCap } from "lucide-react";
import { Question } from "@/types";
import TheoryChat from "./TheoryChat";
import FormattedStatement from "./FormattedStatement";
import { saveExamAttempt } from "@/actions/progress";

export default function ExamForm({
    questions: initialQuestions,
    subject,
    nextTopic,
}: {
    questions: Question[];
    subject: string;
    nextTopic?: string | null;
}) {
    const searchParams = useSearchParams();
    const mode = searchParams.get("mode") || "examen";
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
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState({ correct: 0, total: 0 });
    const [mounted, setMounted] = useState(false);
    const [promptResume, setPromptResume] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [tempSavedData, setTempSavedData] = useState<any>(null);

    const [activeQuestionStatement, setActiveQuestionStatement] = useState<string>("");
    
    // New features states
    const [autoAdvance, setAutoAdvance] = useState(true);
    const [autoAdvanceDelay, setAutoAdvanceDelay] = useState(800); // 800ms default for smooth scroll transition
    const [concentrationMode, setConcentrationMode] = useState(false);
    const [skippedQuestions, setSkippedQuestions] = useState<Set<string>>(new Set());
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [showChatButton, setShowChatButton] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const autoAdvanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => {
            setToastMessage((curr) => curr === msg ? null : curr);
        }, 3500);
    };

    // Auto-save logic
    const storageKey = `exam_state_${subject}`;

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
        return () => {
            document.body.classList.remove("concentration-mode");
            if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);
        };
    }, []);

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

    const advanceFrom = (fromIndex: number, updatedAnswers: Record<string, number>, isSkip = false) => {
        if (isSkip) {
            setSkippedQuestions((prev) => {
                const next = new Set(prev);
                next.add(questions[fromIndex].id);
                return next;
            });
        } else {
            setSkippedQuestions((prev) => {
                const next = new Set(prev);
                next.delete(questions[fromIndex].id);
                return next;
            });
        }

        const nextIndex = fromIndex + 1;
        if (nextIndex < questions.length) {
            const nextQ = questions[nextIndex];
            setActiveQuestionStatement(nextQ.statement);
            setTimeout(() => {
                const container = document.getElementById(`question-container-${nextQ.id}`);
                if (container) {
                    container.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            }, 150);
        } else {
            // Reached the end! Let's redirect to the first unanswered/skipped question
            const firstUnansweredIndex = questions.findIndex(q => updatedAnswers[q.id] === undefined);
            if (firstUnansweredIndex !== -1 && firstUnansweredIndex !== fromIndex) {
                const targetQ = questions[firstUnansweredIndex];
                setActiveQuestionStatement(targetQ.statement);
                showToast("¡Has llegado al final! Te redirigimos a las preguntas pendientes.");
                setTimeout(() => {
                    const container = document.getElementById(`question-container-${targetQ.id}`);
                    if (container) {
                        container.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                }, 150);
            } else {
                // If everything is completed
                if (Object.keys(updatedAnswers).length === questions.length) {
                    showToast("¡Has completado todas las preguntas! Ya puedes evaluar tu examen.");
                }
            }
        }
    };

    // Spacebar listener to skip questions
    useEffect(() => {
        if (submitted || promptResume || !mounted) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const activeEl = document.activeElement;
            if (activeEl && (
                activeEl.tagName === "INPUT" ||
                activeEl.tagName === "TEXTAREA" ||
                (activeEl as HTMLElement).isContentEditable
            )) {
                return;
            }

            if (e.key === " ") {
                e.preventDefault(); // Prevent standard page scroll down

                const currentIndex = questions.findIndex(q => q.statement === activeQuestionStatement);
                if (currentIndex !== -1) {
                    advanceFrom(currentIndex, answers, true);
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeQuestionStatement, questions, answers, submitted, promptResume, mounted]);

    useEffect(() => {
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed.answers && Object.keys(parsed.answers).length > 0) {
                    setTempSavedData(parsed);
                    setPromptResume(true);
                }
            } catch {
                console.error("Failed to parse saved exam state");
            }
        } else {
            // Apply shuffling on first load if no saved state exists
            const shuffled = shuffleQuestions(initialQuestions);
            setQuestions(shuffled);
            setActiveQuestionStatement(shuffled[0]?.statement || "");
        }
        setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [storageKey]);

    useEffect(() => {
        if (!mounted || promptResume) return;
        localStorage.setItem(storageKey, JSON.stringify({ questions, answers, submitted, score }));
    }, [questions, answers, submitted, score, mounted, promptResume, storageKey]);

    const handleSelect = (qId: string, opt: number) => {
        if (submitted) return;
        
        const updatedAnswers = { ...answers, [qId]: opt };
        setAnswers(updatedAnswers);

        // Remove from skipped list since it's answered
        setSkippedQuestions((prev) => {
            const next = new Set(prev);
            next.delete(qId);
            return next;
        });

        if (autoAdvance) {
            if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);
            const currentIndex = questions.findIndex(q => q.id === qId);
            if (currentIndex !== -1) {
                autoAdvanceTimeoutRef.current = setTimeout(() => {
                    advanceFrom(currentIndex, updatedAnswers, false);
                }, autoAdvanceDelay);
            }
        }
    };

    const submit = () => {
        const correctCount = questions.reduce((acc, q) => {
            return acc + (answers[q.id] === q.correctOption ? 1 : 0);
        }, 0);
        setScore({ correct: correctCount, total: questions.length });
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: "smooth" });

        // Guardar intento en la DB (fire-and-forget)
        const topic = searchParams.get("topic") || null;
        saveExamAttempt({
            subject,
            topic: topic ? decodeURIComponent(topic) : null,
            score: (correctCount / questions.length) * 100,
            correct: correctCount,
            total: questions.length,
            mode: "examen",
        });
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
                        if (tempSavedData.questions) {
                            setQuestions(tempSavedData.questions);
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const data = tempSavedData as any;
                            const savedAnswers = data.answers || {};
                            const firstUnanswered = data.questions.find((q: Question) => savedAnswers[q.id] === undefined);
                            setActiveQuestionStatement(firstUnanswered?.statement || data.questions[0]?.statement || "");
                        }
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
            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-gray-800 animate-in fade-in slide-in-from-bottom-5 duration-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-xs font-bold tracking-wide">{toastMessage}</span>
                </div>
            )}

            {/* Header Control Bar */}
            <div className="relative bg-white border border-gray-200 rounded-2xl px-5 py-4 shadow-sm overflow-hidden select-none">
                {/* Thin progress bar at the bottom edge */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
                    <div
                        className="h-full bg-indigo-600 transition-all duration-300 rounded-r-full"
                        style={{ width: `${(answered / questions.length) * 100}%` }}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                            {answered} / {questions.length} completadas
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">
                            {Math.round((answered / questions.length) * 100)}% completado
                        </span>
                    </div>

                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 text-gray-700 hover:text-indigo-600 rounded-xl transition text-xs font-bold border border-gray-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                            <span>Ajustes y Navegación</span>
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
                            <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl shadow-xl z-30 p-4 space-y-4 text-left animate-in fade-in slide-in-from-top-2 duration-200 font-sans">
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

                                {/* Questions Map Grid */}
                                <div className="border-t border-gray-100 pt-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Navegación</p>
                                        <span className="text-[9px] text-gray-400 font-semibold">{answered} / {questions.length} respondidas</span>
                                    </div>
                                    <div className="max-h-32 overflow-y-auto pr-1 flex flex-wrap gap-1.5">
                                        {questions.map((q, idx) => {
                                            const isCurrent = activeQuestionStatement === q.statement;
                                            const isQAnswered = answers[q.id] !== undefined;
                                            const isSkipped = skippedQuestions.has(q.id);

                                            let badgeCls = "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 hover:text-gray-700";
                                            if (isCurrent) {
                                                badgeCls = "bg-indigo-50 text-indigo-700 border-indigo-500 font-black ring-2 ring-indigo-500/10";
                                            } else if (isQAnswered) {
                                                badgeCls = "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 hover:text-emerald-800";
                                            } else if (isSkipped) {
                                                badgeCls = "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100 hover:text-amber-800";
                                            }

                                            return (
                                                <button
                                                    key={q.id}
                                                    onClick={() => {
                                                        setActiveQuestionStatement(q.statement);
                                                        setShowDropdown(false);
                                                        setTimeout(() => {
                                                            const container = document.getElementById(`question-container-${q.id}`);
                                                            if (container) {
                                                                container.scrollIntoView({ behavior: "smooth", block: "center" });
                                                            }
                                                        }, 100);
                                                    }}
                                                    className={`w-8 h-8 rounded-lg border text-xs font-bold transition flex items-center justify-center cursor-pointer ${badgeCls}`}
                                                >
                                                    {idx + 1}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
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
                    <div className="space-y-3 mt-7">
                        {/* Primary actions row: Up to 2 main buttons side by side */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                            {nextUnitUrl ? (
                                <>
                                    {score.correct < score.total ? (
                                        <button onClick={() => {
                                            const failed = questions.filter(q => answers[q.id] !== q.correctOption);
                                            setQuestions(shuffleQuestions(failed));
                                            setAnswers({});
                                            setSubmitted(false);
                                            setScore({ correct: 0, total: 0 });
                                            localStorage.removeItem(storageKey);
                                            window.scrollTo({ top: 0, behavior: "smooth" });
                                        }} className="w-full px-5 py-3 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2">
                                            <AlertTriangle className="w-4 h-4" /> Repetir falladas ({score.total - score.correct})
                                        </button>
                                    ) : (
                                        <button onClick={() => {
                                            setQuestions(shuffleQuestions(initialQuestions));
                                            setAnswers({});
                                            setSubmitted(false);
                                            setScore({ correct: 0, total: 0 });
                                            localStorage.removeItem(storageKey);
                                            window.scrollTo({ top: 0, behavior: "smooth" });
                                        }} className="w-full px-5 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2">
                                            <RotateCcw className="w-4 h-4" /> Repetir simulacro
                                        </button>
                                    )}
                                    <Link href={nextUnitUrl} className="w-full px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-95 duration-200">
                                        Siguiente Unidad <ArrowRight className="w-4 h-4" />
                                    </Link>
                                </>
                            ) : (
                                <>
                                    {score.correct < score.total ? (
                                        <>
                                            <button onClick={() => {
                                                const failed = questions.filter(q => answers[q.id] !== q.correctOption);
                                                setQuestions(shuffleQuestions(failed));
                                                setAnswers({});
                                                setSubmitted(false);
                                                setScore({ correct: 0, total: 0 });
                                                localStorage.removeItem(storageKey);
                                                window.scrollTo({ top: 0, behavior: "smooth" });
                                            }} className="w-full px-5 py-3 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2">
                                                <AlertTriangle className="w-4 h-4" /> Repetir falladas ({score.total - score.correct})
                                            </button>
                                            <button onClick={() => {
                                                setQuestions(shuffleQuestions(initialQuestions));
                                                setAnswers({});
                                                setSubmitted(false);
                                                setScore({ correct: 0, total: 0 });
                                                localStorage.removeItem(storageKey);
                                                window.scrollTo({ top: 0, behavior: "smooth" });
                                            }} className="w-full px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2">
                                                <RotateCcw className="w-4 h-4" /> Repetir simulacro
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={() => {
                                            setQuestions(shuffleQuestions(initialQuestions));
                                            setAnswers({});
                                            setSubmitted(false);
                                            setScore({ correct: 0, total: 0 });
                                            localStorage.removeItem(storageKey);
                                            window.scrollTo({ top: 0, behavior: "smooth" });
                                        }} className="w-full px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2">
                                            <RotateCcw className="w-4 h-4" /> Repetir simulacro
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

                            {nextUnitUrl && score.correct < score.total && (
                                <button onClick={() => {
                                    setQuestions(shuffleQuestions(initialQuestions));
                                    setAnswers({});
                                    setSubmitted(false);
                                    setScore({ correct: 0, total: 0 });
                                    localStorage.removeItem(storageKey);
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                }} className="w-full sm:w-auto min-w-[140px] px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 font-semibold rounded-xl text-xs border border-gray-200 transition flex items-center justify-center gap-1.5">
                                    <RotateCcw className="w-3.5 h-3.5" /> Repetir simulacro
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Questions */}
            {questions.map((q, qi) => {
                const opts = [q.optionA, q.optionB, q.optionC, q.optionD];
                const isActive = activeQuestionStatement === q.statement;
                return (
                    <div
                        key={q.id}
                        id={`question-container-${q.id}`}
                        onClick={() => setActiveQuestionStatement(q.statement)}
                        className={`bg-white border rounded-2xl p-8 transition-all duration-300 scroll-mt-24 ${
                            isActive
                                ? "border-indigo-400 ring-2 ring-indigo-500/10 shadow-lg shadow-indigo-500/5"
                                : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                        <div className="flex items-start gap-5 mb-7">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-black text-sm transition-colors ${
                                isActive ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-700"
                            }`}>
                                {qi + 1}
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="text-[15px] font-bold text-gray-800 leading-snug pt-1.5">
                                    <FormattedStatement text={q.statement} />
                                </div>
                                {q.image && (
                                    <div className="relative rounded-2xl overflow-hidden border border-gray-100 max-w-full sm:max-w-md bg-gray-50">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={q.image} alt="Question supplement" className="w-full h-auto object-contain" />
                                    </div>
                                )}
                            </div>
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

                        {isActive && !submitted && (
                            <div className="mt-5 pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-300">
                                <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                                    Puedes usar <kbd className="px-1.5 py-0.5 bg-gray-50 border border-gray-200 rounded font-mono text-[9px] text-gray-500 shadow-sm">Espacio</kbd> para saltar esta pregunta.
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        advanceFrom(qi, answers, true);
                                    }}
                                    className="px-4 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition flex items-center gap-1.5 self-end sm:self-auto cursor-pointer font-sans"
                                >
                                    Saltar pregunta
                                </button>
                            </div>
                        )}

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
            {/* AI Theory Chat */}
            <TheoryChat
                subject={subject}
                currentQuestion={activeQuestionStatement || questions[0]?.statement}
                isOpen={isChatOpen}
                onOpenChange={setIsChatOpen}
                showFloatingButton={showChatButton}
            />
        </div>
    );
}
