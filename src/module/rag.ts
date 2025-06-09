import OpenAI from "openai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";

import type { EmbeddingsInterface } from "@langchain/core/embeddings";

import { config } from "../config";

const GOOGLE_APPLICATION_CREDENTIALS = config.models.llm.googleAuthJsonPath;

export const openAIClient = new OpenAI({
    baseURL: config.models.llm.baseUrl,
    apiKey: config.models.llm.apiKey,
})

/**
 * RagPipeline class implements a Retrieval-Augmented Generation (RAG) system
 * that processes PDF documents and enables interactive Q&A sessions using
 * the document's content.
 */
export class RagPipeline {
    private pdfPath: string;

    /**
     * Initializes a new RAG pipeline with a PDF document path
     * @param pdfPath - The file system path to the PDF document to be processed
     */
    constructor(pdfPath: string) {
        this.pdfPath = pdfPath;
    }

    /**
     * Loads and processes a PDF document using LangChain's PDFLoader
     * @param path - The file system path to the PDF document
     * @returns Promise resolving to the loaded document segments
     */
    async loadPDF(path: string) {
        const loader = new PDFLoader(path);

        return await loader.load();
    }

    /**
     * Splits documents into smaller chunks for better processing
     * @param docs - The document to be split
     * @param chunkSize - The maximum size of each chunk in characters
     * @param chunkOverlap - The number of characters to overlap between chunks
     * @returns Promise resolving to an array of document chunks
     */
    async recursiveTextSplitter(docs: any, chunkSize: number, chunkOverlap: number) {
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize,
            chunkOverlap,
        });

        return splitter.splitDocuments(docs);
    }

    /**
     * Initializes the Google GenerativeAI embeddings model
     * @param modelName - The name of the model to use (e.g., "gemini-pro")
     * @returns Promise resolving to the initialized embeddings model
     */
    async embeddingModel(modelName: string) {
        return new GoogleGenerativeAIEmbeddings({
            model: modelName
        });
    }

    /**
     * Stores document chunks in a Qdrant vector database
     * @param documents - The document chunks to store
     * @param url - The URL of the Qdrant server
     * @param collectionName - The name of the collection to store documents in
     * @param embeddings - The embeddings model to use for vectorization
     * @returns Promise resolving to the initialized Qdrant vector store
     */
    async storeDocumentsInQudrant(documents: any, url: string, collectionName: string, embeddings: EmbeddingsInterface) {
        const quadrantDB = QdrantVectorStore.fromDocuments(
            documents,
            embeddings,
            { url, collectionName }
        )

        return quadrantDB;
    }

    /**
     * Retrieves an existing collection from the Qdrant database
     * @param dbUrl - The URL of the Qdrant server
     * @param collectionName - The name of the collection to retrieve
     * @param embeddings - The embeddings model to use for vectorization
     * @returns Promise resolving to the Qdrant vector store instance
     */
    async dataRetriever(dbUrl: string, collectionName: string, embeddings: EmbeddingsInterface) {
        return QdrantVectorStore.fromExistingCollection(
            embeddings,
            {
                url: dbUrl,
                collectionName
            }
        );
    }

    /**
     * Performs a similarity search in the vector database
     * @param retriever - The Qdrant vector store instance to search in
     * @param query - The search query string
     * @returns Promise resolving to the search results
     */
    async similaritySearch(retriever: QdrantVectorStore, query: string) {
        return retriever.similaritySearch(query);
    }

    /**
     * Runs an interactive Q&A session using the processed document
     * This method:
     * 1. Initializes the embedding model
     * 2. Loads and processes the PDF
     * 3. Splits the text into manageable chunks
     * 4. Stores the chunks in the vector database
     * 5. Enters an interactive loop where it:
     *    - Accepts user queries
     *    - Retrieves relevant context
     *    - Generates AI responses using OpenAI
     *    - Displays the responses in a structured format
     * 
     * The session continues until the user types "exit"
     * @returns Promise that resolves when the session ends
     */
    async runInteractiveSession() {
        const embeddings = await this.embeddingModel("models/embedding-001");
        console.log("pdf_path", this.pdfPath);
        
        const loadedPdf = await this.loadPDF(this.pdfPath);
        console.log("loaded_pdf", loadedPdf);

        const splittedText = await this.recursiveTextSplitter(loadedPdf, 1000, 200);
        console.log("splitted_text", splittedText);

        const vectorStore = await this.storeDocumentsInQudrant(
            splittedText,
            "http://localhost:6333",
            "learning_langchain",
            embeddings
        );

        await vectorStore.addDocuments(splittedText);
        console.log("Injection Done");

        while (true) {
            const retriever = await this.dataRetriever(
                "http://localhost:6333",
                "learning_langchain",
                embeddings
            );

            // In Node.js, we need to use a package like readline for input
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const userQuery = await new Promise<string>((resolve) => {
                readline.question('> ', (answer: string) => {
                    resolve(answer);
                    readline.close();
                });
            });

            if (userQuery.toLowerCase() === "exit") {
                console.log("Exiting... Goodbye!");
                break;
            }

            const similaritySearchResult = await this.similaritySearch(retriever, userQuery);
            const context = similaritySearchResult[0].pageContent;
            
            const promptTemplate = `
                You are an helpful AI Assistant who is specialized in resolving user query based on the context provided.
                You work on start, plan, generate and observe mode.

                Relevant Context: ${context}

                Also generate some extra information on the user query

                The output should be the combination of helpful information from the context and the extra information generated by you(AI Assistant).
                The output should be in a simple and easy to understand language.
                Also provide any code examples whenever relevant.

                After generating the output, summarize the output in 2 to 3 lines.

                If the user query is relevant to the context provided, then only answer the user query, if it is not relevant to the context then say the question is out of context.

                Rules:
                - Follow the Output JSON Format.
                - Always perform one step at a time and wait for next input 
                - Carefully analyse the user query

                Output JSON Format:
                {
                    "step": "string",
                    "content": "string",
                }
            `;

            const messages = [
                { role: 'system', content: promptTemplate },
                { role: 'user', content: userQuery }
            ];

            while (true) {
                const response = await openAIClient.chat.completions.create({
                    model: 'gemini-2.0-flash',
                    response_format: { type: "json_object" },
                    messages: messages as any
                });

                const content = response.choices[0].message.content;
                if (!content) {
                    console.log("No response content received");
                    continue;
                }
                const parsedOutput = JSON.parse(content);
                messages.push({ role: 'assistant', content: JSON.stringify(parsedOutput) });

                if (parsedOutput.step === 'plan') {
                    console.log(`🧠: ${parsedOutput.content}`);
                    continue;
                }

                if (parsedOutput.step === 'output') {
                    console.log(`🤖: ${parsedOutput.content}`);
                    break;
                }
            }
        }
    }
}





// loadPDF("../../data/nke-10k-2023.pdf");