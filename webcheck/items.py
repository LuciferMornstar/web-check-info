import scrapy

class ContactItem(scrapy.Item):
    name = scrapy.Field()
    email = scrapy.Field()
    phone = scrapy.Field()
    url = scrapy.Field()
    domain = scrapy.Field()
