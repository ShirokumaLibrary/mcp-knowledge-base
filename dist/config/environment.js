import path from 'path';
export function getEnvironmentConfig() {
    const rootDir = process.env.DATABASE_ROOT ||
        process.env.MCP_DATABASE_ROOT ||
        '.shirokuma/data';
    const isProduction = process.env.NODE_ENV === 'production';
    const isTest = process.env.NODE_ENV === 'test';
    if (isTest && rootDir === '.database') {
        throw new Error('テスト環境で本番ディレクトリ（.database）は使用できません');
    }
    if (!isProduction && rootDir === '.database') {
        console.error('警告: 開発環境で本番ディレクトリ（.database）を使用しています');
    }
    return {
        rootDir,
        dbPath: path.join(rootDir, 'knowledge.db'),
        markdownDir: rootDir,
        indexDbPath: path.join(rootDir, 'index.db'),
        currentStatePath: path.join(rootDir, 'current_state.md'),
        isProduction,
        isTest
    };
}
export function validateEnvironmentConfig(config) {
    if (config.isProduction && config.rootDir !== '.database') {
        console.warn('本番環境ですが、デフォルト以外のディレクトリを使用しています:', config.rootDir);
    }
    if (config.rootDir.includes('..')) {
        throw new Error('不正なパスが検出されました: ' + config.rootDir);
    }
}
export function logEnvironmentConfig(config) {
    if (config.isTest || process.env.LOG_LEVEL === 'debug') {
        console.error('=== 環境設定 ===');
        console.error(`環境: ${config.isProduction ? '本番' : config.isTest ? 'テスト' : '開発'}`);
        console.error(`ルートディレクトリ: ${config.rootDir}`);
        console.error(`データベース: ${config.dbPath}`);
        console.error('================');
    }
}
