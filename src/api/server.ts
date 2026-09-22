import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { TransactionRegistryService } from '../services/TransactionRegistryService';
import { BuildWorker } from '../services/BuildWorker';

const app = express();
app.use(cors());
app.use(express.json());

const registry = new TransactionRegistryService();
const worker = new BuildWorker();

// Mapa para gestionar cancelaciones futuras (AbortControllers)
const activeJobs = new Map<string, AbortController>();

app.get('/api/history', async (req, res) => {
  try {
    const history = await registry.getHistory();
    res.json({ transactions: history });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/build', async (req, res) => {
  try {
    const { documentId, sourceHash } = req.body;
    if (!documentId || !sourceHash) return res.status(400).json({ error: 'Faltan parámetros' });

    const txId = crypto.randomUUID();
    const tx = await registry.createTransaction(txId, documentId, sourceHash);

    const abortController = new AbortController();
    activeJobs.set(txId, abortController);

    // Disparamos el Worker en background (Fire and Forget)
    worker.executeJob({ txId, documentId, sourceHash }, abortController.signal)
      .finally(() => activeJobs.delete(txId));
    
    res.status(202).json({ txId, status: tx.status, message: 'Compilación iniciada en background' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`[LEX-API] Orquestador Editorial activo en http://localhost:${PORT}`));
