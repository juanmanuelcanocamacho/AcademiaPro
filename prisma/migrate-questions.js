const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log("Starting migration...");

    // Find the first user
    const admin = await prisma.user.findFirst();

    if (!admin) {
        console.log("No user found! Create an account first.");
        return;
    }

    console.log(`Found ADMIN user: ${admin.email} (${admin.id})`);

    // Assign all questions with no userId to this admin
    const result = await prisma.question.updateMany({
        where: { userId: null },
        data: { userId: admin.id }
    });

    console.log(`Successfully migrated ${result.count} questions to the Admin.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
