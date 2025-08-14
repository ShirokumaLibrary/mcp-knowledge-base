export class EmbeddingManager {
  /**
   * Quantize embedding from float32 to uint8 for storage efficiency
   */
  quantizeEmbedding(embedding: number[]): Buffer {
    // Convert float32 [-1,1] to uint8 [0,255] for space efficiency
    const quantized = new Uint8Array(embedding.length);
    for (let i = 0; i < embedding.length; i++) {
      const clamped = Math.max(-1, Math.min(1, embedding[i]));
      quantized[i] = Math.round((clamped + 1) * 127.5);
    }
    return Buffer.from(quantized);
  }

  /**
   * Dequantize embedding from uint8 back to float32
   */
  dequantizeEmbedding(buffer: Buffer): number[] {
    const embedding = new Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      embedding[i] = (buffer[i] / 127.5) - 1;
    }
    return embedding;
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  calculateSimilarity(embedding1: Buffer | Uint8Array | number[], embedding2: Buffer | Uint8Array | number[]): number {
    let vec1: number[];
    let vec2: number[];

    // Convert inputs to number arrays
    if (embedding1 instanceof Buffer || embedding1 instanceof Uint8Array) {
      vec1 = this.dequantizeEmbedding(Buffer.from(embedding1));
    } else {
      vec1 = embedding1;
    }

    if (embedding2 instanceof Buffer || embedding2 instanceof Uint8Array) {
      vec2 = this.dequantizeEmbedding(Buffer.from(embedding2));
    } else {
      vec2 = embedding2;
    }

    if (vec1.length !== vec2.length) {
      // Embedding dimension mismatch, returning 0 similarity
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Generate embedding from weighted keywords
   */
  generateEmbedding(keywords: Array<{ word: string; weight: number }>): number[] {
    // Create a simple but effective embedding from weighted keywords
    const embedding = new Array(128).fill(0);

    for (let i = 0; i < keywords.length && i < 10; i++) {
      const word = keywords[i].word.toLowerCase();
      const weight = keywords[i].weight;

      // Simple hash-based embedding generation
      let hash = 0;
      for (let j = 0; j < word.length; j++) {
        hash = ((hash << 5) - hash + word.charCodeAt(j)) & 0xffffffff;
      }

      // Distribute the hash across multiple dimensions
      for (let dim = 0; dim < 8; dim++) {
        const index = (Math.abs(hash) + dim * 16) % 128;
        embedding[index] += weight * (0.5 + 0.5 * Math.sin(hash + dim));
      }
    }

    // Normalize to [-1, 1] range
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= magnitude;
      }
    }

    return embedding;
  }
}