export class SessionMarkdownFormatter {
    generateSessionMarkdown(session) {
        let content = '---\n';
        content += `id: ${session.id}\n`;
        content += `title: "${session.title}"\n`;
        if (session.description) {
            content += `description: "${session.description}"\n`;
        }
        if (session.tags && session.tags.length > 0) {
            content += `tags: [${session.tags.map(tag => `"${tag}"`).join(', ')}]\n`;
        }
        if (session.related && session.related.length > 0) {
            content += `related: [${session.related.map((r) => `"${r}"`).join(', ')}]\n`;
        }
        content += `date: ${session.date}\n`;
        content += `createdAt: ${session.createdAt}\n`;
        if (session.updatedAt) {
            content += `updatedAt: ${session.updatedAt}\n`;
        }
        content += '---\n\n';
        if (session.content) {
            content += session.content;
        }
        return content;
    }
    generateLegacySessionMarkdown(session) {
        let markdown = `# ${session.title}\n\n`;
        markdown += `**Created**: ${session.createdAt}\n`;
        if (session.updatedAt) {
            markdown += `**Updated**: ${session.updatedAt}\n`;
        }
        markdown += '\n';
        if (session.content) {
            markdown += `\n${session.content}\n`;
        }
        return markdown;
    }
    parseSessionFromMarkdown(content, sessionId, date) {
        const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
        if (frontMatterMatch) {
            return this.parseFrontMatterSession(frontMatterMatch, sessionId, date);
        }
        else {
            return this.parseLegacySession(content, sessionId, date);
        }
    }
    parseFrontMatterSession(match, sessionId, date) {
        const frontMatter = match[1];
        const bodyContent = match[2];
        const titleMatch = frontMatter.match(/title: "(.+)"/);
        const descriptionMatch = frontMatter.match(/description: "(.+)"/);
        const tagsMatch = frontMatter.match(/tags: \[(.*)\]/);
        const relatedMatch = frontMatter.match(/related: \[(.*)\]/);
        const createdAtMatch = frontMatter.match(/createdAt: (.+)/);
        const updatedAtMatch = frontMatter.match(/updatedAt: (.+)/);
        const content = bodyContent.trim() || undefined;
        return {
            id: sessionId,
            title: titleMatch?.[1] || 'Unknown Session',
            description: descriptionMatch?.[1],
            content,
            tags: tagsMatch?.[1] ? tagsMatch[1].split(', ').map(tag => tag.replace(/"/g, '')) : undefined,
            related: relatedMatch?.[1] ? relatedMatch[1].split(', ').map((r) => r.replace(/"/g, '')) : undefined,
            date,
            createdAt: createdAtMatch?.[1] || '',
            updatedAt: updatedAtMatch?.[1]
        };
    }
    parseLegacySession(content, sessionId, date) {
        const lines = content.split('\n');
        const titleMatch = lines[0].match(/^# (.+)$/);
        const title = titleMatch ? titleMatch[1] : 'Unknown Session';
        const createdAtMatch = content.match(/\*\*Created\*\*: (.+)/);
        const updatedAtMatch = content.match(/\*\*Updated\*\*: (.+)/);
        const contentStart = content.indexOf('\n\n', content.indexOf('\n\n') + 2);
        const bodyContent = contentStart !== -1 ? content.substring(contentStart).trim() : '';
        return {
            id: sessionId,
            title,
            date,
            createdAt: createdAtMatch?.[1] || '',
            updatedAt: updatedAtMatch?.[1],
            content: bodyContent || undefined
        };
    }
    generateDailyMarkdown(summary) {
        let content = '---\n';
        content += `date: ${summary.date}\n`;
        content += `title: "${summary.title}"\n`;
        if (summary.description) {
            content += `description: "${summary.description}"\n`;
        }
        if (summary.tags.length > 0) {
            content += `tags: [${summary.tags.map(tag => `"${tag}"`).join(', ')}]\n`;
        }
        if (summary.related && summary.related.length > 0) {
            content += `related: [${summary.related.map((r) => `"${r}"`).join(', ')}]\n`;
        }
        content += `createdAt: ${summary.createdAt}\n`;
        if (summary.updatedAt) {
            content += `updatedAt: ${summary.updatedAt}\n`;
        }
        content += '---\n\n';
        content += `# ${summary.title}\n\n`;
        content += summary.content;
        return content;
    }
    parseDailyFromMarkdown(content, date) {
        const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
        if (!frontMatterMatch) {
            return null;
        }
        const frontMatter = frontMatterMatch[1];
        const bodyContent = frontMatterMatch[2];
        const dateMatch = frontMatter.match(/date: (.+)/);
        const titleMatch = frontMatter.match(/title: "(.+)"/);
        const descriptionMatch = frontMatter.match(/description: "(.+)"/);
        const tagsMatch = frontMatter.match(/tags: \[(.*)\]/);
        const relatedMatch = frontMatter.match(/related: \[(.*)\]/);
        const createdAtMatch = frontMatter.match(/createdAt: (.+)/);
        const updatedAtMatch = frontMatter.match(/updatedAt: (.+)/);
        return {
            date: dateMatch?.[1] || date,
            title: titleMatch?.[1] || 'Untitled',
            description: descriptionMatch?.[1],
            content: bodyContent.replace(/^# .+\n\n/, '').trim(),
            tags: tagsMatch?.[1] ? tagsMatch[1].split(', ').map(tag => tag.replace(/"/g, '')) : [],
            related: relatedMatch?.[1] ? relatedMatch[1].split(', ').map((r) => r.replace(/"/g, '')) : [],
            createdAt: createdAtMatch?.[1] || '',
            updatedAt: updatedAtMatch?.[1]
        };
    }
}
