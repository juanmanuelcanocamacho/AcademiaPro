"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/../auth";

// --- Types ---

export type TopicProgress = {
    topic: string | null;
    bestScore: number;
    lastScore: number;
    attempts: number;
    lastAttemptAt: Date | null;
    status: "passed" | "failed" | "not_started";
};

export type SubjectProgress = {
    subject: string;
    topics: TopicProgress[];
    overallBestScore: number;
    totalAttempts: number;
    passedTopics: number;
    totalTopics: number;
};

const PASS_THRESHOLD = 50.0; // 50%

// --- Save an exam attempt ---

export async function saveExamAttempt(data: {
    subject: string;
    topic: string | null;
    score: number;
    correct: number;
    total: number;
    mode: string;
    duration?: number;
}) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "No autorizado" };

        await prisma.examAttempt.create({
            data: {
                userId: session.user.id,
                subject: data.subject,
                topic: data.topic || null,
                score: data.score,
                correct: data.correct,
                total: data.total,
                mode: data.mode,
                duration: data.duration || null,
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Error saving exam attempt:", error);
        return { success: false, error: "Error al guardar el intento" };
    }
}

// --- Get progress grouped by subject and topic ---

export async function getProgressBySubject(): Promise<{ success: boolean; progress?: SubjectProgress[] }> {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false };

        // Get all attempts for this user
        const attempts = await prisma.examAttempt.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
        });

        // Get all subjects and topics the user has questions for
        const questionMeta = await prisma.question.findMany({
            where: { userId: session.user.id },
            select: { subject: true, topic: true },
            distinct: ["subject", "topic"],
        });

        // Build a map of subject -> topics (from questions)
        const subjectTopicsMap = new Map<string, Set<string>>();
        questionMeta.forEach((q) => {
            if (!subjectTopicsMap.has(q.subject)) subjectTopicsMap.set(q.subject, new Set());
            if (q.topic) subjectTopicsMap.get(q.subject)!.add(q.topic);
        });

        // Build progress for each subject
        const progress: SubjectProgress[] = [];

        for (const [subject, topicsSet] of subjectTopicsMap.entries()) {
            const subjectAttempts = attempts.filter((a) => a.subject === subject);
            const topics = Array.from(topicsSet).sort((a, b) =>
                a.localeCompare(b, undefined, { numeric: true })
            );

            const topicProgressList: TopicProgress[] = topics.map((topic) => {
                const topicAttempts = subjectAttempts.filter((a) => a.topic === topic);

                if (topicAttempts.length === 0) {
                    return {
                        topic,
                        bestScore: 0,
                        lastScore: 0,
                        attempts: 0,
                        lastAttemptAt: null,
                        status: "not_started" as const,
                    };
                }

                const bestScore = Math.max(...topicAttempts.map((a) => a.score));
                const lastScore = topicAttempts[0].score; // Already sorted desc by createdAt
                const lastAttemptAt = topicAttempts[0].createdAt;

                return {
                    topic,
                    bestScore,
                    lastScore,
                    attempts: topicAttempts.length,
                    lastAttemptAt,
                    status: bestScore >= PASS_THRESHOLD ? ("passed" as const) : ("failed" as const),
                };
            });

            const passedTopics = topicProgressList.filter((t) => t.status === "passed").length;
            const allScores = topicProgressList
                .filter((t) => t.attempts > 0)
                .map((t) => t.bestScore);
            const overallBestScore =
                allScores.length > 0
                    ? allScores.reduce((sum, s) => sum + s, 0) / allScores.length
                    : 0;

            progress.push({
                subject,
                topics: topicProgressList,
                overallBestScore,
                totalAttempts: subjectAttempts.length,
                passedTopics,
                totalTopics: topics.length,
            });
        }

        // Sort subjects alphabetically
        progress.sort((a, b) =>
            a.subject.localeCompare(b.subject, undefined, { numeric: true })
        );

        return { success: true, progress };
    } catch (error) {
        console.error("Error fetching progress:", error);
        return { success: false };
    }
}

// --- Get global stats for the progress dashboard ---

export async function getGlobalStats() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false };

        const attempts = await prisma.examAttempt.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
        });

        // Total attempts
        const totalAttempts = attempts.length;

        // Average score (of best scores per topic)
        const topicBests = new Map<string, number>();
        attempts.forEach((a) => {
            const key = `${a.subject}::${a.topic || "__all__"}`;
            const current = topicBests.get(key) || 0;
            if (a.score > current) topicBests.set(key, a.score);
        });
        const bestScores = Array.from(topicBests.values());
        const avgScore =
            bestScores.length > 0
                ? bestScores.reduce((s, v) => s + v, 0) / bestScores.length
                : 0;

        // Passed topics count
        const passedCount = bestScores.filter((s) => s >= PASS_THRESHOLD).length;

        // Study streak (consecutive days with at least 1 attempt)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const uniqueDays = new Set<string>();
        attempts.forEach((a) => {
            const d = new Date(a.createdAt);
            uniqueDays.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
        });

        let streak = 0;
        const checkDate = new Date(today);
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
            if (uniqueDays.has(key)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        // Activity heatmap (last 365 days)
        const heatmap: Record<string, number> = {};
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 364);

        attempts.forEach((a) => {
            const d = new Date(a.createdAt);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            heatmap[key] = (heatmap[key] || 0) + 1;
        });

        return {
            success: true,
            stats: {
                totalAttempts,
                avgScore: Math.round(avgScore * 10) / 10,
                passedCount,
                totalTopics: topicBests.size,
                streak,
                heatmap,
            },
        };
    } catch (error) {
        console.error("Error fetching global stats:", error);
        return { success: false };
    }
}

// --- Reset progress for a specific subject ---

export async function resetSubjectProgress(subject: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "No autorizado" };

        await prisma.examAttempt.deleteMany({
            where: {
                userId: session.user.id,
                subject,
            },
        });

        return { success: true };
    } catch (error) {
        console.error("Error resetting subject progress:", error);
        return { success: false, error: "Error al reiniciar el progreso" };
    }
}

// --- Reset all progress ---

export async function resetAllProgress() {
    try {
        const session = await auth();
        if (!session?.user?.id) return { success: false, error: "No autorizado" };

        await prisma.examAttempt.deleteMany({
            where: { userId: session.user.id },
        });

        return { success: true };
    } catch (error) {
        console.error("Error resetting all progress:", error);
        return { success: false, error: "Error al reiniciar toda la trayectoria" };
    }
}
