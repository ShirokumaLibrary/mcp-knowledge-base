import { formatRelativeDate, formatDate, formatTime, getDateRange, isToday } from '../date-utils.js';
describe('Date Utils', () => {
    // Mock current date for consistent testing
    const mockNow = new Date('2025-01-29T12:00:00Z');
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(mockNow);
    });
    afterEach(() => {
        jest.useRealTimers();
    });
    describe('formatRelativeDate', () => {
        it('should format dates as "just now" for recent times', () => {
            const now = new Date();
            expect(formatRelativeDate(now)).toBe('just now');
            const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);
            expect(formatRelativeDate(thirtySecondsAgo)).toBe('just now');
            const fiftyNineSecondsAgo = new Date(now.getTime() - 59 * 1000);
            expect(formatRelativeDate(fiftyNineSecondsAgo)).toBe('just now');
        });
        it('should format minutes ago correctly', () => {
            const fiveMinutesAgo = new Date(mockNow.getTime() - 5 * 60 * 1000);
            expect(formatRelativeDate(fiveMinutesAgo)).toBe('5 minutes ago');
            const oneMinuteAgo = new Date(mockNow.getTime() - 60 * 1000);
            expect(formatRelativeDate(oneMinuteAgo)).toBe('1 minute ago');
            const fiftyNineMinutesAgo = new Date(mockNow.getTime() - 59 * 60 * 1000);
            expect(formatRelativeDate(fiftyNineMinutesAgo)).toBe('59 minutes ago');
        });
        it('should format hours ago correctly', () => {
            const twoHoursAgo = new Date(mockNow.getTime() - 2 * 60 * 60 * 1000);
            expect(formatRelativeDate(twoHoursAgo)).toBe('2 hours ago');
            const oneHourAgo = new Date(mockNow.getTime() - 60 * 60 * 1000);
            expect(formatRelativeDate(oneHourAgo)).toBe('1 hour ago');
            const twentyThreeHoursAgo = new Date(mockNow.getTime() - 23 * 60 * 60 * 1000);
            expect(formatRelativeDate(twentyThreeHoursAgo)).toBe('23 hours ago');
        });
        it('should format days ago correctly', () => {
            const threeDaysAgo = new Date(mockNow.getTime() - 3 * 24 * 60 * 60 * 1000);
            expect(formatRelativeDate(threeDaysAgo)).toBe('3 days ago');
            const oneDayAgo = new Date(mockNow.getTime() - 24 * 60 * 60 * 1000);
            expect(formatRelativeDate(oneDayAgo)).toBe('1 day ago');
            const twentyNineDaysAgo = new Date(mockNow.getTime() - 29 * 24 * 60 * 60 * 1000);
            expect(formatRelativeDate(twentyNineDaysAgo)).toBe('29 days ago');
        });
        it('should format as locale date string for dates older than 30 days', () => {
            const thirtyOneDaysAgo = new Date(mockNow.getTime() - 31 * 24 * 60 * 60 * 1000);
            const result = formatRelativeDate(thirtyOneDaysAgo);
            expect(result).toBe(thirtyOneDaysAgo.toLocaleDateString());
        });
        it('should handle string dates', () => {
            const dateString = '2025-01-29T11:00:00Z'; // 1 hour ago
            expect(formatRelativeDate(dateString)).toBe('1 hour ago');
        });
    });
    describe('formatDate', () => {
        it('should format dates as YYYY-MM-DD', () => {
            const date = new Date('2025-01-29T12:00:00Z');
            expect(formatDate(date)).toBe('2025-01-29');
        });
        it('should handle different times on same day', () => {
            const morning = new Date('2025-01-29T00:00:00Z');
            const evening = new Date('2025-01-29T23:59:59Z');
            expect(formatDate(morning)).toBe('2025-01-29');
            expect(formatDate(evening)).toBe('2025-01-29');
        });
        it('should handle string dates', () => {
            expect(formatDate('2025-01-29T12:00:00Z')).toBe('2025-01-29');
        });
        it('should pad single digits', () => {
            const date = new Date('2025-01-01T00:00:00Z');
            expect(formatDate(date)).toBe('2025-01-01');
            const date2 = new Date('2025-09-09T00:00:00Z');
            expect(formatDate(date2)).toBe('2025-09-09');
        });
    });
    describe('formatTime', () => {
        it('should format time as HH:MM:SS', () => {
            const date = new Date('2025-01-29T15:30:45Z');
            const result = formatTime(date);
            // Result will be in local timezone, so we check format
            expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
        });
        it('should handle string dates', () => {
            const result = formatTime('2025-01-29T15:30:45Z');
            expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
        });
        it('should pad single digits', () => {
            const date = new Date('2025-01-29T01:02:03Z');
            const result = formatTime(date);
            // Check that it has proper format with padding
            expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
        });
    });
    describe('getDateRange', () => {
        it('should return date range for given days', () => {
            const range = getDateRange(7);
            // End should be today
            expect(range.end).toBe('2025-01-29');
            // Start should be 7 days ago
            const expectedStart = new Date(mockNow);
            expectedStart.setDate(expectedStart.getDate() - 7);
            expect(range.start).toBe(formatDate(expectedStart));
        });
        it('should handle single day range', () => {
            const range = getDateRange(0);
            expect(range.start).toBe(range.end);
            expect(range.start).toBe('2025-01-29');
        });
        it('should handle large day ranges', () => {
            const range = getDateRange(365);
            const expectedStart = new Date(mockNow);
            expectedStart.setDate(expectedStart.getDate() - 365);
            expect(range.start).toBe(formatDate(expectedStart));
            expect(range.end).toBe('2025-01-29');
        });
    });
    describe('isToday', () => {
        it('should return true for today dates', () => {
            expect(isToday(mockNow)).toBe(true);
            // Create dates in local timezone for today
            const todayLocal = new Date();
            expect(isToday(todayLocal)).toBe(true);
        });
        it('should return false for other dates', () => {
            const yesterday = new Date('2025-01-28T12:00:00Z');
            const tomorrow = new Date('2025-01-30T12:00:00Z');
            const lastYear = new Date('2024-01-29T12:00:00Z');
            expect(isToday(yesterday)).toBe(false);
            expect(isToday(tomorrow)).toBe(false);
            expect(isToday(lastYear)).toBe(false);
        });
        it('should handle string dates', () => {
            expect(isToday('2025-01-29T12:00:00Z')).toBe(true);
            expect(isToday('2025-01-28T12:00:00Z')).toBe(false);
        });
        it('should handle dates in local timezone', () => {
            // Create a date that is definitely today in local timezone
            const now = new Date();
            const todayInLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
            expect(isToday(todayInLocal)).toBe(true);
            // Create a date that is definitely yesterday in local timezone
            const yesterdayInLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 12, 0, 0);
            expect(isToday(yesterdayInLocal)).toBe(false);
        });
    });
});
//# sourceMappingURL=date-utils.test.js.map