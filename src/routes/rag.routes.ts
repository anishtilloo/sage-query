import { Router } from 'express';
import { initializePipeline, processQuery } from '../controller/rag.controller';

const router = Router();

// Route to initialize RAG pipeline with a PDF
router.post('/init', initializePipeline);

// Route to process a query
router.post('/query', processQuery);

export default router;
