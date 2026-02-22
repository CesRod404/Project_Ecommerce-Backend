import express from "express";
import mongoose from "mongoose";
import Pedido from "../models/Pedido.js";

import Usuario from "../models/Usuario.js";
import Producto from "../models/Producto.js";

import { authMiddleware, adminMiddleware } from "../middlewares/auth.js";

const router = express.Router();


// ============================
// CREAR PEDIDO (Usuario autenticado)
// ============================
router.post("/", authMiddleware, async (req, res) => {

  const { productos, direccionId } = req.body;

  const usuario = await Usuario.findById(req.usuario.id);

  const direccionSeleccionada = usuario.direcciones.id(direccionId);

  if (!direccionSeleccionada) {
    return res.status(400).json({ message: "Dirección inválida" });
  }

  let total = 0;

  for (let item of productos) {
    const productoDB = await Producto.findById(item.producto);
    total += productoDB.precio * item.cantidad;
  }

  const nuevoPedido = new Pedido({
    usuario: req.usuario.id,
    productos,
    total,
    direccionEnvio: direccionSeleccionada
  });

  await nuevoPedido.save();

  usuario.carrito = [];
  await usuario.save();
  
  res.json(nuevoPedido);

});


// ============================
// OBTENER MIS PEDIDOS
// ============================
router.get("/mis-pedidos", authMiddleware, async (req, res) => {
  try {

    const pedidos = await Pedido.find({ usuario: req.usuario.id })
      .populate("usuario", "nombre email")
      .populate("productos.producto", "nombre precio imagen"); // 👈 agregar imagen

    res.json(pedidos);

  } catch (error) {
    console.error(error); // 👈 agrega esto para ver el error real
    res.status(500).json({
      message: "Error al obtener pedidos",
      error: error.message
    });
  }
});



// ============================
// OBTENER TODOS LOS PEDIDOS (ADMIN)
// ============================
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {

    const { estado } = req.query;

    const estadosValidos = [
      "por_confirmar",
      "confirmado",
      "en_camino",
      "cancelado"
    ];

    let filtro = {};

    // Si viene estado en query, filtramos
    if (estado) {

      if (!estadosValidos.includes(estado)) {
        return res.status(400).json({
          message: "Estado inválido"
        });
      }

      filtro.estado = estado;
    }

    const pedidos = await Pedido.find(filtro)
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



// ============================
// CAMBIAR ESTADO (ADMIN)
// ============================
router.put("/:id/estado", authMiddleware, adminMiddleware, async (req, res) => {
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

    const pedido = await Pedido.findById(req.params.id);

    if (!pedido) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    const estadoAnterior = pedido.estado;

    
    if (estado === "confirmado" && estadoAnterior !== "confirmado") {

      for (let item of pedido.productos) {
        const productoDB = await Producto.findById(item.producto);

        if (!productoDB) {
          return res.status(404).json({
            message: "Producto no encontrado"
          });
        }

        if (productoDB.stock < item.cantidad) {
          return res.status(400).json({
            message: `Stock insuficiente para ${productoDB.nombre}`
          });
        }

        productoDB.stock -= item.cantidad;
        await productoDB.save();
      }
    }

    if (estadoAnterior === "confirmado" && estado !== "confirmado") {

      for (let item of pedido.productos) {
        const productoDB = await Producto.findById(item.producto);

        if (productoDB) {
          productoDB.stock += item.cantidad;
          await productoDB.save();
        }
      }
    }

    pedido.estado = estado;
    await pedido.save();

    res.json(pedido);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error al actualizar estado",
      error: error.message
    });
  }
});




router.delete("/carrito/vaciar", authMiddleware, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id);
    usuario.carrito = [];
    await usuario.save();
    res.json({ mensaje: "Carrito vaciado" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error vaciando carrito" });
  }
});

// ============================
// ELIMINAR PEDIDO (ADMIN)
// ============================
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {

    const pedido = await Pedido.findById(req.params.id);

    if (!pedido) {
      return res.status(404).json({
        message: "Pedido no encontrado"
      });
    }

    
    if (pedido.estado === "confirmado") {
      for (let item of pedido.productos) {
        const productoDB = await Producto.findById(item.producto);

        if (productoDB) {
          productoDB.stock += item.cantidad;
          await productoDB.save();
        }
      }
    }

    await pedido.deleteOne();

    res.json({ message: "Pedido eliminado correctamente" });

  } catch (error) {
    res.status(500).json({
      message: "Error al eliminar pedido",
      error: error.message
    });
  }
});



export default router;
