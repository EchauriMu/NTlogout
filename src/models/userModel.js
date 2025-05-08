import mongoose from 'mongoose';


// Función para generar un número aleatorio de 4 dígitos seguido de una letra aleatoria
const generateRandomPhone = () => {
  const randomNumber = Math.floor(Math.random() * 9000) + 1000;  // Número aleatorio entre 1000 y 9999
  const randomLetter = String.fromCharCode(Math.floor(Math.random() * 26) + 65);  // Letra aleatoria (A-Z)
  return randomNumber + randomLetter;  // Número + Letra
};

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['basic', 'analist', 'admin'], 
    default: 'basic', 
    required: true 
  },
  // Número de teléfono único generado aleatoriamente
  phone: { 
    type: String, 
    unique: true, 
    default: generateRandomPhone  // Número aleatorio con letra
  },
  phoneVerificationToken: { type: String, default: null },
  phoneVerificationExpires: { type: Date, default: null },
  emailVerificationToken: { type: String, default: null },
  emailVerificationExpires: { type: Date, default: null },
  isPhoneVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
  lastLogin: { type: Date, default: null },
  failedLoginAttempts: { type: Number, default: 0 },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware para actualizar la fecha de actualización
userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});


// Exportar el modelo
export const User = mongoose.model('User', userSchema);
