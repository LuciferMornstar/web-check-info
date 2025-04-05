import scrapy
import re
from urllib.parse import urlparse
from webcheck.items import ContactItem

class ContactSpider(scrapy.Spider):
    name = "contact_spider"
    
    # Regex patterns for contact extraction
    EMAIL_PATTERN = re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}', re.IGNORECASE)
    PHONE_PATTERN = re.compile(r'(?:\+?(?:1|44|33|49|61|7|8[01]|9[0-9]|[2-9])\s?)?(?:\(?\d{3,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}(?:(?:\s?(?:x|ext|extension)[\s.]?)?\d{1,5})?', re.IGNORECASE)
    NAME_PATTERN = re.compile(r'(?:(?:Dr|Prof|Professor|Mr|Mrs|Ms|Miss|Sir|Dame|Revd|Rev|Hon|Lady)\s+)?(?:[A-Z][a-z]{1,20}(?:\s+[A-Z][a-z]{1,20}){1,4})')

    def __init__(self, url=None, *args, **kwargs):
        super(ContactSpider, self).__init__(*args, **kwargs)
        
        if url:
            self.start_urls = [url]
            self.allowed_domains = [self.extract_domain(url)]
            self.logger.info(f"Starting spider for {url}")
        else:
            # Default URL if none provided (for testing)
            self.start_urls = ["https://example.com"]
            self.allowed_domains = ["example.com"]
            
        # Setup counters
        self.email_count = 0
        self.phone_count = 0
        self.name_count = 0
        self.page_count = 0

    def parse(self, response):
        self.page_count += 1
        self.logger.info(f"Parsing page {self.page_count}: {response.url}")
        
        # Extract all text content from the page
        page_text = response.text
        
        # Extract contacts using regex
        emails = set(self.EMAIL_PATTERN.findall(page_text))
        phones = set(self.PHONE_PATTERN.findall(page_text))
        names = set(self.NAME_PATTERN.findall(page_text))
        
        # Log each found item for real-time reporting
        for email in emails:
            if self.is_valid_email(email):
                self.email_count += 1
                self.logger.info(f"Found email: {email}")
        
        for phone in phones:
            if self.is_valid_phone(phone):
                self.phone_count += 1
                self.logger.info(f"Found phone: {phone}")
        
        for name in names:
            if self.is_valid_name(name):
                self.name_count += 1
                self.logger.info(f"Found name: {name}")
        
        # Filter out invalid entries
        valid_emails = self.filter_emails(emails)
        valid_phones = self.filter_phones(phones)
        valid_names = self.filter_names(names)
        
        # Create structured contacts by combining data
        structured_contacts = self.create_structured_contacts(valid_names, valid_emails, valid_phones)
        
        for contact in structured_contacts:
            item = ContactItem()
            item['name'] = contact['name']
            item['email'] = contact['email']
            item['phone'] = contact['phone']
            item['url'] = response.url
            item['domain'] = self.extract_domain(response.url)
            yield item
        
        # Also check contact pages if this is the home page
        if self.is_home_page(response.url) and self.page_count < 5:  # Limit to 5 pages for real-time demo
            contact_links = self.find_contact_links(response)
            self.logger.info(f"Found {len(contact_links)} potential contact links")
            
            for link in contact_links:
                yield response.follow(link, self.parse)
    
    # ... existing helper methods ...
    def is_valid_email(self, email):
        return not ('example.com' in email or 'domain.com' in email or 'test.com' in email)
    
    def is_valid_phone(self, phone):
        return len(re.sub(r'\D', '', phone)) >= 7
    
    def is_valid_name(self, name):
        common_non_names = [
            'Privacy Policy', 'Terms Of Service', 'All Rights Reserved', 
            'Contact Us', 'Read More', 'Learn More', 'Sign Up', 'Log In'
        ]
        return (name not in common_non_names and
                len(name) > 2 and
                len(name) < 40 and
                not re.search(r'[0-9@#$%^&*()_+=[\]{}|\\:;"\'<>,.?/~`]', name))

    def filter_emails(self, emails):
        """Filter out invalid emails"""
        return [email for email in emails if self.is_valid_email(email)]
    
    def filter_phones(self, phones):
        """Filter out invalid phone numbers"""
        return [phone for phone in phones if self.is_valid_phone(phone)]
    
    def filter_names(self, names):
        """Filter out invalid names"""
        return [name for name in names if self.is_valid_name(name)]
    
    def create_structured_contacts(self, names, emails, phones):
        """Combine extracted data into structured contacts"""
        structured_contacts = []
        
        # Create a contact for each email
        for email in emails:
            # Try to find a matching name
            matching_name = None
            email_name = email.split('@')[0].replace('.', ' ').replace('_', ' ').replace('-', ' ')
            
            for name in names:
                name_parts = name.lower().split()
                email_parts = email_name.lower().split()
                
                # Check if any part of the name appears in the email
                if any(part in email_name.lower() for part in name_parts):
                    matching_name = name
                    break
            
            # Find a matching phone if possible
            matching_phone = None
            if phones and len(phones) > 0:
                matching_phone = list(phones)[0]
                phones.remove(matching_phone)
            
            # Create the contact
            contact = {
                "name": matching_name or "",
                "email": email,
                "phone": matching_phone or ""
            }
            
            structured_contacts.append(contact)
            
            # Remove the used name if one was found
            if matching_name and matching_name in names:
                names.remove(matching_name)
        
        # Add remaining names with phones
        for name in names:
            matching_phone = None
            if phones and len(phones) > 0:
                matching_phone = list(phones)[0]
                phones.remove(matching_phone)
            
            contact = {
                "name": name,
                "email": "",
                "phone": matching_phone or ""
            }
            
            structured_contacts.append(contact)
        
        # Add remaining phones
        for phone in phones:
            contact = {
                "name": "",
                "email": "",
                "phone": phone
            }
            
            structured_contacts.append(contact)
        
        return structured_contacts
    
    def extract_domain(self, url):
        """Extract domain from URL"""
        parsed = urlparse(url)
        return parsed.netloc
    
    def is_home_page(self, url):
        """Check if this is likely a home page"""
        parsed = urlparse(url)
        path = parsed.path.strip('/')
        return path == '' or path.lower() in ['index.html', 'home', 'main']
    
    def find_contact_links(self, response):
        """Find links to contact pages"""
        contact_links = []
        
        # Look for links containing contact-related keywords
        for link in response.css('a::attr(href)').getall():
            if any(keyword in link.lower() for keyword in ['contact', 'about-us', 'about']):
                contact_links.append(link)
        
        return contact_links
