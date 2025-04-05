# Scrapy settings for webcheck project

BOT_NAME = "webcheck"

SPIDER_MODULES = ["webcheck.spiders"]
NEWSPIDER_MODULE = "webcheck.spiders"

# Obey robots.txt rules
ROBOTSTXT_OBEY = True

# Configure maximum concurrent requests
CONCURRENT_REQUESTS = 16

# Configure a delay for requests for the same website
DOWNLOAD_DELAY = 0.5

# Enable or disable downloader middlewares
DOWNLOADER_MIDDLEWARES = {
   "scrapy.downloadermiddlewares.useragent.UserAgentMiddleware": None,
   "webcheck.middlewares.RandomUserAgentMiddleware": 400,
}

# Configure item pipelines
ITEM_PIPELINES = {
   "webcheck.pipelines.ContactPipeline": 300,
}

# Enable and configure HTTP caching
HTTPCACHE_ENABLED = True
HTTPCACHE_EXPIRATION_SECS = 0
HTTPCACHE_DIR = "httpcache"
HTTPCACHE_IGNORE_HTTP_CODES = []
HTTPCACHE_STORAGE = "scrapy.extensions.httpcache.FilesystemCacheStorage"

# Set settings whose default value is deprecated to a future-proof value
REQUEST_FINGERPRINTER_IMPLEMENTATION = "2.7"
TWISTED_REACTOR = "twisted.internet.asyncioreactor.AsyncioSelectorReactor"
FEED_EXPORT_ENCODING = "utf-8"
