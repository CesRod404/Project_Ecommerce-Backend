// models/Producto.js
import mongoose from "mongoose";

const productoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  imagen: { type: String, required: true },
  descripcion: { type: String },
  precio: { type: Number, required: true },
  categoria: {
    type: String,
    enum: ["bautizo-niño", "bautizo-niña", "ropa-niña", "ropa-niño", "accesorio"],
    required: true
  },
  temporada: {
    type: String,
    enum: ["verano", "invierno"],
    required: function () {
      return this.categoria.includes("ropa");
    }
  },
  rangoEdad: {
    type: String,
    required: function () {
      return this.categoria.includes("ropa");
    }
  },
  // NUEVOS CAMPOS: múltiples tallas y stock general
  stock: { type: Number, default: 0, min: 0 },
  tallas: { type: [String], default: [] },

  destacado: {
  type: Boolean,
  default: false
  },
});

export default mongoose.model("Producto", productoSchema);