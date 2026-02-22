import jwt from "jsonwebtoken";

// ============================
// AUTENTICACIÓN GENERAL
// ============================
export function authMiddleware(req, res, next) {

  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token requerido" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Guardamos toda la info del token
    req.usuario = {
      id: decoded.id,
      rol: decoded.rol
    };

    next();

  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }
}


// ============================
// SOLO ADMIN
// ============================
export function adminMiddleware(req, res, next) {

  if (!req.usuario || req.usuario.rol !== "admin") {
    return res.status(403).json({
      message: "Acceso denegado: no eres administrador"
    });
  }

  next();
}
