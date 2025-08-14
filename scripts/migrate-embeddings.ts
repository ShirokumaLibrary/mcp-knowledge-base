import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 量子化関数（EnhancedAIServiceV2と同じ実装）
function quantizeEmbedding(embedding: number[]): Buffer {
  const quantized = embedding.map(x => {
    const scaled = Math.round(x * 127);
    return Math.max(-127, Math.min(127, scaled));
  });
  return Buffer.from(quantized.map(x => x + 128));
}

async function migrateEmbeddings() {
  console.log('Starting embedding migration...');
  
  // 1. 既存のJSON embeddingデータを取得
  const items = await prisma.$queryRaw<Array<{id: number, embedding: string}>>`
    SELECT id, embedding FROM items WHERE embedding IS NOT NULL
  `;
  
  console.log(`Found ${items.length} items with embeddings to migrate`);
  
  // 2. 各embeddingを量子化してBytesに変換
  for (const item of items) {
    try {
      const floatEmbedding = JSON.parse(item.embedding) as number[];
      const quantizedBuffer = quantizeEmbedding(floatEmbedding);
      
      // データサイズ比較
      const originalSize = item.embedding.length;
      const newSize = quantizedBuffer.length;
      console.log(`Item ${item.id}: ${originalSize} bytes → ${newSize} bytes (${Math.round((1-newSize/originalSize)*100)}% reduction)`);
      
      // 3. データベースを更新（後でまとめて実行）
      await prisma.$executeRaw`
        UPDATE items SET embedding = ${quantizedBuffer} WHERE id = ${item.id}
      `;
      
    } catch (error) {
      console.error(`Failed to migrate embedding for item ${item.id}:`, error);
    }
  }
  
  console.log('Embedding migration completed!');
}

migrateEmbeddings()
  .catch(console.error)
  .finally(() => prisma.$disconnect());