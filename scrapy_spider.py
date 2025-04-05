import scrapy

class ContactSpider(scrapy.Spider):
    name = "contact_spider"
    allowed_domains = []

    def __init__(self, url=None, *args, **kwargs):
        super(ContactSpider, self).__init__(*args, **kwargs)
        if url:
            self.start_urls = [url]
            self.allowed_domains = [self.extract_domain(url)]
        else:
            raise ValueError("Please provide a URL to scrape, e.g. scrapy runspider scrapy_spider.py -a url=http://example.com")

    def parse(self, response):
        # Simple example: gather email addresses
        page_text = response.text
        emails = set()
        # Very basic regex for demonstration
        import re
        email_pattern = re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}', re.IGNORECASE)
        for match in email_pattern.findall(page_text):
            emails.add(match)

        yield {
            'url': response.url,
            'emails': list(emails)
        }

    def extract_domain(self, url):
        from urllib.parse import urlparse
        parsed = urlparse(url)
        return parsed.netloc
