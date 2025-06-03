import OpenAI from "openai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { QdrantVectorStore } from "@langchain/qdrant";

import { config } from "../config";

const GOOGLE_APPLICATION_CREDENTIALS = config.models.llm.googleAuthJsonPath;

const openAIClient = new OpenAI({
    baseURL: config.models.llm.baseUrl,
    apiKey: config.models.llm.apiKey,
})



async function loadPDF(path: string) {
    const loader = new PDFLoader(path);

    return await loader.load();
    // console.log('docs', docs);
    
}

async function recursiveTextSplitter(docs: any, chunkSize: number, chunkOverlap: number) {
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize,
        chunkOverlap,
    });

    return splitter.splitDocuments(docs);
}

async function embeddingModel(modelName: string) {
    return new GoogleGenerativeAIEmbeddings({
        model: modelName
    });
}

async function storeDocumentsInQudrant(documents: any, url: string, collection_name: string, embedding: typeof GoogleGenerativeAIEmbeddings) {
    return QdrantVectorStore.fromDocuments(documents,
        url,
        collection_name,
        embedding)
}



loadPDF("../../data/nke-10k-2023.pdf");