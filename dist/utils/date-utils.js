export function formatRelativeDate(date) {
    const now = new Date();
    const then = typeof date === 'string' ? new Date(date) : date;
    const diffMs = now.getTime() - then.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffSecs < 60) {
        return 'just now';
    }
    else if (diffMins < 60) {
        return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    }
    else if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }
    else if (diffDays < 30) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
    else {
        return then.toLocaleDateString();
    }
}
export function formatDate(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
}
export function formatTime(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toTimeString().split(' ')[0];
}
export function getDateRange(days) {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    return {
        start: formatDate(start),
        end: formatDate(end)
    };
}
export function isToday(date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    return d.getFullYear() === today.getFullYear() &&
        d.getMonth() === today.getMonth() &&
        d.getDate() === today.getDate();
}
