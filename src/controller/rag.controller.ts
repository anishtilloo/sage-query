import { Request, Response, NextFunction } from 'express';
import { RagService } from '../services/rag.service';
import { RagRequest, RagResponse } from '../types/rag.types';
import { logger } from '../utils/logger';

// Initialize RagService instance
const ragService = new RagService();

/**
 * Initialize the RAG pipeline with a PDF document
 */
export const initializePipeline = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { pdfPath } = req.body;
        
        if (!pdfPath) {
            return res.status(400).json({
                status: 'error',
                message: 'PDF path is required',
                data: null
            });
        }

        const pipeline = await ragService.initializePipeline(pdfPath);
        
        return res.status(200).json({
            status: 'success',
            message: 'RAG pipeline initialized successfully',
            data: pipeline
        });
    } catch (error) {
        logger.error('Error initializing RAG pipeline:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to initialize RAG pipeline',
            data: null
        });
    }
};

/**
 * Process a query using the initialized RAG pipeline
 */
export const processQuery = async (
    req: Request<{}, {}, RagRequest>,
    res: Response<RagResponse>,
    next: NextFunction
) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({
                status: 'error',
                message: 'Query is required',
                data: null
            });
        }

        const response = await ragService.processQuery(query);
        
        return res.status(200).json({
            status: 'success',
            message: 'Query processed successfully',
            data: response
        });
    } catch (error) {
        logger.error('Error processing query:', error);
        return res.status(500).json({
            status: 'error',
            message: 'Failed to process query',
            data: null
        });
    }
};
