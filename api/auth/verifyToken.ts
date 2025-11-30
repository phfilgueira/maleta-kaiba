import jwt from "jsonwebtoken";

export function verifyToken(req: any, res: any) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: "Token não enviado" });
    return null;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    return decoded; // retorna { userId, email }
  } catch (err) {
    res.status(401).json({ error: "Token inválido" });
    return null;
  }
}
