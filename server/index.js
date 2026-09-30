import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import caseFilesRouter from './routes/caseFiles.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/case-files', caseFilesRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});