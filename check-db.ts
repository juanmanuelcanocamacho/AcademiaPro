import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const latestQuestions = await prisma.question.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10
    })
    console.log(latestQuestions.map(q => ({
        statement: q.statement,
        correctOption: q.correctOption,
    })))
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
