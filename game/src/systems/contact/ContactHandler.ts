import { contactConfig } from '../../content/contact';
import { site } from '../../content/site';

export interface ContactMessage {
  name: string;
  /** Visitor's email, if they gave one. */
  replyTo: string;
  message: string;
}

export interface ContactResult {
  ok: boolean;
  /** Shown to the visitor after sending. */
  note: string;
}

/**
 * Delivers a message from the "Send a letter" form. Swap implementations in
 * createContactHandler() without touching the UI.
 */
export interface ContactHandler {
  /** Explains what will happen when they press send. */
  readonly description: string;
  readonly submitLabel: string;
  send(msg: ContactMessage): Promise<ContactResult>;
}

/** Builds a mailto: URL with the message pre-filled. Pure, so it's unit-tested. */
export function buildMailto(email: string, subject: string, msg: ContactMessage): string {
  const lines = [msg.message.trim(), '', '—', msg.name.trim() || 'A visitor from the town'];
  if (msg.replyTo.trim()) lines.push(msg.replyTo.trim());
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
}

/** Default: no backend. Opens the visitor's email app with the letter pre-filled. */
export class MailtoContactHandler implements ContactHandler {
  readonly description = 'Pressing send opens your email app with this letter ready to go.';
  readonly submitLabel = 'Open in my email app';

  constructor(
    private readonly email: string,
    private readonly subject: string,
  ) {}

  async send(msg: ContactMessage): Promise<ContactResult> {
    window.location.href = buildMailto(this.email, this.subject, msg);
    return { ok: true, note: 'Your email app should open now. Thanks for writing!' };
  }
}

/**
 * Optional: posts to a form service (Formspree, Basin, Getform…). Not used
 * unless content/contact.ts sets method: 'form' and an endpoint.
 */
export class FormServiceContactHandler implements ContactHandler {
  readonly description = 'Your letter is delivered straight to my inbox.';
  readonly submitLabel = 'Send letter';

  constructor(
    private readonly endpoint: string,
    private readonly subject: string,
  ) {}

  async send(msg: ContactMessage): Promise<ContactResult> {
    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ _subject: this.subject, name: msg.name, email: msg.replyTo, message: msg.message }),
      });
      return res.ok ? { ok: true, note: 'Letter sent! Thank you.' } : { ok: false, note: 'The post office is closed right now. Please try again later.' };
    } catch {
      return { ok: false, note: 'Could not reach the post office. Check your connection and try again.' };
    }
  }
}

/** Picks the handler from content/contact.ts. Returns null if there's no way to deliver mail. */
export function createContactHandler(): ContactHandler | null {
  if (contactConfig.method === 'form' && contactConfig.formEndpoint) {
    return new FormServiceContactHandler(contactConfig.formEndpoint, contactConfig.subject);
  }
  return site.contact.email ? new MailtoContactHandler(site.contact.email, contactConfig.subject) : null;
}
