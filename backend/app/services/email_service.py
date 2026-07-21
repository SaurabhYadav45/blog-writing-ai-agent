import requests
from app.core.config import settings

LOGO_URL = "https://res.cloudinary.com/dic5pygft/image/upload/v1784441197/icon2_ygdxsf.png"
THEME_COLOR = "#f97316" # Orange-500

def _send_brevo_email(email_to: str, subject: str, html_content: str):
    """
    Core function to send emails via the Brevo (Sendinblue) REST API.
    """
    if not settings.BREVO_API_KEY:
        print(f"Skipping email to {email_to} (BREVO_API_KEY not configured).")
        return

    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": settings.BREVO_API_KEY,
        "content-type": "application/json"
    }
    
    payload = {
        "sender": {
            "name": settings.EMAILS_FROM_NAME,
            "email": settings.EMAILS_FROM_EMAIL
        },
        "to": [
            {
                "email": email_to
            }
        ],
        "subject": subject,
        "htmlContent": html_content
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        print(f"Successfully sent email to {email_to} via Brevo. Message ID: {response.json().get('messageId')}")
    except requests.exceptions.RequestException as e:
        print(f"Failed to send email to {email_to} via Brevo: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Brevo API Error Details: {e.response.text}")


def _get_base_template(title: str, content: str) -> str:
    """
    Returns the base HTML template wrapper with premium styling and glassmorphism themes.
    """
    return f"""
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #fff7ed; color: #334155;">
        <div style="max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 24px; padding: 40px; box-shadow: 0 10px 40px -10px rgba(249, 115, 22, 0.1); border: 1px solid rgba(249, 115, 22, 0.1);">
          
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="{LOGO_URL}" alt="BlogFusion Logo" style="width: 60px; height: 60px; border-radius: 16px; object-fit: cover; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.2);">
            <h1 style="color: {THEME_COLOR}; margin-top: 20px; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">{title}</h1>
          </div>
          
          <div style="font-size: 16px; line-height: 1.6; color: #475569;">
            {content}
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; text-align: center; color: #94a3b8; font-size: 13px;">
            <p>You received this email because you are a registered user of BlogFusion AI.</p>
            <p>&copy; {__import__('datetime').datetime.now().year} BlogFusion AI. All rights reserved.</p>
          </div>
          
        </div>
      </body>
    </html>
    """

def send_otp_email(email_to: str, otp_code: str):
    """
    Sends a beautifully formatted OTP email for verification.
    """
    content = f"""
    <p>Hello,</p>
    <p>Welcome to BlogFusion! To complete your registration and verify your email address, please use the following one-time password (OTP):</p>
    
    <div style="background-color: #fff7ed; border: 2px dashed #fdba74; padding: 20px; text-align: center; border-radius: 16px; margin: 30px 0;">
      <span style="font-size: 36px; font-weight: 900; letter-spacing: 8px; color: {THEME_COLOR};">{otp_code}</span>
    </div>
    
    <p>This code will expire in <strong>10 minutes</strong>. If you did not request this, please ignore this email.</p>
    """
    html = _get_base_template("Verify Your Account", content)
    _send_brevo_email(email_to, "Your BlogFusion Verification Code", html)

def send_welcome_email(email_to: str, name: str):
    """
    Sends a premium welcome email after successful signup.
    """
    display_name = name if name else "Creator"
    
    content = f"""
    <p>Hi <strong>{display_name}</strong>,</p>
    <p>Welcome to <strong>BlogFusion AI</strong>! We are absolutely thrilled to have you onboard.</p>
    <p>Our platform uses autonomous AI agents to help you research, write, and optimize high-quality technical blogs in minutes instead of hours. You now have access to your creative workspace.</p>
    
    <div style="text-align: center; margin: 35px 0;">
      <a href="{settings.FRONTEND_URL}/dashboard" style="background-color: {THEME_COLOR}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.4);">Go to Dashboard</a>
    </div>
    
    <p>If you have any questions or need help getting started, just reply to this email or visit our documentation.</p>
    <p>Happy writing!</p>
    """
    html = _get_base_template("Welcome to BlogFusion!", content)
    _send_brevo_email(email_to, "Welcome to BlogFusion AI! 🚀", html)

def send_reset_password_email(email_to: str, token: str):
    """
    Sends a secure password reset link.
    """
    reset_link = f"{settings.FRONTEND_URL.rstrip('/')}/reset-password?token={token}"
    
    content = f"""
    <p>Hello,</p>
    <p>We received a request to reset your password for your BlogFusion account. Click the button below to set a new secure password.</p>
    
    <div style="text-align: center; margin: 35px 0;">
      <a href="{reset_link}" style="background-color: {THEME_COLOR}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 14px rgba(249, 115, 22, 0.4);">Reset Password</a>
    </div>
    
    <p>This link is valid for <strong>15 minutes</strong>.</p>
    <p style="color: #64748b; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    """
    html = _get_base_template("Reset Your Password", content)
    _send_brevo_email(email_to, "Reset Your BlogFusion Password", html)

def send_payment_receipt_email(email_to: str, amount_inr: float, order_id: str, plan_name: str):
    """
    Sends a sleek transaction receipt.
    """
    content = f"""
    <p>Hello,</p>
    <p>Thank you for your purchase! Your payment was successful, and your account has been upgraded to the <strong>{plan_name}</strong> plan.</p>
    
    <div style="background-color: #f8fafc; border-radius: 16px; padding: 24px; margin: 30px 0; border: 1px solid #e2e8f0;">
      <h3 style="margin-top: 0; color: #334155; font-size: 18px; border-bottom: 1px solid #cbd5e1; padding-bottom: 12px;">Transaction Details</h3>
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Order ID:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0f172a;">{order_id}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #64748b;">Plan Upgraded:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: {THEME_COLOR};">{plan_name}</td>
        </tr>
        <tr>
          <td style="padding: 16px 0 8px 0; color: #0f172a; font-weight: 700; border-top: 1px solid #cbd5e1;">Total Amount:</td>
          <td style="padding: 16px 0 8px 0; text-align: right; font-weight: 800; color: #0f172a; border-top: 1px solid #cbd5e1;">₹{amount_inr:,.2f}</td>
        </tr>
      </table>
    </div>
    
    <p>You can view your updated limits and credit balance in your account dashboard.</p>
    """
    html = _get_base_template("Payment Receipt", content)
    _send_brevo_email(email_to, "Your BlogFusion Payment Receipt", html)
