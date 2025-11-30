import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export const config = {
  runtime: "nodejs",
};

const prisma = new PrismaClient();

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password, userName } = req.body;

    if (!email || !password || !userName) {
      return res.status(400).json({ error: "Dados incompletos" });
    }

    const emailExists = await prisma.user.findUnique({
      where: { email },
    });

    if (emailExists) {
      return res.status(409).json({ error: "Email já está em uso" });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        UserName: userName,
      },
    });

    return res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      userName: newUser.UserName,
    });

  } catch (err) {
    console.error("Erro no register:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
