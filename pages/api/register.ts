import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email e senha são obrigatórios" });
    }

    // Verificar se o Prisma Client está inicializado corretamente
    if (!prisma) {
      console.error("Prisma Client não está inicializado");
      return res.status(500).json({ error: "Erro de configuração do banco de dados" });
    }

    // Debug: verificar se o modelo user existe
    console.log("Prisma Client keys:", Object.keys(prisma));
    console.log("Prisma user exists:", 'user' in prisma);

    // Verificar se o usuário já existe
    const existingUser = await (prisma as any).user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: "Usuário já existe" });
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar usuário
    const user = await (prisma as any).user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
      },
    });

    return res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
    });
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    return res.status(500).json({ error: "Erro ao registrar usuário" });
  }
}

