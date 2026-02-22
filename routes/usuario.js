import express from "express";
import Usuario from "../models/Usuario.js";
import { authMiddleware } from "../middlewares/auth.js";

const router = express.Router();


// =====================================
// TOGGLE LIKE (AGREGAR / QUITAR)
// =====================================
router.post("/likes/:productoId", authMiddleware, async (req, res) => {
  try {
    const { productoId } = req.params;

    const usuario = await Usuario.findById(req.usuario.id);

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const yaExiste = usuario.likes.some(
      id => id.toString() === productoId
    );

    if (yaExiste) {
      usuario.likes = usuario.likes.filter(
        id => id.toString() !== productoId
      );
    } else {
      usuario.likes.push(productoId);
    }

    await usuario.save();

    res.json({ likes: usuario.likes });

  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar likes",
      error: error.message
    });
  }
});


// =====================================
// OBTENER SOLO LIKES
// =====================================
router.get("/likes", authMiddleware, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id)
      .populate("likes");

    res.json(usuario.likes);

  } catch (error) {
    res.status(500).json({
      message: "Error al obtener likes",
      error: error.message
    });
  }
});


// =====================================
// AGREGAR AL CARRITO
// =====================================
router.post("/", authMiddleware, async (req, res) => {
  try {

    const { productos, direccionId } = req.body;

    if (!productos || !productos.length) {
      return res.status(400).json({ message: "No hay productos" });
    }

    if (!direccionId) {
      return res.status(400).json({ message: "Dirección requerida" });
    }

    const usuario = await Usuario.findById(req.usuario.id);

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const direccionSeleccionada = usuario.direcciones.id(direccionId);

    if (!direccionSeleccionada) {
      return res.status(400).json({ message: "Dirección inválida" });
    }

    let total = 0;

    for (let item of productos) {
      const productoDB = await Producto.findById(item.producto);

      if (!productoDB) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }

      total += productoDB.precio * item.cantidad;
    }

    const nuevoPedido = new Pedido({
      usuario: req.usuario.id,
      productos,
      total,
      direccionEnvio: direccionSeleccionada
    });

    await nuevoPedido.save();

    res.json(nuevoPedido);

  } catch (error) {
    res.status(500).json({
      message: "Error creando pedido",
      error: error.message
    });
  }
});


// =====================================
// OBTENER SOLO CARRITO
// =====================================
router.get("/carrito", authMiddleware, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id)
      .populate("carrito.producto");

    res.json(usuario.carrito);

  } catch (error) {
    res.status(500).json({
      message: "Error al obtener carrito",
      error: error.message
    });
  }
});

// =====================================
// AGREGAR AL CARRITO (REAL)
// =====================================
router.post("/carrito/:productoId", authMiddleware, async (req, res) => {
  try {
    const { productoId } = req.params;

    const usuario = await Usuario.findById(req.usuario.id);

    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const itemExistente = usuario.carrito.find(
      item => item.producto.toString() === productoId
    );

    if (itemExistente) {
      itemExistente.cantidad += 1;
    } else {
      usuario.carrito.push({
        producto: productoId,
        cantidad: 1
      });
    }

    await usuario.save();

    res.json(usuario.carrito);

  } catch (error) {
    res.status(500).json({
      message: "Error al agregar al carrito",
      error: error.message
    });
  }
});



// =====================================
// ACTUALIZAR CANTIDAD
// =====================================
router.put("/carrito/:productoId", authMiddleware, async (req, res) => {
  try {
    const { productoId } = req.params;
    const { cantidad } = req.body;

    const usuario = await Usuario.findById(req.usuario.id);

    const item = usuario.carrito.find(
      item => item.producto.toString() === productoId
    );

    if (!item) {
      return res.status(404).json({ message: "Producto no encontrado en carrito" });
    }

    item.cantidad = cantidad;

    await usuario.save();

    const usuarioActualizado = await Usuario.findById(req.usuario.id)
      .populate("carrito.producto");

    res.json({ carrito: usuarioActualizado.carrito });


  } catch (error) {
    res.status(500).json({
      message: "Error al actualizar cantidad",
      error: error.message
    });
  }
});

// =====================================
// ELIMINAR DEL CARRITO
// =====================================
router.delete("/carrito/:productoId", authMiddleware, async (req, res) => {
  try {
    const { productoId } = req.params;

    const usuario = await Usuario.findById(req.usuario.id);

    usuario.carrito = usuario.carrito.filter(
      item => item.producto.toString() !== productoId
    );

    await usuario.save();

    const usuarioActualizado = await Usuario.findById(req.usuario.id)
    .populate("carrito.producto");

    res.json({ carrito: usuarioActualizado.carrito });


  } catch (error) {
    res.status(500).json({
      message: "Error al eliminar producto",
      error: error.message
    });
  }
});

// =====================================
// OBTENER TODO (LIKES + CARRITO)
// =====================================
router.get("/mis-productos", authMiddleware, async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.usuario.id)
      .populate("likes")
      .populate("carrito.producto");

    res.json({
      likes: usuario.likes,
      carrito: usuario.carrito
    });

  } catch (error) {
    res.status(500).json({
      message: "Error al obtener productos del usuario",
      error: error.message
    });
  }
});


///RUTAS DE DIRECCIONES

//Obtener direcciones
router.get("/direcciones", authMiddleware, async (req, res) => {
  const usuario = await Usuario.findById(req.usuario.id);
  res.json(usuario.direcciones);
});


//Agregar Direccion
router.post("/direcciones", authMiddleware, async (req, res) => {

  const { calle, numero, ciudad, estado, codigoPostal, telefono } = req.body;

  const usuario = await Usuario.findById(req.usuario.id);

  usuario.direcciones.push({
    calle,
    numero,
    ciudad,
    estado,
    codigoPostal,
    telefono
  });

  await usuario.save();

  res.json(usuario.direcciones);
});


//Eliminar direccion

router.delete("/direcciones/:id", authMiddleware, async (req, res) => {

  const usuario = await Usuario.findById(req.usuario.id);

  usuario.direcciones = usuario.direcciones.filter(
    d => d._id.toString() !== req.params.id
  );

  await usuario.save();

  res.json(usuario.direcciones);
});




export default router;
