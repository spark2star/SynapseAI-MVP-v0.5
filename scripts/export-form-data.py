#!/usr/bin/env python3
"""
SynapseAI Form Data Export Script
Export newsletter subscriptions and contact submissions to CSV
"""
import os
import sys
import csv
import json
from datetime import datetime
from typing import List, Dict, Any

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.newsletter import NewsletterSubscription
from app.models.contact import ContactSubmission
from app.core.database import get_database_url

def export_newsletter_subscriptions(session, output_dir: str = "exports") -> str:
    """Export newsletter subscriptions to CSV"""
    os.makedirs(output_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{output_dir}/newsletter_subscriptions_{timestamp}.csv"
    
    subscriptions = session.query(NewsletterSubscription).order_by(NewsletterSubscription.subscribed_at.desc()).all()
    
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        
        # Header
        writer.writerow([
            'ID', 'Email', 'Source', 'Is Active', 'Subscribed At', 'Unsubscribed At'
        ])
        
        # Data
        for sub in subscriptions:
            writer.writerow([
                sub.id,
                sub.email,
                sub.source,
                'Yes' if sub.is_active else 'No',
                sub.subscribed_at.strftime('%Y-%m-%d %H:%M:%S') if sub.subscribed_at else '',
                sub.unsubscribed_at.strftime('%Y-%m-%d %H:%M:%S') if sub.unsubscribed_at else ''
            ])
    
    print(f"📧 Newsletter subscriptions exported: {filename}")
    print(f"   Total subscriptions: {len(subscriptions)}")
    print(f"   Active subscriptions: {len([s for s in subscriptions if s.is_active])}")
    return filename

def export_contact_submissions(session, output_dir: str = "exports") -> str:
    """Export contact submissions to CSV"""
    os.makedirs(output_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{output_dir}/contact_submissions_{timestamp}.csv"
    
    submissions = session.query(ContactSubmission).order_by(ContactSubmission.submitted_at.desc()).all()
    
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        
        # Header
        writer.writerow([
            'ID', 'Name', 'Email', 'Subject', 'Message', 'Source', 'IP Address', 
            'User Agent', 'Submitted At'
        ])
        
        # Data
        for sub in submissions:
            writer.writerow([
                sub.id,
                sub.name,
                sub.email,
                sub.subject or '',
                sub.message[:500] + '...' if len(sub.message) > 500 else sub.message,
                sub.source,
                sub.ip_address or '',
                (sub.user_agent[:100] + '...') if sub.user_agent and len(sub.user_agent) > 100 else (sub.user_agent or ''),
                sub.submitted_at.strftime('%Y-%m-%d %H:%M:%S') if sub.submitted_at else ''
            ])
    
    print(f"💬 Contact submissions exported: {filename}")
    print(f"   Total submissions: {len(submissions)}")
    return filename

def export_json_data(session, output_dir: str = "exports") -> str:
    """Export all data to JSON format"""
    os.makedirs(output_dir, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{output_dir}/form_data_{timestamp}.json"
    
    # Get all data
    subscriptions = session.query(NewsletterSubscription).all()
    contacts = session.query(ContactSubmission).all()
    
    data = {
        "export_timestamp": datetime.now().isoformat(),
        "newsletter_subscriptions": [
            {
                "id": s.id,
                "email": s.email,
                "source": s.source,
                "is_active": s.is_active,
                "subscribed_at": s.subscribed_at.isoformat() if s.subscribed_at else None,
                "unsubscribed_at": s.unsubscribed_at.isoformat() if s.unsubscribed_at else None
            }
            for s in subscriptions
        ],
        "contact_submissions": [
            {
                "id": c.id,
                "name": c.name,
                "email": c.email,
                "subject": c.subject,
                "message": c.message,
                "source": c.source,
                "ip_address": c.ip_address,
                "user_agent": c.user_agent,
                "submitted_at": c.submitted_at.isoformat() if c.submitted_at else None
            }
            for c in contacts
        ]
    }
    
    with open(filename, 'w', encoding='utf-8') as jsonfile:
        json.dump(data, jsonfile, indent=2, ensure_ascii=False)
    
    print(f"📄 JSON data exported: {filename}")
    return filename

def main():
    """Main export function"""
    print("🚀 SynapseAI Form Data Export")
    print("=" * 40)
    
    try:
        # Create database connection
        database_url = get_database_url()
        engine = create_engine(database_url)
        SessionLocal = sessionmaker(bind=engine)
        session = SessionLocal()
        
        # Export all formats
        csv_newsletter = export_newsletter_subscriptions(session)
        csv_contact = export_contact_submissions(session)
        json_file = export_json_data(session)
        
        print(f"\n✅ Export completed successfully!")
        print(f"📁 Files created:")
        print(f"   - {csv_newsletter}")
        print(f"   - {csv_contact}")
        print(f"   - {json_file}")
        
        session.close()
        
    except Exception as e:
        print(f"❌ Export failed: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())


