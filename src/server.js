import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import { User } from './models/userModel.js'; 

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

app.use(cors());

app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'API está corriendo', timestamp: new Date() });
});

mongoose.connect(process.env.CONNECTION_STRING)
  .then(() => {
    console.log('✅ Conectado a MongoDB Atlas');
  })
  .catch(err => {
    console.error('❌ Error al conectar a MongoDB:', err);
  });

// WebSocket: Escuchar cambios en campos "role", "password", "plan" y "isActive" de usuarios
io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado');

  socket.on('subscribeUserChanges', async (userId) => {
    console.log(`👤 Cliente suscrito a cambios del usuario: ${userId}`);

    const pipeline = [
      {
        $match: {
          'documentKey._id': new mongoose.Types.ObjectId(userId),
          operationType: { $in: ['update', 'delete'] }
        }
      }
    ];

    const changeStream = mongoose.connection.collection('users').watch(pipeline);

    changeStream.on('change', async (change) => {
      if (change.operationType === 'delete') {
        socket.emit('userDeleted', {
          userId: change.documentKey._id
        });
        return;
      }

      const updatedFields = Object.keys(change.updateDescription.updatedFields);
      const hasRoleChanged = updatedFields.includes('role');
      const hasPasswordChanged = updatedFields.includes('password');
      const hasPlanChanged = updatedFields.includes('plan');
      const hasIsActiveChanged = updatedFields.includes('isActive');
      const hasEmailChanged = updatedFields.includes('email');

      if (
        hasRoleChanged ||
        hasPasswordChanged ||
        hasPlanChanged ||
        hasIsActiveChanged ||
        hasEmailChanged
      ) {
        const user = await User.findById(change.documentKey._id).lean();

        socket.emit('userUpdated', {
          userId: user._id,
          ...(hasRoleChanged && { role: user.role }),
          ...(hasPasswordChanged && { passwordChanged: true }),
          ...(hasPlanChanged && { plan: user.plan }),
          ...(hasIsActiveChanged && { isActive: user.isActive }),
          ...(hasEmailChanged && { email: user.email })
        });
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Cliente desconectado de cambios de usuario');
      changeStream.close();
    });
  });
});

// Inicia el servidor
const PORT = process.env.PORT || 3031;
server.listen(PORT, () => {
  console.log(`🚀 Servidor WebSocket escuchando en http://localhost:${PORT}`);
});
