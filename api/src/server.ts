import express from 'express';
import cors from 'cors';
import { authRoutes } from './routes/auth.routes.js'; 

const app = express();

app.use(cors()); 
app.use(express.json()); 

const PORT = 3000;

app.get('/', (req, res) => {
    res.json({ message: 'API do CRM funcionando!' });
});

app.use('/auth', authRoutes);

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});