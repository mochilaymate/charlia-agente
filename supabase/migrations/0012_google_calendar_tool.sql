-- 0012: Add google_calendar to tool_type enum
alter type tool_type add value if not exists 'google_calendar';
