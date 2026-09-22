import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { TransactionRegistryService } from '../services/TransactionRegistryService';

const app = express();
app.use(cors());
app.use(express.json());

const registry = new TransactionRegistryService();

// GET /api/history - Devuelve el ledger completo
app.get('/api/history', async (req, res) => {
  try {
    const history = await registry.getHistory();
    res.json({ transactions: history });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/build - Dispara una nueva compilación
app.post('/api/build', async (req, res) => {
  try {
    const { documentId, sourceHash } = req.body;
    if (!documentId || !sourceHash) {
      return res.status(400).json({ error: 'Faltan parámetros documentId o sourceHash' });
    }

    const txId = crypto.randomUUID();
    
    // 1. Registrar intención (Status: processing)
    const tx = await registry.createTransaction(txId, documentId, sourceHash);

    // 2. Aquí se despacharía el proceso en background (MultisourceEngine, Indexers, PdfAdapter)
    // Para el esqueleto, simulamos que el orquestador inicia el trabajo de forma asíncrona.
    
    res.status(202).json({ txId, status: tx.status, message: 'Compilación iniciada en background' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/publish/:txId - Transición de estado a "published"
app.post('/api/publish/:txId', async (req, res) => {
  try {
    const { txId } = req.params;
    await registry.transitionStatus(txId, 'published', ['Despliegue a producción completado.']);
    res.json({ success: true, message: `Transacción ${txId} publicada.` });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`[LEX-API] Orquestador Editorial activo en http://localhost:${PORT}`);
});
