import { Chunk } from '@echodocs/types';

export interface SystemQAPair {
  question: string;
  answer: string;
  keywords: string[];
}

export const SYSTEM_QA_PAIRS: SystemQAPair[] = [
  {
    question: 'What is this application about?',
    answer: 'EchoDocs is an advanced document management and Retrieval-Augmented Generation (RAG) platform. It allows users to upload documents (such as PDF and Markdown files), automatically chunks and embeds them using high-dimensional vector representations, and indexes them into a pgvector-enabled database. Users can then query their uploaded documents using a conversational AI interface. The system retrieves relevant document context and feeds it into the Gemini 3.5 Flash model to synthesize precise answers backed by citations to the source materials.',
    keywords: ['what is this application about', 'what is this app', 'about this app', 'purpose of this application']
  },
  {
    question: 'How do I upload new documents?',
    answer: "To upload new documents in EchoDocs, navigate to the Document Management page (Dashboard) from the main menu. If your account has Administrator privileges, you will see a 'Upload New Materials' section. You can drag and drop your PDF or Markdown files directly into the upload area or click the browse button to select files from your system. After selection, the application will show the upload progress as the backend saves the files, parses their text content, breaks them into logical chunks, generates vector embeddings, and stores them in the database for instant retrieval.",
    keywords: ['how do i upload new documents', 'how to upload', 'uploading documents', 'upload new documents', 'how do i upload documents', 'how to ingest documents']
  },
  {
    question: 'What kind of files are supported for ingestion?',
    answer: 'EchoDocs currently supports PDF (`.pdf`) and Markdown (`.md`) documents. The file size limit is 20 MB per file to ensure efficient processing and indexing. Uploaded documents must contain extractable text content to be chunked and indexed correctly by our vector search engine.',
    keywords: ['what kind of files are supported', 'what files are supported', 'supported files', 'supported file types', 'supported formats', 'what kind of files can i upload']
  },
  {
    question: 'Explain how the RAG model answers my questions.',
    answer: 'The Retrieval-Augmented Generation (RAG) model in EchoDocs works in five sequential steps:\n1. **Embedding**: When you ask a question, the EchoDocs API sends the query to the Gemini embedding service to generate a 768-dimensional vector representation.\n2. **Vector Search**: The system uses the pgvector cosine distance operator (`<=>`) to search the database for the top 5 document chunks most similar to your query embedding.\n3. **Similarity Filtering**: Chunks with a distance score greater than the 0.7 threshold (similarity lower than 0.3) are filtered out to prevent irrelevant information.\n4. **Context Construction**: The remaining highly relevant chunks are compiled into a structured prompt along with their document names and chunk indexes.\n5. **Synthesis & Citation**: Gemini 3.5 Flash processes this prompt to formulate a precise answer, citing the matching sections using bracketed indices (e.g., [1], [2]) pointing directly to the sources used.',
    keywords: ['explain how the rag model answers', 'how the rag model works', 'how does the rag model', 'rag model answers', 'explain the rag model', 'what is the rag model']
  }
];

/**
 * Checks if the user's query matches any of our system suggested questions
 * or is semantically asking the same thing based on key phrases/keywords.
 * If there is a match, it returns a simulated Chunk containing the answer as context.
 */
export function getSystemRelevantChunks(query: string): Chunk[] {
  if (!query || query.trim() === '') {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim().replace(/[?.,!]/g, '');
  const matchedPairs: SystemQAPair[] = [];

  for (const pair of SYSTEM_QA_PAIRS) {
    const normalizedQuestion = pair.question.toLowerCase().trim().replace(/[?.,!]/g, '');
    
    // 1. Direct or close match on the full question
    if (normalizedQuery === normalizedQuestion || normalizedQuery.includes(normalizedQuestion)) {
      matchedPairs.push(pair);
      continue;
    }

    // 2. Keyword/phrase match
    for (const keyword of pair.keywords) {
      const cleanKeyword = keyword.toLowerCase().trim();
      if (normalizedQuery.includes(cleanKeyword)) {
        matchedPairs.push(pair);
        break; // matched this pair, move to next pair
      }
    }
  }

  // Map matches to simulated Chunks
  return matchedPairs.map((pair, index) => ({
    id: `system-faq-${index}`,
    content: `Question: ${pair.question}\nAnswer: ${pair.answer}`,
    chunkIndex: index,
    documentId: 'system-faq-doc',
    document: {
      id: 'system-faq-doc',
      name: 'EchoDocs System FAQs',
      status: 'PROCESSED',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    distance: 0.1, // Set a low distance to guarantee passing the threshold check
  } as unknown as Chunk));
}
