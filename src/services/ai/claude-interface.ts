import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface EnrichedMetadata {
  keywords: Array<{ keyword: string; weight: number }>;
  concepts: Array<{ concept: string; confidence: number }>;
  embedding: Buffer; // Quantized embedding as Buffer
  summary: string;
  searchIndex?: string;
}

export class ClaudeInterface {
  /**
   * Call Claude CLI for one-time enrichment with JSON output
   */
  async callClaude(prompt: string, input: string): Promise<string> {
    try {
      const escapedInput = input.replace(/'/g, "'\\''");
      const escapedPrompt = prompt.replace(/"/g, '\\"');
      // Use simple claude command without extra options
      const command = `echo '${escapedInput}' | claude --model sonnet "${escapedPrompt}"`;

      const { stdout } = await execAsync(command, {
        maxBuffer: 1024 * 1024 * 10,
        timeout: 30000,
        env: { ...process.env }
      });

      // Claude CLI output received
      // Just return the raw output - it should be JSON or markdown-wrapped JSON
      return stdout.trim();
    } catch {
      // Claude CLI call failed, return empty JSON so fallback can be used
      return '{}';
    }
  }

  /**
   * Extract weighted keywords and generate enriched metadata using Claude
   */
  async extractWeightedKeywords(content: Record<string, string>): Promise<EnrichedMetadata> {
    const text = `${content.title} ${content.description} ${content.content}`.trim();

    if (!text) {
      return this.fallbackExtraction('');
    }

    const prompt = `Analyze this text and extract important keywords.
Rules:
1. Extract keywords in ENGLISH whenever possible (translate common concepts to English)
2. Break down compound words and technical terms:
   - "GraphDB" → extract both "graph" and "database" as separate keywords
   - "GraphRAG" → extract "graph", "rag", "retrieval"
   - "MLOps" → extract "ml", "machine learning", "ops", "operations"
   - "TensorFlow" → extract "tensor", "flow", "tensorflow"
3. Normalize to base/singular forms (e.g., "running" -> "run", "databases" -> "database")
4. Include both the original compound term AND its components as keywords
5. Assign weights: compound terms get 0.6-1.0, component parts get 0.4-0.8
6. Maximum 20 keywords total
7. Concepts should be high-level categories like "authentication", "database", "optimization", etc.

You MUST output valid JSON only with this exact structure:
{
  "keywords": [{"keyword": "example", "weight": 0.9}],
  "concepts": [{"concept": "category", "confidence": 0.8}],
  "summary": "brief summary in English"
}

No additional text, only the JSON object.`;

    try {
      const result = await this.callClaude(prompt, text);
      // Clean up the response - remove markdown code blocks if present
      let cleanedResult = result;
      if (result.includes('```json')) {
        cleanedResult = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      }
      const parsed = JSON.parse(cleanedResult);

      // Validate and fallback if needed
      if (!parsed.keywords || !Array.isArray(parsed.keywords) || parsed.keywords.length === 0) {
        // Claude returned invalid/empty keywords, using fallback
        return this.fallbackExtraction(text);
      }

      // Generate embedding from keywords
      const embedding = this.generateEmbedding(parsed.keywords);

      // Transform word to keyword if needed
      const keywords = parsed.keywords.map((k: { keyword?: string; word?: string; weight: number }) => ({
        keyword: k.keyword || k.word,
        weight: k.weight
      }));

      // Concepts successfully extracted

      return {
        keywords: keywords.slice(0, 15), // Limit to 15 keywords
        concepts: parsed.concepts || [],
        embedding: this.quantizeEmbedding(embedding),
        summary: parsed.summary || text.substring(0, 200),
        searchIndex: text.substring(0, 500)
      };

    } catch {
      // Failed to parse Claude response, using fallback
      return this.fallbackExtraction(text);
    }
  }

  private quantizeEmbedding(embedding: number[]): Buffer {
    // Convert float32 [-1,1] to uint8 [0,255] for space efficiency
    const quantized = new Uint8Array(embedding.length);
    for (let i = 0; i < embedding.length; i++) {
      const clamped = Math.max(-1, Math.min(1, embedding[i]));
      quantized[i] = Math.round((clamped + 1) * 127.5);
    }
    return Buffer.from(quantized);
  }

  private generateEmbedding(keywords: Array<{ keyword?: string; word?: string; weight: number }>): number[] {
    // Create a simple but effective embedding from weighted keywords
    const embedding = new Array(128).fill(0);

    for (let i = 0; i < keywords.length && i < 10; i++) {
      const word = (keywords[i].keyword || keywords[i].word || '').toLowerCase();
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

  private fallbackExtraction(text: string): EnrichedMetadata {
    // Simple fallback when Claude is unavailable
    const words = text.toLowerCase().match(/\b\w{3,}\b/g) || [];
    const wordFreq = new Map<string, number>();

    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    const keywords = Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word, freq]) => ({
        keyword: word,
        weight: Math.min(freq / words.length * 10, 1.0)
      }));

    if (keywords.length === 0) {
      keywords.push({ keyword: 'content', weight: 0.5 });
    }

    const embedding = this.generateEmbedding(keywords);

    return {
      keywords,
      concepts: [],
      embedding: this.quantizeEmbedding(embedding),
      summary: text.substring(0, 200) || 'No content available',
      searchIndex: text.substring(0, 500)
    };
  }
}