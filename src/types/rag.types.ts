export interface RagRequest {
    pdfPath: string;
    query?: string;
}

export interface RagResponse {
    status: string;
    data: any;
    message: string;
}

export interface AIResponse {
    step: string;
    content: string;
}
