export class MarkdownTransformers {
    static formatIssue(issue) {
        const lines = [
            `# ${issue.title}`,
            '',
            `**ID:** ${issue.id}`,
            `**Priority:** ${issue.priority}`,
            `**Status:** ${issue.status || 'No status'}`,
            `**Created:** ${this.formatDate(issue.created_at)}`,
            `**Updated:** ${this.formatDate(issue.updated_at)}`,
            ''
        ];
        if (issue.description) {
            lines.push('## Description', '', issue.description, '');
        }
        lines.push('## Content', '', issue.content, '');
        if (issue.tags && issue.tags.length > 0) {
            lines.push('## Tags', '', issue.tags.map(tag => `- ${tag}`).join('\n'), '');
        }
        if (issue.start_date || issue.end_date) {
            lines.push('## Timeline', '');
            if (issue.start_date) {
                lines.push(`**Start:** ${issue.start_date}`);
            }
            if (issue.end_date) {
                lines.push(`**End:** ${issue.end_date}`);
            }
            lines.push('');
        }
        if (issue.related_tasks && issue.related_tasks.length > 0) {
            lines.push('## Related Tasks', '', issue.related_tasks.map(ref => `- ${ref}`).join('\n'), '');
        }
        if (issue.related_documents && issue.related_documents.length > 0) {
            lines.push('## Related Documents', '', issue.related_documents.map(ref => `- ${ref}`).join('\n'), '');
        }
        return lines.join('\n');
    }
    static formatPlan(plan) {
        const lines = [
            `# ${plan.title}`,
            '',
            `**ID:** ${plan.id}`,
            `**Priority:** ${plan.priority}`,
            `**Status:** ${plan.status || 'No status'}`,
            `**Start:** ${plan.start_date || 'Not set'}`,
            `**End:** ${plan.end_date || 'Not set'}`,
            `**Created:** ${this.formatDate(plan.created_at)}`,
            `**Updated:** ${this.formatDate(plan.updated_at)}`,
            ''
        ];
        if (plan.description) {
            lines.push('## Description', '', plan.description, '');
        }
        lines.push('## Content', '', plan.content, '');
        if (plan.tags && plan.tags.length > 0) {
            lines.push('## Tags', '', plan.tags.map(tag => `- ${tag}`).join('\n'), '');
        }
        if (plan.related_tasks && plan.related_tasks.length > 0) {
            lines.push('## Related Tasks', '', plan.related_tasks.map(ref => `- ${ref}`).join('\n'), '');
        }
        if (plan.related_documents && plan.related_documents.length > 0) {
            lines.push('## Related Documents', '', plan.related_documents.map(ref => `- ${ref}`).join('\n'), '');
        }
        return lines.join('\n');
    }
    static formatDocument(doc) {
        const lines = [
            `# ${doc.title}`,
            '',
            `**ID:** ${doc.id}`,
            `**Type:** ${doc.type}`,
            `**Created:** ${this.formatDate(doc.created_at)}`,
            `**Updated:** ${this.formatDate(doc.updated_at)}`,
            ''
        ];
        if (doc.description) {
            lines.push('## Description', '', doc.description, '');
        }
        lines.push('## Content', '', doc.content, '');
        if (doc.tags && doc.tags.length > 0) {
            lines.push('## Tags', '', doc.tags.map(tag => `- ${tag}`).join('\n'), '');
        }
        if (doc.related_tasks && doc.related_tasks.length > 0) {
            lines.push('## Related Tasks', '', doc.related_tasks.map(ref => `- ${ref}`).join('\n'), '');
        }
        if (doc.related_documents && doc.related_documents.length > 0) {
            lines.push('## Related Documents', '', doc.related_documents.map(ref => `- ${ref}`).join('\n'), '');
        }
        return lines.join('\n');
    }
    static formatSession(session) {
        const lines = [
            `# ${session.title}`,
            '',
            `**ID:** ${session.id}`,
            `**Date:** ${session.date}`,
            ''
        ];
        if (session.startTime && session.endTime) {
            lines.push(`**Time:** ${session.startTime} - ${session.endTime}`, '');
        }
        else if (session.startTime) {
            lines.push(`**Started:** ${session.startTime}`, '');
        }
        if (session.summary) {
            lines.push('## Summary', '', session.summary, '');
        }
        if (session.content) {
            lines.push('## Details', '', session.content, '');
        }
        if (session.tags && session.tags.length > 0) {
            lines.push('## Tags', '', session.tags.map(tag => `- ${tag}`).join('\n'), '');
        }
        if (session.related_tasks && session.related_tasks.length > 0) {
            lines.push('## Related Tasks', '', session.related_tasks.map(ref => `- ${ref}`).join('\n'), '');
        }
        if (session.related_documents && session.related_documents.length > 0) {
            lines.push('## Related Documents', '', session.related_documents.map(ref => `- ${ref}`).join('\n'), '');
        }
        return lines.join('\n');
    }
    static formatDate(date) {
        return new Date(date).toLocaleDateString();
    }
}
export class DataConverters {
    static rowToEntity(row, fieldMap) {
        const entity = {};
        for (const [entityField, dbField] of Object.entries(fieldMap)) {
            if (row[dbField] !== undefined) {
                entity[entityField] = row[dbField];
            }
        }
        return entity;
    }
    static entityToRow(entity, fieldMap) {
        const row = {};
        for (const [entityField, dbField] of Object.entries(fieldMap)) {
            const value = entity[entityField];
            if (value !== undefined) {
                row[dbField] = value;
            }
        }
        return row;
    }
    static parseJsonSafe(json, defaultValue) {
        try {
            return JSON.parse(json);
        }
        catch {
            return defaultValue;
        }
    }
    static tagsToCSV(tags) {
        return tags && tags.length > 0 ? tags.join(',') : '';
    }
    static csvToTags(csv) {
        if (!csv || csv.trim() === '') {
            return [];
        }
        return csv.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    }
    static booleanToInt(value) {
        return value ? 1 : 0;
    }
    static intToBoolean(value) {
        return value === 1;
    }
    static normalizePriority(priority) {
        const normalized = priority?.toLowerCase();
        switch (normalized) {
            case 'high':
            case 'medium':
            case 'low':
                return normalized;
            default:
                return 'medium';
        }
    }
    static createReference(type, id) {
        return `${type}-${id}`;
    }
    static parseReference(ref) {
        const match = ref.match(/^([a-z][a-z0-9_]*)-(.+)$/);
        if (!match) {
            return null;
        }
        return {
            type: match[1],
            id: match[2]
        };
    }
}
export class ResponseFormatters {
    static success(data, message) {
        return {
            success: true,
            data,
            ...(message && { message })
        };
    }
    static error(message, code, details) {
        return {
            success: false,
            error: {
                message,
                code,
                details
            }
        };
    }
    static list(items, total, page, limit) {
        return {
            items,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        };
    }
    static summary(entity) {
        const { content: _content, ...summary } = entity;
        return summary;
    }
}
export const FieldMappings = {
    issue: {
        id: 'id',
        title: 'title',
        content: 'content',
        priority: 'priority',
        status: 'status',
        statusId: 'status_id',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        description: 'description',
        startDate: 'start_date',
        endDate: 'end_date'
    },
    document: {
        id: 'id',
        type: 'type',
        title: 'title',
        content: 'content',
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        description: 'description'
    },
    session: {
        id: 'id',
        title: 'title',
        content: 'content',
        category: 'category',
        date: 'date',
        startTime: 'start_time',
        endTime: 'end_time',
        summary: 'summary',
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
};
