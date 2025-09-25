-- SynapseAI Form Data Queries
-- Use these SQL commands to view stored form submissions

-- 📧 NEWSLETTER SUBSCRIPTIONS
-- ============================

-- View all newsletter subscriptions (most recent first)
SELECT 
    id,
    email,
    source,
    is_active,
    subscribed_at,
    unsubscribed_at
FROM newsletter_subscriptions 
ORDER BY subscribed_at DESC;

-- Count active vs inactive subscriptions
SELECT 
    is_active,
    COUNT(*) as count
FROM newsletter_subscriptions 
GROUP BY is_active;

-- Recent newsletter subscriptions (last 7 days)
SELECT 
    email,
    source,
    subscribed_at
FROM newsletter_subscriptions 
WHERE subscribed_at >= NOW() - INTERVAL '7 days'
ORDER BY subscribed_at DESC;

-- 💬 CONTACT SUBMISSIONS
-- =======================

-- View all contact form submissions (most recent first)
SELECT 
    id,
    name,
    email,
    subject,
    LEFT(message, 100) || '...' as message_preview,
    source,
    ip_address,
    submitted_at
FROM contact_submissions 
ORDER BY submitted_at DESC;

-- Contact submissions by date
SELECT 
    DATE(submitted_at) as submission_date,
    COUNT(*) as submissions_count
FROM contact_submissions 
GROUP BY DATE(submitted_at)
ORDER BY submission_date DESC;

-- Find priority contact submissions (urgent keywords)
SELECT 
    name,
    email,
    subject,
    message,
    submitted_at
FROM contact_submissions 
WHERE 
    LOWER(message) LIKE '%urgent%' OR
    LOWER(message) LIKE '%partnership%' OR  
    LOWER(message) LIKE '%investment%' OR
    LOWER(message) LIKE '%demo%'
ORDER BY submitted_at DESC;

-- Contact submissions with IP address tracking
SELECT 
    name,
    email,
    ip_address,
    LEFT(user_agent, 50) || '...' as user_agent_preview,
    submitted_at
FROM contact_submissions 
WHERE ip_address IS NOT NULL
ORDER BY submitted_at DESC;

-- 📊 SUMMARY STATISTICS  
-- ======================

-- Overall form submission stats
SELECT 
    'Newsletter Subscriptions' as form_type,
    COUNT(*) as total_submissions,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
FROM newsletter_subscriptions
UNION ALL
SELECT 
    'Contact Submissions' as form_type,
    COUNT(*) as total_submissions,
    COUNT(*) as active_count
FROM contact_submissions;

-- Recent activity (last 24 hours)
SELECT 
    'Newsletter' as source,
    COUNT(*) as recent_submissions
FROM newsletter_subscriptions 
WHERE subscribed_at >= NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
    'Contact' as source,
    COUNT(*) as recent_submissions
FROM contact_submissions 
WHERE submitted_at >= NOW() - INTERVAL '24 hours';


