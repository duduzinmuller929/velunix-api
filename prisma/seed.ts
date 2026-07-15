import { PlanName, UserRole } from './generated/enums';
import { prisma } from '../src/plugins/prisma';

const roles = [
    UserRole.CEO,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.MODERATOR,
    UserRole.SUPPORT,
    UserRole.USER,
] as const;

const plans = [
    {
        name: PlanName.FREE,
        price: 0,
        dailyRequests: 50,
        storageLimit: 1024,
        maxConversations: 3,
        maxAssistants: 1,
        maxUploads: 10,
        maxImages: 10,
        maxAudioMinutes: 120,
        maxTokensPerDay: 100000,
        maxStoragePerFile: 10,
        prioritySupport: false,
        teamMembers: 1,
        apiAccess: false,
        customBranding: false,
        voiceEnabled: false,
    },
    {
        name: PlanName.STARTER,
        price: 29.9,
        dailyRequests: 500,
        storageLimit: 10240,
        maxConversations: 10,
        maxAssistants: 3,
        maxUploads: 100,
        maxImages: 100,
        maxAudioMinutes: 600,
        maxTokensPerDay: 1000000,
        maxStoragePerFile: 50,
        prioritySupport: false,
        teamMembers: 3,
        apiAccess: true,
        customBranding: false,
        voiceEnabled: true,
    },
    {
        name: PlanName.PRO,
        price: 59.9,
        dailyRequests: 2500,
        storageLimit: 51200,
        maxConversations: 50,
        maxAssistants: 10,
        maxUploads: 500,
        maxImages: 500,
        maxAudioMinutes: 1800,
        maxTokensPerDay: 5000000,
        maxStoragePerFile: 100,
        prioritySupport: true,
        teamMembers: 10,
        apiAccess: true,
        customBranding: true,
        voiceEnabled: true,
    },
    {
        name: PlanName.BUSINESS,
        price: 119.9,
        dailyRequests: 10000,
        storageLimit: 204800,
        maxConversations: 200,
        maxAssistants: 50,
        maxUploads: 2000,
        maxImages: 2000,
        maxAudioMinutes: 7200,
        maxTokensPerDay: 20000000,
        maxStoragePerFile: 500,
        prioritySupport: true,
        teamMembers: 100,
        apiAccess: true,
        customBranding: true,
        voiceEnabled: true,
    },
    {
        name: PlanName.ENTERPRISE,
        price: 299.9,
        dailyRequests: 50000,
        storageLimit: 1048576,
        maxConversations: null,
        maxAssistants: null,
        maxUploads: null,
        maxImages: null,
        maxAudioMinutes: null,
        maxTokensPerDay: null,
        maxStoragePerFile: 2048,
        prioritySupport: true,
        teamMembers: null,
        apiAccess: true,
        customBranding: true,
        voiceEnabled: true,
    },
] as const;

async function main() {
    for (const name of roles) {
        await prisma.role.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }

    for (const plan of plans) {
        const existingPlan = await prisma.plan.findFirst({
            where: { name: plan.name },
            select: { id: true },
        });

        if (existingPlan) {
            await prisma.plan.update({
                where: { id: existingPlan.id },
                data: plan,
            });
            continue;
        }

        await prisma.plan.create({ data: plan });
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (error) => {
        console.error(error);
        await prisma.$disconnect();
        process.exit(1);
    });
