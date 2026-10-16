/**
 * How the "Send a letter" form delivers messages. EDIT HERE.
 *
 * The site is fully static, so by default it opens the visitor's email app
 * (mailto:) with the message pre-filled, using the email from your classic
 * site's contact links. To use a form service later (Formspree, Basin, …),
 * set method to 'form' and paste the endpoint. See systems/contact/.
 */
export const contactConfig: { method: 'mailto' | 'form'; formEndpoint: string; subject: string } = {
  method: 'mailto',
  formEndpoint: '',
  subject: "Hello from Gauri's Town",
};
