interface SendEmailParams {
  to: string;
  subject: string;
  message: string;
}

export async function sendEmail({ to, subject, message }: SendEmailParams): Promise<void> {
  const response = await fetch("/api/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, subject, message }),
  });

  if (!response.ok) {
    throw new Error("The email could not be sent");
  }
}
