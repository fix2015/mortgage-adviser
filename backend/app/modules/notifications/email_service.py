import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings


def send_consultation_summary(
    to_email: str, user_name: str, strategies: list[str], pdf_url: str = ""
):
    """Send consultation summary email with top mortgage strategies."""
    if not settings.SMTP_HOST or settings.SMTP_HOST == "localhost":
        print(f"[EMAIL SKIP] SMTP not configured. Would send to {to_email}")
        return False

    html = f"""
    <html><body style="font-family: Arial, sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #1a365d, #3b82f6); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0;">AI Mortgage Adviser</h1>
        <p style="color: #93c5fd; margin-top: 8px;">Your Mortgage Consultation Summary</p>
      </div>
      <div style="padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p>Hi {user_name},</p>
        <p>Thank you for your mortgage consultation. Here are your key recommendations:</p>
        <ol style="padding-left: 20px;">
          {"".join(f"<li style='margin-bottom: 12px;'>{s}</li>" for s in strategies[:5])}
        </ol>
        <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold; color: #1d4ed8;">Download Your Full Mortgage Report</p>
          <p style="margin: 4px 0 0; font-size: 14px; color: #6b7280;">Log in to your dashboard to download the complete mortgage strategy report.</p>
        </div>
        <p style="font-size: 12px; color: #9ca3af; margin-top: 30px;">
          This is AI-generated advice. Please consult a qualified mortgage broker before taking action.<br>
          Your home may be repossessed if you do not keep up repayments on your mortgage.<br>
          AI Mortgage Adviser &mdash; mortgage-advisor.probooking.app
        </p>
      </div>
    </body></html>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Your Mortgage Strategy Summary - AI Mortgage Adviser"
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to_email
    msg.attach(MIMEText(html, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            if settings.SMTP_USER:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"[EMAIL ERROR] Failed to send to {to_email}: {e}")
        return False
