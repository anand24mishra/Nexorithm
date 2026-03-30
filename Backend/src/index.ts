import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ExecutorFactory } from './services/executorFactory';
import submitRoutes from './routes/submit.routes';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json()); 

app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'Platform is running smoothly' });
});

// for testing the executor factory independently
app.use('/api/test-executor', submitRoutes);

app.post('/api/submissions', async (req: Request, res: Response) => {
    try {
        const { language, code } = req.body;

        if (!language || !code) {
             res.status(400).json({ error: 'Language and code are required' });
             return;
        }

        const executor = ExecutorFactory.getExecutor(language);
        
        const result = await executor.execute(code, ''); // For simplicity, using empty input. In a real scenario, this would come from the test cases.

        res.status(200).json({
            status: 'Success',
            verdict: result
        });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Judge Backend running on http://localhost:${PORT}`);
});