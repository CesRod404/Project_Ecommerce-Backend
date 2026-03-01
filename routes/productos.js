// routes/productos.js
import express from "express";
import Producto from "../models/Producto.js";
import { authMiddleware, adminMiddleware } from "../middlewares/auth.js";
import upload from "../middlewares/upload.js";
import fs from "fs";

const router = express.Router();

// Helper: parsear campo tallas de req.body de forma robusta
function parseTallasFromBody(body) {
  let raw = undefined;
  if (body["tallas[]"] !== undefined) raw = body["tallas[]"];
  else if (body.tallas !== undefined) raw = body.tallas;
  else raw = undefined;

  if (raw === undefined || raw === null || raw === "") return undefined;

  if (Array.isArray(raw)) {
    return raw.map(t => String(t).trim()).filter(Boolean);
  }

  if (typeof raw === "string") {
    // intentar JSON.parse
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(t => String(t).trim()).filter(Boolean);
    } catch (err) {
      // no es JSON, continuar
    }

    if (raw.includes(",")) {
      return raw.split(",").map(t => t.trim()).filter(Boolean);
    }

    return [raw.trim()].filter(Boolean);
  }

  return [String(raw).trim()].filter(Boolean);
}

// ============================
// OBTENER TODOS
// ============================
router.get("/", async (req, res) => {
  try {
    const productos = await Producto.find();
    res.json(productos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================
// OBTENER DESTACADOS
// ============================
router.get("/destacados", async (req, res) => {
  try {
    const productos = await Producto.find({ destacado: true });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});



// ============================
// OBTENER POR CATEGORÍA
// ============================
router.get("/categoria/:categoria", async (req, res) => {
  try {
    const productos = await Producto.find({
      categoria: req.params.categoria
    });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================
// OBTENER POR ID
// ============================
router.get("/:id", async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id);
    res.json(producto);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ============================
// CREAR PRODUCTO (SOLO ADMIN)
// ============================
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  upload.single("imagen"),
  async (req, res) => {
    try {
      let {
        nombre,
        descripcion,
        precio,
        categoria,
        temporada,
        rangoEdad,
        stock
      } = req.body;

      // PRECIO
      if (precio !== undefined && precio !== "") {
        const p = Number(precio);
        if (Number.isNaN(p)) return res.status(400).json({ message: "Precio inválido" });
        precio = p;
      } else {
        precio = undefined;
      }

      // STOCK
      if (stock !== undefined && stock !== "") {
        const s = Number(stock);
        if (Number.isNaN(s)) return res.status(400).json({ message: "Stock inválido" });
        stock = s;
      } else {
        stock = undefined;
      }

      // TALLAS
      const tallas = parseTallasFromBody(req.body);

      const nuevoProducto = new Producto({
        nombre,
        descripcion,
        precio,
        categoria,
        temporada,
        rangoEdad,
        tallas: tallas ?? [],
        stock: stock ?? 0,
        imagen: req.file ? `/uploads/${req.file.filename}` : undefined
      });

      const productoGuardado = await nuevoProducto.save();

      res.status(201).json(productoGuardado);
    } catch (error) {
      console.error("Error al crear producto:", error);
      res.status(400).json({
        message: "Error al crear producto",
        error: error.message
      });
    }
  }
);

// ============================
// EDITAR PRODUCTO (SOLO ADMIN)
// ============================
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  upload.single("imagen"),
  async (req, res) => {
    try {
      let {
        nombre,
        descripcion,
        precio,
        categoria,
        temporada,
        rangoEdad,
        stock,
        destacado
      } = req.body;

      // 🔹 CONVERTIR DESTACADO A BOOLEAN SI VIENE
      if (destacado !== undefined) {
        destacado = destacado === "true" || destacado === true;
      }

      // PRECIO
      if (precio !== undefined && precio !== "") {
        const p = Number(precio);
        if (Number.isNaN(p))
          return res.status(400).json({ message: "Precio inválido" });
        precio = p;
      } else {
        precio = undefined;
      }

      // STOCK
      if (stock !== undefined && stock !== "") {
        const s = Number(stock);
        if (Number.isNaN(s))
          return res.status(400).json({ message: "Stock inválido" });
        stock = s;
      } else {
        stock = undefined;
      }

      // TALLAS
      const tallas = parseTallasFromBody(req.body);

      const productoActualizado = {
        nombre,
        descripcion,
        precio,
        categoria,
        temporada,
        rangoEdad,
        ...(tallas !== undefined ? { tallas } : {}),
        ...(stock !== undefined ? { stock } : {}),
        ...(destacado !== undefined ? { destacado } : {})
      };

      if (req.file) {
        productoActualizado.imagen = `/uploads/${req.file.filename}`;
      }

      const producto = await Producto.findByIdAndUpdate(
        req.params.id,
        Object.fromEntries(
          Object.entries(productoActualizado).filter(
            ([_, v]) => v !== undefined
          )
        ),
        { new: true }
      );

      res.json(producto);
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      res.status(400).json({
        message: "Error al actualizar producto",
        error: error.message
      });
    }
  }
);


// ============================
// ELIMINAR PRODUCTO (SOLO ADMIN)
// ============================
// ============================
// ELIMINAR PRODUCTO (SOLO ADMIN)
// ============================
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      // Primero obtenemos el producto para tener la ruta de la imagen
      const producto = await Producto.findById(req.params.id);
      
      if (!producto) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }

      // Eliminamos el producto de la base de datos
      await Producto.findByIdAndDelete(req.params.id);

      // Si el producto tenía una imagen, la eliminamos del sistema de archivos
      if (producto.imagen) {
        try {
          // La URL es algo como: /uploads/1772331023187.png
          // Necesitamos extraer solo el nombre del archivo: 1772331023187.png
          const imageUrl = producto.imagen;
          const fileName = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
          
          // Importar fs para eliminar el archivo
          const fs = await import('fs');
          
          // La carpeta uploads está en la raíz del proyecto backend
          const filePath = `${process.cwd()}/uploads/${fileName}`;
          
          // Verificamos si el archivo existe y lo eliminamos
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`Imagen eliminada: ${fileName}`);
          } else {
            console.log(`Archivo no encontrado: ${fileName}`);
          }
        } catch (fileError) {
          console.error("Error al eliminar la imagen:", fileError);
        }
      }

      res.json({ message: "Producto eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      res.status(500).json({
        message: "Error al eliminar producto",
        error: error.message
      });
    }
  }
);

export default router;