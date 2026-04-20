import { createClient } from '@base44/sdk';
import { Resend } from 'resend';

const base44 = createClient({
  appId: process.env.BASE44_APP_ID!,
  apiKey: process.env.BASE44_API_KEY!,
});

const resend = new Resend(process.env.RESEND_API_KEY!);

export default async function handler(req: any, res: any) {
  try {
    const now = new Date();
    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const pending = await base44.entities.Reminder.filter({
      sent: false,
      remind_at: {
        $lte: now.toISOString(),
        $gte: fiveMinAgo.toISOString(),
      },
    });

    for (const r of pending) {
      try {
        await resend.emails.send({
          from: 'Tu App <onboarding@resend.dev>',
          to: r.email,
          subject: 'Recordatorio ⏰',
          html: `<p>${r.message || 'Tenías un recordatorio'}</p>`,
        });

        await base44.entities.Reminder.update(r.id, { sent: true });

      } catch (err) {
        console.error(err);
      }
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    return res.status(500).json({ error: 'fail' });
  }
}
