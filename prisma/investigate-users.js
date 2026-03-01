const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        include: {
            _count: {
                select: { questions: true }
            }
        }
    });

    console.log("Users and their question counts:");
    users.forEach(u => {
        console.log(`- ${u.name || 'No Name'} (${u.email}) [Role: ${u.role}] [ID: ${u.id}]: ${u._count.questions} questions`);
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
