// models/Usuario.js
import mongoose from "mongoose";

const direccionSchema = new mongoose.Schema({
  calle: { type: String, required: true },
  numero: { type: String, required: true },
  ciudad: { type: String, required: true },
  estado: { type: String, required: true },
  codigoPostal: { type: String, required: true },
  telefono: { type: String }
}, { _id: true });

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rol: { type: String, enum: ["usuario", "admin"], default: "usuario" },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Producto" }],
  carrito: [
    {
      producto: { type: mongoose.Schema.Types.ObjectId, ref: "Producto" },
      cantidad: { type: Number, default: 1 }
    }
  ], 
  direcciones: [direccionSchema]
});

export default mongoose.model("Usuario", usuarioSchema);