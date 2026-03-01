const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // 1. Who owns the questions?
    const someQuestion = await prisma.question.findFirst();
    if (!someQuestion) {
        console.log("No questions found.");
        return;
    }

    // 2. What is the role of that owner?
    const ownerId = someQuestion.userId;
    const owner = await prisma.user.findUnique({ where: { id: ownerId } });

    console.log(`Owner of questions is: ${owner.email} with Role: ${owner.role}`);

    // 3. Fix the role if it's not ADMIN
    if (owner.role !== "ADMIN") {
        console.log("Updating owner to ADMIN so their questions appear in the public bank...");
        await prisma.user.update({
            where: { id: owner.id },
            data: { role: "ADMIN" }
        });
        console.log("User updated to ADMIN successfully.");
    } else {
        console.log("Owner is already ADMIN. The issue might be elsewhere.");
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
