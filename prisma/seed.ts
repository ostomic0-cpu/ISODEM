import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const modules = ["dashboard", "folders", "documents", "audits", "capas"];

async function main() {
  const roles = await Promise.all([
    prisma.role.upsert({
      where: { name: "Admin" },
      update: { description: "ผู้ดูแลระบบทั้งหมด" },
      create: { name: "Admin", description: "ผู้ดูแลระบบทั้งหมด" },
    }),
    prisma.role.upsert({
      where: { name: "QA" },
      update: { description: "ทีมประกันคุณภาพ" },
      create: { name: "QA", description: "ทีมประกันคุณภาพ" },
    }),
    prisma.role.upsert({
      where: { name: "Engineer" },
      update: { description: "ผู้ใช้งานฝ่ายวิศวกรรม" },
      create: { name: "Engineer", description: "ผู้ใช้งานฝ่ายวิศวกรรม" },
    }),
  ]);

  const roleByName = Object.fromEntries(roles.map((role) => [role.name, role]));
  const matrix: Record<string, Record<string, string[]>> = {
    Admin: Object.fromEntries(modules.map((module) => [module, ["read", "write", "approve", "delete"]])),
    QA: {
      dashboard: ["read"],
      folders: ["read", "write"],
      documents: ["read", "write", "approve"],
      audits: ["read", "write", "approve"],
      capas: ["read", "write", "approve"],
    },
    Engineer: {
      dashboard: ["read"],
      folders: ["read"],
      documents: ["read", "write-own"],
      audits: ["read"],
      capas: ["read"],
    },
  };

  for (const [roleName, permissionsByModule] of Object.entries(matrix)) {
    for (const [module, actions] of Object.entries(permissionsByModule)) {
      for (const action of actions) {
        await prisma.permission.upsert({
          where: {
            module_action_roleId: {
              module,
              action,
              roleId: roleByName[roleName].id,
            },
          },
          update: {},
          create: {
            module,
            action,
            roleId: roleByName[roleName].id,
          },
        });
      }
    }
  }

  const adminHash = await bcrypt.hash("Admin123!", 12);
  const qaHash = await bcrypt.hash("Qa123!", 12);
  const engineerHash = await bcrypt.hash("Engineer123!", 12);

  await prisma.user.upsert({
    where: { email: "admin@qms.local" },
    update: {
      passwordHash: adminHash,
      name: "ผู้ดูแลระบบ",
      department: "คุณภาพ",
      roleId: roleByName.Admin.id,
    },
    create: {
      email: "admin@qms.local",
      passwordHash: adminHash,
      name: "ผู้ดูแลระบบ",
      department: "คุณภาพ",
      roleId: roleByName.Admin.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "qa@qms.local" },
    update: {
      passwordHash: qaHash,
      name: "เจ้าหน้าที่ QA",
      department: "คุณภาพ",
      roleId: roleByName.QA.id,
    },
    create: {
      email: "qa@qms.local",
      passwordHash: qaHash,
      name: "เจ้าหน้าที่ QA",
      department: "คุณภาพ",
      roleId: roleByName.QA.id,
    },
  });

  await prisma.user.upsert({
    where: { email: "engineer@qms.local" },
    update: {
      passwordHash: engineerHash,
      name: "วิศวกรทดสอบ",
      department: "วิศวกรรม",
      roleId: roleByName.Engineer.id,
    },
    create: {
      email: "engineer@qms.local",
      passwordHash: engineerHash,
      name: "วิศวกรทดสอบ",
      department: "วิศวกรรม",
      roleId: roleByName.Engineer.id,
    },
  });

  await prisma.folder.upsert({
    where: { id: "root-folder" },
    update: { name: "เอกสารหลัก" },
    create: { id: "root-folder", name: "เอกสารหลัก" },
  });
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
