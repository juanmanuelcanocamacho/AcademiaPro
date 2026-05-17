"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, Send, Sparkles, X, Loader2, Bot, User, ChevronRight } from "lucide-react";

interface Message {
    role: "user" | "assistant";
    content: string;
}

const parseInlineStyles = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, idx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            const rawText = part.slice(2, -2);
            return <strong key={idx} className="font-extrabold text-gray-900">{rawText}</strong>;
        }
        return part;
    });
};

const renderMarkdown = (content: string) => {
    if (!content) return null;

    const lines = content.split("\n");
    return lines.map((line, i) => {
        let trimmed = line.trim();

        // Robust headers checking (### Title or ###Title###)
        if (trimmed.startsWith("###")) {
            let text = trimmed.replace(/^###\s*/, "");
            text = text.replace(/\s*###$/, "");
            return (
                <h4 key={i} className="text-xs font-black text-gray-900 mt-4 mb-2 first:mt-0 leading-tight">
                    {parseInlineStyles(text)}
                </h4>
            );
        }
        if (trimmed.startsWith("####")) {
            let text = trimmed.replace(/^####\s*/, "");
            text = text.replace(/\s*####$/, "");
            return (
                <h5 key={i} className="text-[11px] font-black text-gray-800 mt-3 mb-1.5 leading-tight">
                    {parseInlineStyles(text)}
                </h5>
            );
        }

        // Bullet lists
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
            const text = trimmed.substring(2);
            return (
                <div key={i} className="flex items-start gap-1.5 ml-1 my-1 text-gray-700">
                    <span className="text-indigo-500 font-bold shrink-0 mt-0.5">•</span>
                    <span className="text-xs font-medium leading-relaxed">{parseInlineStyles(text)}</span>
                </div>
            );
        }

        // Numbered lists
        if (/^\d+\.\s/.test(trimmed)) {
            const match = trimmed.match(/^(\d+)\.\s(.*)/);
            if (match) {
                const num = match[1];
                const text = match[2];
                return (
                    <div key={i} className="flex items-start gap-1.5 ml-1 my-1 text-gray-700">
                        <span className="text-indigo-600 font-bold shrink-0 text-xs mt-0.5">{num}.</span>
                        <span className="text-xs font-medium leading-relaxed">{parseInlineStyles(text)}</span>
                    </div>
                );
            }
        }

        // Empty line spacer
        if (trimmed === "") {
            return <div key={i} className="h-2 shrink-0" />;
        }

        // Standard paragraph
        return (
            <p key={i} className="text-xs font-medium text-gray-700 leading-relaxed mb-1.5 last:mb-0">
                {parseInlineStyles(trimmed)}
            </p>
        );
    });
};

export default function TheoryChat({ subject, currentQuestion }: { subject: string; currentQuestion?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const [hasTheory, setHasTheory] = useState<boolean | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const prevQuestionRef = useRef<string | undefined>(undefined);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    // Fetch suggestions when the current question changes
    const fetchSuggestions = useCallback(async (question: string) => {
        setLoadingSuggestions(true);
        try {
            const res = await fetch("/api/theory-suggest", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subject, currentQuestion: question }),
            });
            const data = await res.json();
            if (data.suggestions?.length > 0) {
                setSuggestions(data.suggestions);
                setHasTheory(true);
            } else {
                setSuggestions([]);
            }
        } catch {
            setSuggestions([]);
        } finally {
            setLoadingSuggestions(false);
        }
    }, [subject]);

    useEffect(() => {
        if (currentQuestion && currentQuestion !== prevQuestionRef.current && isOpen) {
            prevQuestionRef.current = currentQuestion;
            fetchSuggestions(currentQuestion);
        }
    }, [currentQuestion, isOpen, fetchSuggestions]);

    // When panel opens for the first time, fetch suggestions
    useEffect(() => {
        if (isOpen && currentQuestion && suggestions.length === 0 && !loadingSuggestions && hasTheory === null) {
            fetchSuggestions(currentQuestion);
        }
    }, [isOpen, currentQuestion, suggestions.length, loadingSuggestions, hasTheory, fetchSuggestions]);

    const sendMessage = async (text: string) => {
        if (!text.trim() || isLoading) return;

        const userMessage: Message = { role: "user", content: text.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/theory-chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject,
                    question: text.trim(),
                    currentQuestion,
                }),
            });

            if (!res.ok) {
                throw new Error("Error en la respuesta");
            }

            // Stream the response
            const reader = res.body?.getReader();
            const decoder = new TextDecoder();
            let assistantContent = "";

            setMessages(prev => [...prev, { role: "assistant", content: "" }]);

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    assistantContent += chunk;

                    setMessages(prev => {
                        const updated = [...prev];
                        updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                        return updated;
                    });
                }
            }

            if (assistantContent.includes("No hay teoría disponible")) {
                setHasTheory(false);
            } else {
                setHasTheory(true);
            }
        } catch (error) {
            setMessages(prev => [
                ...prev,
                { role: "assistant", content: "Error al conectar con la IA. Inténtalo de nuevo." },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    return (
        <>
            {/* Floating button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl group ${
                    isOpen
                        ? "bg-gray-900 text-white shadow-gray-900/30"
                        : "bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-indigo-500/30"
                }`}
                title="Asistente de Teoría IA"
            >
                {isOpen ? (
                    <X className="w-5 h-5" />
                ) : (
                    <>
                        <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        {/* Notification dot */}
                        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
                    </>
                )}
            </button>

            {/* Chat panel */}
            <div
                className={`fixed top-0 right-0 h-[100dvh] w-[380px] max-w-[90vw] bg-white border-l border-gray-200 shadow-2xl z-50 flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50/80 to-sky-50/80 shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-sky-500 rounded-xl flex items-center justify-center shadow-md shadow-indigo-500/20">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-gray-900">Asistente IA</h3>
                                <p className="text-[10px] text-gray-500 font-medium">{subject}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 hover:bg-white/80 rounded-xl transition text-gray-400 hover:text-gray-700"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
                    {messages.length === 0 && (
                        <div className="text-center py-12 px-4">
                            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <MessageSquare className="w-8 h-8 text-indigo-400" />
                            </div>
                            <h4 className="text-sm font-bold text-gray-800 mb-1">¿Dudas con la teoría?</h4>
                            <p className="text-xs text-gray-400 leading-relaxed max-w-[240px] mx-auto">
                                {hasTheory === false
                                    ? "No hay teoría disponible para esta asignatura. Sube PDFs de teoría desde Importar → Teoría (PDF)."
                                    : "Pregúntame cualquier cosa sobre la materia y buscaré la respuesta en tus apuntes."
                                }
                            </p>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                                msg.role === "user" ? "justify-end" : "justify-start"
                            }`}
                        >
                            {msg.role === "assistant" && (
                                <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-sky-500 rounded-lg flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                    <Bot className="w-3.5 h-3.5 text-white" />
                                </div>
                            )}
                            <div
                                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                    msg.role === "user"
                                        ? "bg-indigo-600 text-white rounded-br-md shadow-md shadow-indigo-600/20"
                                        : "bg-gray-100 text-gray-800 rounded-bl-md"
                                }`}
                            >
                                {msg.role === "assistant" ? (
                                    msg.content ? (
                                        renderMarkdown(msg.content)
                                    ) : (
                                        <div className="flex items-center gap-1.5 py-1">
                                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                                        </div>
                                    )
                                ) : (
                                    msg.content
                                )}
                            </div>
                            {msg.role === "user" && (
                                <div className="w-7 h-7 bg-gray-200 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                                    <User className="w-3.5 h-3.5 text-gray-500" />
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Suggestions */}
                {suggestions.length > 0 && !isLoading && (
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/80 shrink-0">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> Preguntas sugeridas
                        </p>
                        <div className="flex flex-col gap-1.5">
                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => sendMessage(s)}
                                    className="text-left text-xs font-medium text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 transition-all flex items-center gap-2 group"
                                >
                                    <ChevronRight className="w-3 h-3 text-indigo-400 group-hover:translate-x-0.5 transition-transform shrink-0" />
                                    <span className="line-clamp-1">{s}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {loadingSuggestions && !isLoading && messages.length === 0 && (
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/80 shrink-0">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Cargando sugerencias...
                        </div>
                    </div>
                )}

                {/* Input */}
                <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-gray-100 bg-white shrink-0">
                    <div className="flex items-center gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Pregunta sobre la teoría..."
                            disabled={isLoading}
                            className="flex-1 bg-gray-100 text-sm font-medium text-gray-800 placeholder:text-gray-400 rounded-xl px-4 py-3 border-0 outline-none focus:ring-2 focus:ring-indigo-500/30 transition disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 text-white disabled:text-gray-400 rounded-xl flex items-center justify-center transition-all shrink-0 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20 disabled:shadow-none"
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {/* Overlay on mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
}
