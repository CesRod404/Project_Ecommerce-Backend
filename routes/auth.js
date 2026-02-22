// routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";

const router = express.Router();

// Registro de usuario
router.post("/register", async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    // Verificar si ya existe
    const existe = await Usuario.findOne({ email });
    if (existe) return res.status(400).json({ message: "El email ya está registrado" });

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = new Usuario({ nombre, email, password: hashedPassword });
    await nuevoUsuario.save();

    res.json({ message: "Usuario registrado correctamente" });
  } catch (err) {
    res.status(500).json({ message: "Error en el registro", error: err.message });
  }
});

// Login de usuario
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(400).json({ message: "Usuario no encontrado" });

    const esValido = await bcrypt.compare(password, usuario.password);
    if (!esValido) return res.status(401).json({ message: "Credenciales inválidas" });


    const token = jwt.sign(
      { id: usuario._id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login exitoso", 
      token,
      usuario:{
        id: usuario._id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      } 
    });
  } catch (err) {
    res.status(500).json({ message: "Error en el login", error: err.message });
  }
});

export default router;
