// server.js

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import productosRoutes from "./routes/productos.js";
import authRoutes from "./routes/auth.js";
import usuarioRoutes from "./routes/usuario.js";
import adminRoutes from "./routes/admin.js";
import pedidoRoutes from "./routes/pedido.js"

// ============================
// CONFIGURACIÓN INICIAL
// ============================

dotenv.config();



const app = express(); 

// Para poder usar __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================
// MIDDLEWARES
// ============================

app.use(cors());
app.use(express.json());

// Servir carpeta uploads (IMÁGENES)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ============================
// CONEXIÓN A MONGODB
// ============================

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log(" Conectado a MongoDB"))
  .catch(err => console.error(" Error de conexión:", err));

// ============================
// RUTAS
// ============================

app.use("/api/admin", adminRoutes);
app.use("/api/productos", productosRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/usuario", usuarioRoutes);
app.use("/api/pedidos", pedidoRoutes);

// ============================
// SERVIDOR
// ============================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(` Servidor en http://localhost:${PORT}`);
});
