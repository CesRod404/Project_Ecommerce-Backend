import mongoose from "mongoose";


const orderSchema = new mongoose.Schema({

    usuario: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Usuario",
        required: true
    },

    productos: [
    {
      producto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Producto",
        required: true
      },
      cantidad: {
        type: Number,
        required: true,
        min: 1
      }
    }
  ],

  estado: {
    type: String,
    enum: ["por_confirmar", "confirmado", "en_camino", "cancelado"],
    default: "por_confirmar"
  },

  total: {
    type: Number,
    required: true
  },

  fecha: {
    type: Date,
    default: Date.now
  },

  direccionEnvio: {
  calle: String,
  numero: String,
  ciudad: String,
  estado: String,
  codigoPostal: String,
  telefono: String
},



});

export default mongoose.models.Pedido || mongoose.model("Pedido", orderSchema);

