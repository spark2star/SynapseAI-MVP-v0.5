# 📊 SynapseAI Form Data Access Guide

## 🗃️ **Where Your Form Data is Stored**

Both **newsletter subscriptions** and **contact form submissions** are securely stored in your PostgreSQL database:

- **📧 Newsletter**: `newsletter_subscriptions` table
- **💬 Contact Forms**: `contact_submissions` table

---

## 🔍 **Access Methods**

### **1. Quick Export Script (Recommended)**
```bash
# Export all form data to CSV and JSON
cd scripts
python3 export-form-data.py
```

**Outputs:**
- `exports/newsletter_subscriptions_YYYYMMDD_HHMMSS.csv`
- `exports/contact_submissions_YYYYMMDD_HHMMSS.csv` 
- `exports/form_data_YYYYMMDD_HHMMSS.json`

### **2. Database Queries (SQL)**
```bash
# Connect to your database
docker-compose exec postgres psql -U synapseai_user -d synapseai_dev

# Or use the SQL file
psql -U synapseai_user -d synapseai_dev -f scripts/view-form-data.sql
```

### **3. pgAdmin Web Interface**
Access: **http://localhost:5050**
- Email: `admin@synapseai.com`
- Password: `admin`
- Server: `postgres` (port 5432)

### **4. Direct Docker Access**
```bash
# Quick view of newsletter subscriptions
docker-compose exec postgres psql -U synapseai_user -d synapseai_dev -c "SELECT email, subscribed_at FROM newsletter_subscriptions ORDER BY subscribed_at DESC LIMIT 10;"

# Quick view of contact submissions  
docker-compose exec postgres psql -U synapseai_user -d synapseai_dev -c "SELECT name, email, subject, submitted_at FROM contact_submissions ORDER BY submitted_at DESC LIMIT 10;"
```

---

## 📋 **Data Structure**

### **Newsletter Subscriptions**
- `id` - Unique identifier
- `email` - Email address (unique, validated)
- `source` - Where they signed up (landing_page)
- `is_active` - Whether subscription is active
- `subscribed_at` - When they subscribed
- `unsubscribed_at` - When they unsubscribed (if applicable)

### **Contact Submissions**
- `id` - Unique identifier
- `name` - Full name from form
- `email` - Email address
- `subject` - Subject line (optional)
- `message` - Full message content
- `source` - Where they submitted (landing_page)
- `ip_address` - IP address for security
- `user_agent` - Browser information
- `submitted_at` - Submission timestamp

---

## 🚨 **Important Security Notes**

- ✅ **IP addresses are logged** for security monitoring
- ✅ **Rate limiting** prevents spam (5 req/min, 100 req/hour)
- ✅ **Content validation** blocks malicious submissions
- ✅ **Data encryption** at rest and in transit
- ✅ **GDPR compliant** with proper data retention

---

## 📈 **Quick Stats Queries**

```sql
-- Total newsletter subscribers
SELECT COUNT(*) FROM newsletter_subscriptions WHERE is_active = true;

-- Contact submissions today
SELECT COUNT(*) FROM contact_submissions WHERE DATE(submitted_at) = CURRENT_DATE;

-- Priority contact submissions (urgent keywords)
SELECT * FROM contact_submissions 
WHERE LOWER(message) LIKE '%urgent%' OR LOWER(message) LIKE '%demo%'
ORDER BY submitted_at DESC;
```

---

## 🔄 **Automated Exports**

Add to your crontab for regular exports:
```bash
# Export form data daily at 2 AM
0 2 * * * cd /path/to/SynapseAI/scripts && python3 export-form-data.py
```

---

## 📞 **Need Help?**

If you need help accessing your data:
1. Check if containers are running: `docker-compose ps`
2. Check database connection: `docker-compose exec postgres pg_isready`
3. View recent logs: `docker-compose logs postgres`

**Your visitor data is safe and easily accessible! 🔐✨**


