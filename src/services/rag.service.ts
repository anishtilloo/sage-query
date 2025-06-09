import { openAIClient, RagPipeline } from '../module/rag';
import { AIResponse } from '../types/rag.types';
import { logger } from '../utils/logger';

export class RagService {
    private ragPipeline: RagPipeline | null = null;

    /**
     * Initialize the RAG pipeline with a PDF document
     * @param pdfPath Path to the PDF document
     * @returns Promise indicating successful initialization
     */
    public async initializePipeline(pdfPath: string) {
        try {
            const ragPipeline = new RagPipeline(pdfPath);
            const loadedPdf = ragPipeline.loadPDF(pdfPath);
            const docs = await loadedPdf;
            const splitDocs = await ragPipeline.recursiveTextSplitter(docs, 1000, 200);
            const embeddings = await ragPipeline.embeddingModel("gemini-pro");
            const retriever = await ragPipeline.dataRetriever(
                "http://localhost:6333",
                "learning_langchain",
                embeddings
            );
            const similaritySearch = await ragPipeline.similaritySearch(retriever, "Sample query for initialization");
            logger.info('RAG Pipeline initialized successfully');
            return true;
        } catch (error) {
            logger.error('Error in RAG service initialization:', error);
            throw error;
        }
    }

    /**
     * Process a query using the initialized RAG pipeline
     * @param query User's query string
     * @returns Promise resolving to the AI response
     */
    public async processQuery(query: string): Promise<AIResponse> {
        if (!this.ragPipeline) {
            throw new Error('RAG pipeline not initialized. Please initialize first.');
        }

        try {
            const embeddings = await this.ragPipeline.embeddingModel("gemini-pro");
            const retriever = await this.ragPipeline.dataRetriever(
                "http://localhost:6333",
                "learning_langchain",
                embeddings
            );
            
            // Perform similarity search
            const similaritySearchResult = await this.ragPipeline.similaritySearch(retriever, query);
            
            if (!similaritySearchResult || similaritySearchResult.length === 0) {
                return {
                    step: "output",
                    content: "No relevant content found for your query"
                };
            }

            const context = similaritySearchResult[0].pageContent;
            const messages = [
                {
                    role: 'system',
                    content: `You are an AI Assistant specialized in answering questions based on provided context.
                             Current context: ${context}`
                },
                { role: 'user', content: query }
            ];

            // Get response from OpenAI
            const response = await openAIClient.chat.completions.create({
                model: 'gemini-2.0-flash',
                messages: messages as any,
                temperature: 0.7,
                max_tokens: 500
            });

            const content = response.choices[0]?.message?.content || "Failed to generate response";
            
            return {
                step: "output",
                content
            };
        } catch (error) {
            logger.error('Error processing query in RAG service:', error);
            throw error;
        }
    }
}
