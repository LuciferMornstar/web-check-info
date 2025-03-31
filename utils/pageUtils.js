export async function searchContactPage() {
  const links = Array.from(document.querySelectorAll('a[href]'));
  const contactLink = links.find(link => /contact/i.test(link.innerText) || /contact/i.test(link.href));

  if (contactLink) {
    try {
      const response = await fetch(contactLink.href);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const names = [...new Set(doc.body.innerText.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g) || [])];
      const emails = [...new Set(doc.body.innerText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [])];
      const phones = [...new Set(doc.body.innerText.match(/(?:(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?(?:\d{3}[-.\s]?\d{4}))(?:(?:[-.\s]?(?:ext|x|ext.|extension)[-.\s]?(\d{1,7}))?)/gi) || [])];

      return { names, emails, phones, url: contactLink.href };
    } catch (error) {
      console.error('Failed to fetch contact page:', error);
    }
  }

  return null;
}
