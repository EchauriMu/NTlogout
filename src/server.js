import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import { Alert } from './models/alert.model.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

app.use(cors());
app.get('/', (req, res) => res.send('🚀 API está corriendo'));

// Conexión a MongoDB
mongoose.connect('mongodb+srv://sa:Eduardo25@notifinance.zp3mm.mongodb.net/NT?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Conectado a MongoDB Atlas');
}).catch(err => {
  console.error('❌ Error al conectar a MongoDB:', err);
});

// WebSocket
io.on('connection', (socket) => {
  console.log('🔌 Cliente conectado');

  socket.on('subscribeAlerts', async (userId) => {
    console.log(`👤 Cliente suscrito a alertas del usuario: ${userId}`);

    const changeStream = mongoose.connection.collection('alerts').watch();

    changeStream.on('change', async (change) => {
      if (change.operationType === 'update') {
        const alert = await Alert.findById(change.documentKey._id).lean();
        if (alert && String(alert.userId) === userId) {
          socket.emit('alertUpdated', {
            alertId: alert._id,
            isActive: alert.isActive,
            updatedAt: alert.updatedAt
          });
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ Cliente desconectado');
      changeStream.close();
    });
  });
});

// Inicia el servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Servidor WebSocket escuchando en http://localhost:${PORT}`);
});
