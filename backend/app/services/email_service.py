"""
Email Service with Enhanced Debugging
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, Optional
from datetime import datetime
import logging
import traceback

from app.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class EmailService:
    def __init__(self):
        self.smtp_host = settings.SMTP_HOST
        self.smtp_port = settings.SMTP_PORT
        self.smtp_user = settings.SMTP_USER
        self.smtp_password = settings.SMTP_PASSWORD
        self.from_email = settings.SMTP_FROM_EMAIL
        self.from_name = settings.SMTP_FROM_NAME
        self.admin_email = settings.ADMIN_EMAIL
        
        # Log configuration on initialization
        logger.info("=" * 60)
        logger.info("EMAIL SERVICE INITIALIZED")
        logger.info("=" * 60)
        logger.info(f"SMTP Host: {self.smtp_host}")
        logger.info(f"SMTP Port: {self.smtp_port}")
        logger.info(f"SMTP User: {self.smtp_user}")
        logger.info(f"SMTP Password: {'*' * len(self.smtp_password) if self.smtp_password else 'NOT SET'}")
        logger.info(f"From Email: {self.from_email}")
        logger.info(f"Admin Email: {self.admin_email}")
        logger.info("=" * 60)
        
        # Validate configuration
        if not self.smtp_user:
            logger.error("❌ SMTP_USER is not set in environment variables!")
        if not self.smtp_password:
            logger.error("❌ SMTP_PASSWORD is not set in environment variables!")
        if not self.admin_email:
            logger.error("❌ ADMIN_EMAIL is not set in environment variables!")
    
    def _send_email(self, to_email: str, subject: str, html_body: str) -> bool:
        """
        Send email with detailed error logging
        """
        logger.info("=" * 60)
        logger.info("ATTEMPTING TO SEND EMAIL")
        logger.info("=" * 60)
        logger.info(f"To: {to_email}")
        logger.info(f"Subject: {subject}")
        logger.info(f"SMTP Server: {self.smtp_host}:{self.smtp_port}")
        logger.info(f"SMTP User: {self.smtp_user}")
        
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            
            part = MIMEText(html_body, 'html')
            msg.attach(part)
            
            logger.info("✓ Email message created")
            
            # Connect to SMTP server
            logger.info(f"Connecting to SMTP server: {self.smtp_host}:{self.smtp_port}")
            server = smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=10)
            logger.info("✓ Connected to SMTP server")
            
            # Enable debug output
            server.set_debuglevel(1)
            
            # Start TLS
            logger.info("Starting TLS...")
            server.starttls()
            logger.info("✓ TLS started")
            
            # Login
            logger.info(f"Logging in as: {self.smtp_user}")
            server.login(self.smtp_user, self.smtp_password)
            logger.info("✓ Login successful")
            
            # Send email
            logger.info("Sending email...")
            server.send_message(msg)
            logger.info("✓ Email sent")
            
            # Close connection
            server.quit()
            logger.info("✓ Connection closed")
            
            logger.info("=" * 60)
            logger.info(f"✅ EMAIL SENT SUCCESSFULLY TO {to_email}")
            logger.info("=" * 60)
            return True
            
        except smtplib.SMTPAuthenticationError as e:
            logger.error("=" * 60)
            logger.error("❌ SMTP AUTHENTICATION ERROR")
            logger.error("=" * 60)
            logger.error(f"Error: {str(e)}")
            logger.error("Possible causes:")
            logger.error("1. App Password is incorrect")
            logger.error("2. 2FA is not enabled on Gmail")
            logger.error("3. Less secure app access is blocked")
            logger.error(f"Username used: {self.smtp_user}")
            logger.error(f"Password length: {len(self.smtp_password)}")
            logger.error("=" * 60)
            return False
            
        except smtplib.SMTPException as e:
            logger.error("=" * 60)
            logger.error("❌ SMTP ERROR")
            logger.error("=" * 60)
            logger.error(f"Error: {str(e)}")
            logger.error(f"Error type: {type(e).__name__}")
            logger.error("=" * 60)
            return False
            
        except Exception as e:
            logger.error("=" * 60)
            logger.error("❌ UNEXPECTED ERROR")
            logger.error("=" * 60)
            logger.error(f"Error: {str(e)}")
            logger.error(f"Error type: {type(e).__name__}")
            logger.error("Traceback:")
            logger.error(traceback.format_exc())
            logger.error("=" * 60)
            return False
    
    def send_demo_request_notification(self, demo_request: Dict[str, Any]) -> bool:
        """Send demo request notification to admin"""
        logger.info(f"📧 Preparing to send demo request notification for: {demo_request.get('full_name')}")
        
        subject = f"🎯 New Demo Request from {demo_request['full_name']}"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #50B9E8, #0A4D8B); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
                .field {{ margin-bottom: 15px; }}
                .label {{ font-weight: bold; color: #0A4D8B; }}
                .button {{ display: inline-block; padding: 12px 24px; background: #50B9E8; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎯 New Demo Request</h1>
                </div>
                <div class="content">
                    <div class="field"><span class="label">Name:</span> {demo_request['full_name']}</div>
                    <div class="field"><span class="label">Email:</span> <a href="mailto:{demo_request['email']}">{demo_request['email']}</a></div>
                    <div class="field"><span class="label">Phone:</span> {demo_request.get('phone', 'N/A')}</div>
                    <div class="field"><span class="label">Organization:</span> {demo_request.get('organization', 'N/A')}</div>
                    <div class="field"><span class="label">Job Title:</span> {demo_request.get('job_title', 'N/A')}</div>
                    <div class="field"><span class="label">Preferred Date:</span> {demo_request.get('preferred_date', 'N/A')}</div>
                    <div class="field"><span class="label">Message:</span> {demo_request.get('message', 'N/A')}</div>
                    <div class="field"><span class="label">Submitted:</span> {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</div>
                    <a href="{settings.FRONTEND_URL}/admin/demo-requests" class="button">View in Dashboard →</a>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self._send_email(self.admin_email, subject, html_body)
    
    def send_contact_message_notification(self, contact: Dict[str, Any]) -> bool:
        """Send contact message notification to admin"""
        logger.info(f"📧 Preparing to send contact message notification from: {contact.get('full_name')}")
        
        subject = f"📧 New Contact: {contact['subject']}"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #50B9E8, #0A4D8B); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
                .field {{ margin-bottom: 15px; }}
                .label {{ font-weight: bold; color: #0A4D8B; }}
                .message-box {{ background: white; padding: 20px; border-left: 4px solid #50B9E8; margin: 20px 0; }}
                .button {{ display: inline-block; padding: 12px 24px; background: #50B9E8; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>📧 New Contact Message</h1>
                </div>
                <div class="content">
                    <div class="field"><span class="label">From:</span> {contact['full_name']}</div>
                    <div class="field"><span class="label">Email:</span> <a href="mailto:{contact['email']}">{contact['email']}</a></div>
                    <div class="field"><span class="label">Phone:</span> {contact.get('phone', 'N/A')}</div>
                    <div class="field"><span class="label">Subject:</span> <strong>{contact['subject']}</strong></div>
                    <div class="message-box">
                        <div class="label">Message:</div>
                        <p>{contact['message']}</p>
                    </div>
                    <div class="field"><span class="label">Received:</span> {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</div>
                    <a href="{settings.FRONTEND_URL}/admin/contact-messages" class="button">Respond in Dashboard →</a>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self._send_email(self.admin_email, subject, html_body)
    
    def send_confirmation_to_user(self, email: str, name: str, type: str = "demo") -> bool:
        """Send confirmation email to user"""
        logger.info(f"📧 Preparing to send confirmation to user: {email}")
        
        if type == "demo":
            subject = "We received your demo request!"
            message = "We'll contact you within 24 hours to schedule your demo."
        else:
            subject = "Thanks for contacting us!"
            message = "We've received your message and will respond soon."
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #50B9E8, #0A4D8B); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header"><h1>✓ Confirmed!</h1></div>
                <div class="content">
                    <p>Hi {name},</p>
                    <p>{message}</p>
                    <p>Best regards,<br>The SynapseAI Team</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self._send_email(email, subject, html_body)


    def send_doctor_registration_notification(self, doctor_data: Dict[str, Any]) -> bool:
        """Send email notification to admin when new doctor registers"""
        logger.info(f"📧 Preparing doctor registration notification for: {doctor_data.get('full_name')}")
        
        subject = f"👨‍⚕️ New Doctor Registration: {doctor_data['full_name']}"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ 
                    background: linear-gradient(135deg, #50B9E8, #0A4D8B); 
                    color: white; 
                    padding: 30px; 
                    text-align: center; 
                    border-radius: 8px 8px 0 0; 
                }}
                .content {{ 
                    background: #f9f9f9; 
                    padding: 30px; 
                    border-radius: 0 0 8px 8px; 
                }}
                .field {{ 
                    margin-bottom: 15px; 
                    padding: 10px;
                    background: white;
                    border-left: 3px solid #50B9E8;
                }}
                .label {{ 
                    font-weight: bold; 
                    color: #0A4D8B; 
                    display: block;
                    margin-bottom: 5px;
                }}
                .value {{ color: #333; }}
                .status-badge {{
                    display: inline-block;
                    padding: 8px 16px;
                    background: #FFA500;
                    color: white;
                    border-radius: 20px;
                    font-weight: bold;
                    margin: 20px 0;
                }}
                .warning {{
                    background: #FFF3CD;
                    border: 1px solid #FFA500;
                    padding: 15px;
                    border-radius: 6px;
                    margin: 20px 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>👨‍⚕️ New Doctor Registration</h1>
                    <div class="status-badge">⏳ PENDING VERIFICATION</div>
                </div>
                <div class="content">
                    <div class="warning">
                        <strong>⚠️ Action Required:</strong> Please verify this doctor's credentials before approval.
                    </div>
                    
                    <h3 style="color: #0A4D8B; margin-top: 20px;">Personal Information</h3>
                    <div class="field">
                        <span class="label">Full Name:</span>
                        <span class="value">{doctor_data['full_name']}</span>
                    </div>
                    <div class="field">
                        <span class="label">Email:</span>
                        <span class="value"><a href="mailto:{doctor_data['email']}">{doctor_data['email']}</a></span>
                    </div>
                    <div class="field">
                        <span class="label">Phone:</span>
                        <span class="value">{doctor_data.get('phone', 'N/A')}</span>
                    </div>
                    
                    <h3 style="color: #0A4D8B; margin-top: 20px;">Professional Details</h3>
                    <div class="field">
                        <span class="label">Medical Registration Number:</span>
                        <span class="value">{doctor_data.get('medical_registration_number', 'N/A')}</span>
                    </div>
                    <div class="field">
                        <span class="label">State Medical Council:</span>
                        <span class="value">{doctor_data.get('state_medical_council', 'N/A')}</span>
                    </div>
                    <div class="field">
                        <span class="label">Specialization:</span>
                        <span class="value">{doctor_data.get('specialization', 'Psychiatrist')}</span>
                    </div>
                    
                    <h3 style="color: #0A4D8B; margin-top: 20px;">Registration Details</h3>
                    <div class="field">
                        <span class="label">User ID:</span>
                        <span class="value">{doctor_data.get('user_id', 'N/A')}</span>
                    </div>
                    <div class="field">
                        <span class="label">Registered At:</span>
                        <span class="value">{datetime.now().strftime('%B %d, %Y at %I:%M %p IST')}</span>
                    </div>
                    <div class="field">
                        <span class="label">Status:</span>
                        <span class="value" style="color: #FFA500; font-weight: bold;">⏳ PENDING VERIFICATION</span>
                    </div>
                    
                    <div style="margin-top: 30px; padding: 20px; background: #E3F4FC; border-radius: 6px;">
                        <h4 style="color: #0A4D8B; margin-top: 0;">Next Steps:</h4>
                        <ol style="color: #333; line-height: 1.8;">
                            <li>Verify medical registration number with State Medical Council</li>
                            <li>Review application in admin dashboard</li>
                            <li>Approve or reject the application</li>
                            <li>Doctor will receive email notification of decision</li>
                        </ol>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self._send_email(self.admin_email, subject, html_body)
    
    def send_doctor_registration_confirmation(self, email: str, name: str) -> bool:
        """Send confirmation email to doctor after registration"""
        logger.info(f"📧 Sending registration confirmation to doctor: {email}")
        
        subject = "✅ Application Received - SynapseAI"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; color: #333; line-height: 1.6; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ 
                    background: linear-gradient(135deg, #50B9E8, #0A4D8B); 
                    color: white; 
                    padding: 40px; 
                    text-align: center; 
                    border-radius: 8px 8px 0 0; 
                }}
                .content {{ 
                    background: #f9f9f9; 
                    padding: 30px; 
                    border-radius: 0 0 8px 8px; 
                }}
                .timeline {{
                    background: white;
                    padding: 20px;
                    border-radius: 6px;
                    margin: 20px 0;
                }}
                .timeline-item {{
                    display: flex;
                    align-items: flex-start;
                    gap: 15px;
                    margin-bottom: 20px;
                }}
                .timeline-number {{
                    background: #50B9E8;
                    color: white;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    flex-shrink: 0;
                }}
                .contact-box {{
                    background: #E3F4FC;
                    padding: 15px;
                    border-radius: 6px;
                    text-align: center;
                    margin: 20px 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Application Received!</h1>
                    <p style="margin: 0; opacity: 0.9;">Welcome to SynapseAI</p>
                </div>
                <div class="content">
                    <p><strong>Dear Dr. {name},</strong></p>
                    
                    <p>Thank you for applying to join SynapseAI! We've successfully received your application and are excited to have you as part of our community of verified psychiatrists.</p>
                    
                    <div class="timeline">
                        <h3 style="color: #0A4D8B; margin-top: 0; margin-bottom: 20px;">📋 What Happens Next:</h3>
                        
                        <div class="timeline-item">
                            <div class="timeline-number">1</div>
                            <div>
                                <strong>Credential Verification</strong><br>
                                Our team will verify your medical registration with your State Medical Council
                            </div>
                        </div>
                        
                        <div class="timeline-item">
                            <div class="timeline-number">2</div>
                            <div>
                                <strong>Application Review</strong><br>
                                We'll review your application within 2-3 business days
                            </div>
                        </div>
                        
                        <div class="timeline-item">
                            <div class="timeline-number">3</div>
                            <div>
                                <strong>Email Notification</strong><br>
                                You'll receive an approval email once verification is complete
                            </div>
                        </div>
                        
                        <div class="timeline-item">
                            <div class="timeline-number">4</div>
                            <div>
                                <strong>Account Activation</strong><br>
                                After approval, you can log in and start using SynapseAI immediately
                            </div>
                        </div>
                    </div>
                    
                    <div class="contact-box">
                        <p><strong>📞 Need Help?</strong></p>
                        <p style="margin: 5px 0;">Questions about your application?<br>
                        Contact us: <a href="mailto:{settings.ADMIN_EMAIL}">{settings.ADMIN_EMAIL}</a></p>
                    </div>
                    
                    <p><strong>Important:</strong> Please keep this email for your records. We'll send updates about your application status to this email address.</p>
                    
                    <p style="margin-top: 30px;">
                    Best regards,<br>
                    <strong>The SynapseAI Team</strong><br>
                    <em>Effortless Intelligence, Absolute Security</em>
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self._send_email(email, subject, html_body)
    
    def send_doctor_approval_email(
        self, 
        to_email: str, 
        doctor_name: str, 
        login_email: str, 
        temporary_password: str,
        login_url: str
    ) -> bool:
        """Send approval email to doctor with login credentials"""
        logger.info(f"📧 Sending approval email to doctor: {to_email}")
        
        subject = "🎉 Your SynapseAI Doctor Account Has Been Approved"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; color: #333; line-height: 1.6; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ 
                    background: linear-gradient(135deg, #10B981, #059669); 
                    color: white; 
                    padding: 40px; 
                    text-align: center; 
                    border-radius: 8px 8px 0 0; 
                }}
                .content {{ 
                    background: #f9f9f9; 
                    padding: 30px; 
                    border-radius: 0 0 8px 8px; 
                }}
                .credentials-box {{
                    background: white;
                    border: 2px solid #10B981;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }}
                .credential-item {{
                    margin: 10px 0;
                    padding: 10px;
                    background: #F0FDF4;
                    border-radius: 4px;
                }}
                .credential-label {{
                    font-weight: bold;
                    color: #059669;
                    display: block;
                    margin-bottom: 5px;
                }}
                .credential-value {{
                    font-family: 'Courier New', monospace;
                    font-size: 16px;
                    color: #1F2937;
                    background: white;
                    padding: 8px;
                    border-radius: 4px;
                    border: 1px solid #D1FAE5;
                }}
                .warning-box {{
                    background: #FEF3C7;
                    border-left: 4px solid #F59E0B;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                }}
                .login-button {{
                    display: inline-block;
                    padding: 15px 30px;
                    background: #10B981;
                    color: white;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: bold;
                    text-align: center;
                    margin: 20px 0;
                }}
                .steps {{
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }}
                .step {{
                    display: flex;
                    gap: 15px;
                    margin-bottom: 15px;
                    align-items: flex-start;
                }}
                .step-number {{
                    background: #10B981;
                    color: white;
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    flex-shrink: 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.95; font-size: 16px;">Your Application Has Been Approved</p>
                </div>
                <div class="content">
                    <p><strong>Dear Dr. {doctor_name},</strong></p>
                    
                    <p>Congratulations! We're thrilled to inform you that your SynapseAI doctor account has been <strong>approved and activated</strong>.</p>
                    
                    <p>You can now access your account using the credentials below:</p>
                    
                    <div class="credentials-box">
                        <h3 style="color: #059669; margin-top: 0;">🔐 Your Login Credentials</h3>
                        
                        <div class="credential-item">
                            <span class="credential-label">Email:</span>
                            <div class="credential-value">{login_email}</div>
                        </div>
                        
                        <div class="credential-item">
                            <span class="credential-label">Temporary Password:</span>
                            <div class="credential-value">{temporary_password}</div>
                        </div>
                    </div>
                    
                    <div class="warning-box">
                        <strong>⚠️ Important Security Notice:</strong><br>
                        For your security, you will be required to <strong>change your password immediately</strong> upon first login. Please choose a strong password.
                    </div>
                    
                    <div class="steps">
                        <h3 style="color: #059669; margin-top: 0;">📋 Next Steps:</h3>
                        
                        <div class="step">
                            <div class="step-number">1</div>
                            <div>
                                <strong>Login to Your Account</strong><br>
                                Click the button below to access your dashboard
                            </div>
                        </div>
                        
                        <div class="step">
                            <div class="step-number">2</div>
                            <div>
                                <strong>Change Your Password</strong><br>
                                You'll be prompted to create a new secure password
                            </div>
                        </div>
                        
                        <div class="step">
                            <div class="step-number">3</div>
                            <div>
                                <strong>Complete Your Profile</strong><br>
                                Add additional details and preferences
                            </div>
                        </div>
                        
                        <div class="step">
                            <div class="step-number">4</div>
                            <div>
                                <strong>Start Using SynapseAI</strong><br>
                                Begin managing consultations and patient care
                            </div>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{login_url}" class="login-button">
                            🚀 Login to Your Dashboard
                        </a>
                    </div>
                    
                    <p style="margin-top: 30px; padding: 20px; background: #E3F4FC; border-radius: 8px;">
                        <strong>💡 Pro Tip:</strong> Save your temporary password securely until you complete your first login and password change.
                    </p>
                    
                    <p style="margin-top: 30px; font-size: 14px; color: #666;">
                        <strong>Need Help?</strong><br>
                        If you have any questions or need assistance, contact us at <a href="mailto:{self.admin_email}">{self.admin_email}</a>
                    </p>
                    
                    <p style="margin-top: 30px;">
                    Welcome to the SynapseAI family!<br>
                    <strong>The SynapseAI Team</strong><br>
                    <em>Effortless Intelligence, Absolute Security</em>
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self._send_email(to_email, subject, html_body)
    
    def send_doctor_rejection_email(
        self,
        to_email: str,
        doctor_name: str,
        rejection_reason: str
    ) -> bool:
        """Send rejection email to doctor with reason"""
        logger.info(f"📧 Sending rejection email to doctor: {to_email}")
        
        subject = "Update on Your SynapseAI Doctor Application"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; color: #333; line-height: 1.6; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ 
                    background: linear-gradient(135deg, #64748B, #475569); 
                    color: white; 
                    padding: 40px; 
                    text-align: center; 
                    border-radius: 8px 8px 0 0; 
                }}
                .content {{ 
                    background: #f9f9f9; 
                    padding: 30px; 
                    border-radius: 0 0 8px 8px; 
                }}
                .reason-box {{
                    background: #FEF2F2;
                    border-left: 4px solid #EF4444;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 4px;
                }}
                .info-box {{
                    background: #EFF6FF;
                    border: 1px solid #BFDBFE;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }}
                .contact-box {{
                    background: white;
                    border: 2px solid #50B9E8;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                    margin: 20px 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1 style="margin: 0; font-size: 28px;">Update on Your Application</h1>
                    <p style="margin: 10px 0 0 0; opacity: 0.95;">SynapseAI Doctor Registration</p>
                </div>
                <div class="content">
                    <p><strong>Dear Dr. {doctor_name},</strong></p>
                    
                    <p>Thank you for your interest in joining the SynapseAI platform as a verified doctor.</p>
                    
                    <p>After careful review of your application, we regret to inform you that we are unable to approve your registration at this time.</p>
                    
                    <div class="reason-box">
                        <h3 style="color: #DC2626; margin-top: 0;">📋 Reason for Decision:</h3>
                        <p style="margin: 0; font-size: 15px;">{rejection_reason}</p>
                    </div>
                    
                    <div class="info-box">
                        <h3 style="color: #2563EB; margin-top: 0;">💡 What This Means:</h3>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>Your current application has been closed</li>
                            <li>No further action is required from you</li>
                            <li>You may address the issue and reapply in the future if eligible</li>
                        </ul>
                    </div>
                    
                    <p>We appreciate your understanding and wish you the best in your professional endeavors.</p>
                    
                    <div class="contact-box">
                        <h3 style="color: #0A4D8B; margin-top: 0;">📞 Questions or Concerns?</h3>
                        <p style="margin: 10px 0;">
                            If you have questions about this decision or believe there has been an error, 
                            please don't hesitate to contact us:
                        </p>
                        <p style="margin: 10px 0;">
                            <strong>Email:</strong> <a href="mailto:{self.admin_email}">{self.admin_email}</a>
                        </p>
                        <p style="margin: 10px 0; font-size: 14px; color: #666;">
                            We typically respond within 1-2 business days.
                        </p>
                    </div>
                    
                    <p style="margin-top: 30px; padding: 15px; background: #F9FAFB; border-radius: 8px; font-size: 14px;">
                        <strong>Note:</strong> This decision is based on the information provided in your application. 
                        If circumstances change or you can provide additional documentation, you may be eligible to reapply.
                    </p>
                    
                    <p style="margin-top: 30px;">
                    Thank you for considering SynapseAI,<br>
                    <strong>The SynapseAI Team</strong><br>
                    <em>Effortless Intelligence, Absolute Security</em>
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return self._send_email(to_email, subject, html_body)


email_service = EmailService()
