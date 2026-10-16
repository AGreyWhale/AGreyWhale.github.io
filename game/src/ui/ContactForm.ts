import { site } from '../content/site';
import type { ContactHandler } from '../systems/contact/ContactHandler';
import { h } from './dom';

let formCount = 0;

/**
 * "Send a letter" form. Knows nothing about delivery: it hands the message to
 * whichever ContactHandler is configured (mailto by default).
 */
export function createContactForm(handler: ContactHandler | null): HTMLElement {
  if (!handler) {
    return h('p', { class: 'note' }, 'The post office is closed. Find me through the links below.');
  }
  const n = ++formCount;
  const field = (id: string, label: string, input: HTMLInputElement | HTMLTextAreaElement) =>
    h('div', { class: 'field' }, h('label', { for: `${id}-${n}` }, label), input);

  const name = h('input', { id: `name-${n}`, name: 'name', autocomplete: 'name', maxlength: '80' });
  const email = h('input', { id: `email-${n}`, name: 'email', type: 'email', autocomplete: 'email', maxlength: '120' });
  const message = h('textarea', { id: `msg-${n}`, name: 'message', rows: '5', required: true, maxlength: '4000' });
  const status = h('p', { class: 'form-status', role: 'status' });
  const submit = h('button', { type: 'submit', class: 'btn btn-primary' }, handler.submitLabel);

  const form = h(
    'form',
    { class: 'letter-form', novalidate: true },
    h('p', { class: 'note' }, handler.description),
    field('name', 'Your name (optional)', name),
    field('email', 'Your email (optional, so I can reply)', email),
    field('msg', 'Your letter', message),
    h('div', { class: 'form-actions' }, submit),
    status,
  );
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!message.value.trim()) {
      status.textContent = 'Write a few words first!';
      message.focus();
      return;
    }
    submit.disabled = true;
    const result = await handler.send({ name: name.value, replyTo: email.value, message: message.value });
    status.textContent = result.note;
    submit.disabled = false;
  });

  const wrap = h('div', { class: 'contact' }, form);
  if (site.contact.email) {
    wrap.append(
      h('p', { class: 'panel-hint' }, 'Prefer your own app? Email ', h('a', { href: `mailto:${site.contact.email}` }, site.contact.email), '.'),
    );
  }
  return wrap;
}
