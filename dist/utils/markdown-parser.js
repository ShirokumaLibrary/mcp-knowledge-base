export function parseMarkdown(fileContent) {
    const lines = fileContent.split('\n');
    const metadata = {};
    let contentStartIndex = -1;
    if (lines[0] === '---') {
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line === '---') {
                contentStartIndex = i + 1;
                break;
            }
            const match = line.match(/^(\w+):\s*(.*)$/);
            if (match) {
                const [, key, value] = match;
                if (value.trim() === '') {
                    metadata[key] = null;
                }
                else if (key === 'tags' || key === 'related_tasks' || key === 'related_documents' || key === 'related') {
                    if (value.trim().startsWith('[') && value.trim().endsWith(']')) {
                        try {
                            metadata[key] = JSON.parse(value);
                        }
                        catch {
                            const items = value.split(',').map(v => v.trim()).filter(v => v);
                            metadata[key] = items;
                        }
                    }
                    else {
                        const items = value.split(',').map(v => v.trim()).filter(v => v);
                        metadata[key] = items;
                    }
                }
                else if (value.includes(',')) {
                    const items = value.split(',').map(v => v.trim()).filter(v => v);
                    if (items.length > 0 && items.every(item => !isNaN(Number(item)))) {
                        metadata[key] = items.map(item => Number(item));
                    }
                    else {
                        metadata[key] = items;
                    }
                }
                else if (value === 'true' || value === 'false') {
                    metadata[key] = value === 'true';
                }
                else if (!isNaN(Number(value))) {
                    metadata[key] = Number(value);
                }
                else {
                    metadata[key] = value.trim();
                }
            }
        }
    }
    const content = contentStartIndex >= 0
        ? lines.slice(contentStartIndex).join('\n').trim()
        : fileContent.trim();
    return { metadata, content };
}
export function generateMarkdown(metadata, content) {
    const lines = ['---'];
    for (const [key, value] of Object.entries(metadata)) {
        if (value === null || value === undefined) {
            lines.push(`${key}: `);
        }
        else if (Array.isArray(value)) {
            lines.push(`${key}: ${JSON.stringify(value)}`);
        }
        else {
            lines.push(`${key}: ${value}`);
        }
    }
    lines.push('---', '', content);
    return lines.join('\n');
}
export function parseDocumentMarkdown(fileContent, id, type) {
    const { metadata, content } = parseMarkdown(fileContent);
    return {
        id,
        type: metadata.type || type,
        title: metadata.title || '',
        description: metadata.description || undefined,
        content,
        tags: metadata.tags || [],
        created_at: metadata.created_at || new Date().toISOString(),
        updated_at: metadata.updated_at || new Date().toISOString()
    };
}
export function generateDocumentMarkdown(document) {
    const metadata = {
        id: document.id,
        type: document.type,
        title: document.title,
        tags: document.tags,
        created_at: document.created_at,
        updated_at: document.updated_at
    };
    if (document.description) {
        metadata.description = document.description;
    }
    return generateMarkdown(metadata, document.content);
}
