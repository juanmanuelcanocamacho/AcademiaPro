"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { GraduationCap, ArrowRight, BrainCircuit, FileSearch, LineChart, Sparkles, BookOpen } from "lucide-react";
import type { Session } from "next-auth";

interface LandingClientProps {
    session: Session | null;
}

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

export default function LandingClient({ session }: LandingClientProps) {
    const isLoggedIn = !!session?.user;

    return (
        <div className="min-h-screen bg-[#0A0A0B] text-white selection:bg-indigo-500/30 overflow-hidden relative">

            {/* Ambient Background Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />

            {/* Navigation Bar */}
            <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500 flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">Testly</span>
                    </div>
                    <div>
                        {isLoggedIn ? (
                            <Link
                                href="/exam"
                                className="text-sm font-medium bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full transition-all"
                            >
                                Ir a la app
                            </Link>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                                    Iniciar Sesión
                                </Link>
                                <Link
                                    href="/register"
                                    className="text-sm font-medium bg-white text-black hover:bg-gray-100 px-5 py-2.5 rounded-full transition-all"
                                >
                                    Comenzar Gratis
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="pt-32 pb-20 px-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={staggerContainer}
                        className="flex flex-col items-center text-center max-w-4xl mx-auto pt-10"
                    >
                        <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium mb-8">
                            <Sparkles className="w-4 h-4" />
                            <span>La nueva forma de aprobar exámenes</span>
                        </motion.div>

                        <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-black tracking-tighter leading-[1.1] mb-6 text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-gray-400">
                            Estudia de forma <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                                inteligente, no duro.
                            </span>
                        </motion.h1>

                        <motion.p variants={fadeInUp} className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl leading-relaxed">
                            Testly te permite practicar con bancos de preguntas reales, hacer simulacros, y enfocarte en las preguntas que más fallas para garantizar tu aprobado.
                        </motion.p>

                        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center gap-4">
                            {isLoggedIn ? (
                                <Link
                                    href="/exam"
                                    className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white px-8 py-4 rounded-full font-bold text-lg transition-colors group"
                                >
                                    Continuar Estudiando
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href="/register"
                                        className="flex items-center gap-2 bg-white hover:bg-gray-100 text-black px-8 py-4 rounded-full font-bold text-lg transition-colors group"
                                    >
                                        Crear cuenta gratis
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                    <Link
                                        href="#features"
                                        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-8 py-4 rounded-full font-bold text-lg transition-colors"
                                    >
                                        Ver ventajas
                                    </Link>
                                </>
                            )}
                        </motion.div>
                    </motion.div>

                    {/* Bento Grid Features */}
                    <motion.div
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-100px" }}
                        variants={staggerContainer}
                        id="features"
                        className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-6"
                    >
                        <motion.div variants={fadeInUp} className="col-span-1 md:col-span-2 bg-[#121214] border border-white/5 rounded-3xl p-8 md:p-12 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-100 transition-opacity">
                                <BrainCircuit className="w-32 h-32 text-indigo-500" />
                            </div>
                            <div className="relative z-10 w-full md:w-2/3">
                                <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6">
                                    <BrainCircuit className="w-6 h-6 text-indigo-400" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">Repite solo lo que fallas</h3>
                                <p className="text-gray-400 leading-relaxed">
                                    Nuestro algoritmo detecta tus puntos débiles. Cuando terminas un simulacro, puedes generar un examen exprés exclusivamente con las preguntas que has fallado para reforzar ese conocimiento inmediatamente.
                                </p>
                            </div>
                        </motion.div>

                        <motion.div variants={fadeInUp} className="col-span-1 bg-[#121214] border border-white/5 rounded-3xl p-8 md:p-12 relative overflow-hidden">
                            <div className="w-12 h-12 bg-pink-500/20 rounded-2xl flex items-center justify-center mb-6">
                                <LineChart className="w-6 h-6 text-pink-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-4">Analíticas de Progreso</h3>
                            <p className="text-gray-400 leading-relaxed text-sm">
                                Visualiza cuántos exámenes has completado, tu nota media por asignatura y monitoriza tu tendencia antes del día de la prueba.
                            </p>
                        </motion.div>

                        <motion.div variants={fadeInUp} className="col-span-1 bg-[#121214] border border-white/5 rounded-3xl p-8 md:p-12 relative overflow-hidden">
                            <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6">
                                <FileSearch className="w-6 h-6 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold mb-4">Importador de PDFs</h3>
                            <p className="text-gray-400 leading-relaxed text-sm">
                                (Modo Admin). Sube exámenes oficiales en PDF y nuestro sistema extraerá mágicamente las preguntas y respuestas al banco de datos.
                            </p>
                        </motion.div>

                        <motion.div variants={fadeInUp} className="col-span-1 md:col-span-2 bg-[#121214] border border-white/5 rounded-3xl p-8 md:p-12 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10 w-full md:w-2/3">
                                <div className="w-12 h-12 bg-violet-500/20 rounded-2xl flex items-center justify-center mb-6">
                                    <BookOpen className="w-6 h-6 text-violet-400" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4">Múltiples Asignaturas</h3>
                                <p className="text-gray-400 leading-relaxed">
                                    Organiza tus test por asignatura y etiquetas. Filtra por los bloques temáticos que más te cuestan y realiza test específicos de hasta 100 preguntas por intento.
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 mt-20 relative z-10 selection:bg-indigo-500/30">
                <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-gray-500" />
                        <span className="font-semibold text-gray-400">Testly</span>
                    </div>
                    <p className="text-sm text-gray-500">
                        &copy; 2026 Testly. Todos los derechos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
}
