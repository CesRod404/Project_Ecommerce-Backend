// routes/admin.js
import express from "express";
import Producto from "../models/Producto.js";
import { authMiddleware, adminMiddleware } from "../middlewares/auth.js";
import upload from "../middlewares/upload.js";
import Pedido from "../models/Pedido.js";

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
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(t => String(t).trim()).filter(Boolean);
    } catch (err) {
      // no es JSON
    }

    if (raw.includes(",")) {
      return raw.split(",").map(t => t.trim()).filter(Boolean);
    }

    return [raw.trim()].filter(Boolean);
  }

  return [String(raw).trim()].filter(Boolean);
}

// =========================
// CREAR PRODUCTO (ADMIN)
// =========================
router.post(
  "/producto",
  authMiddleware,
  adminMiddleware,
  upload.single("imagen"),
  async (req, res) => {
    try {
      let { nombre, descripcion, precio, categoria, temporada, rangoEdad, stock } = req.body;

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

      const nuevaImagen = req.file ? `http://localhost:5000/uploads/${req.file.filename}` : null;

      const nuevoProducto = new Producto({
        nombre,
        imagen: nuevaImagen ?? undefined,
        descripcion,
        precio,
        categoria,
        temporada,
        rangoEdad,
        tallas: tallas ?? [],
        stock: stock ?? 0
      });

      await nuevoProducto.save();

      res.status(201).json({ producto: nuevoProducto });
    } catch (err) {
      console.error("Error admin crear producto:", err);
      res.status(500).json({ message: "Error al crear producto", error: err.message });
    }
  }
);

// =========================
// EDITAR PRODUCTO (ADMIN)
// =========================
router.put("/producto/:id", authMiddleware, adminMiddleware, upload.single("imagen"), async (req, res) => {
  try {
    let { nombre, descripcion, precio, categoria, temporada, rangoEdad, stock } = req.body;

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

    const productoActualizado = {
      nombre,
      descripcion,
      precio,
      categoria,
      temporada,
      rangoEdad,
      ...(tallas !== undefined ? { tallas } : {}),
      ...(stock !== undefined ? { stock } : {})
    };

    if (req.file) {
      productoActualizado.imagen = `http://localhost:5000/uploads/${req.file.filename}`;
    }

    const producto = await Producto.findByIdAndUpdate(
      req.params.id,
      Object.fromEntries(Object.entries(productoActualizado).filter(([k, v]) => v !== undefined)),
      { new: true }
    );

    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json({ message: "Producto actualizado", producto });
  } catch (err) {
    console.error("Error admin actualizar producto:", err);
    res.status(500).json({ message: "Error al actualizar producto", error: err.message });
  }
});

// =========================
// ELIMINAR PRODUCTO (ADMIN)
// =========================
router.delete("/producto/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const productoEliminado = await Producto.findByIdAndDelete(req.params.id);

    if (!productoEliminado) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    res.json({ message: "Producto eliminado correctamente" });
  } catch (err) {
    console.error("Error admin eliminar producto:", err);
    res.status(500).json({ message: "Error al eliminar producto", error: err.message });
  }
});


// =========================
// OBTENER TODOS LOS PEDIDOS (ADMIN)
// =========================
router.get("/pedidos", authMiddleware, adminMiddleware, async (req, res) => {
  try {

    const pedidos = await Pedido.find()
      .populate("usuario", "nombre email")
      .populate("productos.producto");

    res.json(pedidos);

  } catch (error) {
    res.status(500).json({
      message: "Error al obtener pedidos",
      error: error.message
    });
  }
});

// =========================
// CAMBIAR ESTADO PEDIDO (ADMIN)
// =========================
router.put("/pedidos/:id/estado", authMiddleware, adminMiddleware, async (req, res) => {
  try {

    const { estado } = req.body;

    const estadosValidos = [
      "por_confirmar",
      "confirmado",
      "en_camino",
      "cancelado"
    ];

    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ message: "Estado inválido" });
    }

    const pedido = await Pedido.findByIdAndUpdate(
      req.params.id,
      { estado },
      { new: true }
    );

    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    res.json({ message: "Estado actualizado", pedido });

  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar estado",
      error: error.message
    });
  }
});


export default router;