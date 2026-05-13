import smtplib

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

from pathlib import Path

import os


SMTP_EMAIL = os.getenv(
    "SMTP_EMAIL",
    ""
)

SMTP_PASSWORD = os.getenv(
    "SMTP_PASSWORD",
    ""
)


def send_email(

    recipient: str,

    subject: str,

    body: str,

    attachment_path: str | None = None
):

    # ==========================================
    # EMAIL NOT CONFIGURED
    # ==========================================

    if not SMTP_EMAIL or not SMTP_PASSWORD:

        print(
            "SMTP credentials missing. Email skipped."
        )

        return False

    try:

        msg = MIMEMultipart()

        msg["From"] = SMTP_EMAIL

        msg["To"] = recipient

        msg["Subject"] = subject

        msg.attach(
            MIMEText(body, "plain")
        )

        # ==========================================
        # ATTACHMENT
        # ==========================================

        if attachment_path:

            file_path = Path(
                attachment_path
            )

            if file_path.exists():

                with open(
                    file_path,
                    "rb"
                ) as attachment:

                    part = MIMEBase(
                        "application",
                        "octet-stream"
                    )

                    part.set_payload(
                        attachment.read()
                    )

                encoders.encode_base64(part)

                part.add_header(

                    "Content-Disposition",

                    f"attachment; filename={file_path.name}"
                )

                msg.attach(part)

        # ==========================================
        # SEND MAIL
        # ==========================================

        server = smtplib.SMTP(

            "smtp.gmail.com",

            587
        )

        server.starttls()

        server.login(

            SMTP_EMAIL,

            SMTP_PASSWORD
        )

        server.sendmail(

            SMTP_EMAIL,

            recipient,

            msg.as_string()
        )

        server.quit()

        print(
            f"Email sent to {recipient}"
        )

        return True

    except Exception as e:

        print(
            "EMAIL ERROR:",
            str(e)
        )

        return False