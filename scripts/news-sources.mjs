// News sources: free-to-read outlets with RSS/Atom feeds (paywalled outlets are deliberately absent).
// lean: L (left) · LL (lean left) · C (centre) · LR (lean right) · R (right) — approximate, following
// the widely cited AllSides / Media Bias/Fact Check ratings; Korean outlets follow the common
// 진보/중도/보수 classification; trade press is T (no political lean).
// region: au · world · asia · ko (Korean-language) · topic. topic sources carry topic: construction · engineering · property.
export const SOURCES = [
  // Australia
  { id: "abc", name: "ABC News", region: "au", lang: "en", lean: "LL", url: "https://www.abc.net.au/news/feed/2942460/rss.xml" },
  { id: "sbs", name: "SBS News", region: "au", lang: "en", lean: "LL", url: "https://www.sbs.com.au/news/feed" },
  { id: "guardian-au", name: "Guardian Australia", region: "au", lang: "en", lean: "LL", url: "https://www.theguardian.com/australia-news/rss" },
  { id: "newscomau", name: "news.com.au", region: "au", lang: "en", lean: "LR", url: "https://www.news.com.au/content-feeds/latest-news-national/" },
  { id: "9news", name: "9News", region: "au", lang: "en", lean: "C", url: "https://www.9news.com.au/rss" },
  { id: "skynews-au", name: "Sky News Australia", region: "au", lang: "en", lean: "R", url: "https://www.skynews.com.au/rss" },
  // World
  { id: "bbc", name: "BBC News", region: "world", lang: "en", lean: "C", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { id: "aljazeera", name: "Al Jazeera", region: "world", lang: "en", lean: "LL", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { id: "npr", name: "NPR", region: "world", lang: "en", lean: "LL", url: "https://feeds.npr.org/1004/rss.xml" },
  { id: "dw", name: "DW", region: "world", lang: "en", lean: "C", url: "https://rss.dw.com/rdf/rss-en-world" },
  { id: "france24", name: "France 24", region: "world", lang: "en", lean: "C", url: "https://www.france24.com/en/rss" },
  { id: "guardian-world", name: "The Guardian", region: "world", lang: "en", lean: "LL", url: "https://www.theguardian.com/world/rss" },
  { id: "fox", name: "Fox News", region: "world", lang: "en", lean: "R", url: "https://moxie.foxnews.com/google-publisher/world.xml" },
  { id: "nypost", name: "New York Post", region: "world", lang: "en", lean: "R", url: "https://nypost.com/news/feed/" },
  { id: "washex", name: "Washington Examiner", region: "world", lang: "en", lean: "R", url: "https://www.washingtonexaminer.com/feed/" },
  // Asia (English)
  { id: "yonhap-en", name: "Yonhap", region: "asia", lang: "en", lean: "C", url: "https://en.yna.co.kr/RSS/news.xml" },
  { id: "koreaherald", name: "Korea Herald", region: "asia", lang: "en", lean: "LR", url: "https://www.koreaherald.com/rss/newsAll" },
  { id: "hani-en", name: "Hankyoreh (EN)", region: "asia", lang: "en", lean: "L", url: "https://english.hani.co.kr/rss/" },
  { id: "rthk", name: "RTHK", region: "asia", lang: "en", lean: "C", url: "https://rthk.hk/rthk/news/rss/e_expressnews_einternational.xml" },
  { id: "cna", name: "CNA", region: "asia", lang: "en", lean: "C", url: "https://www.channelnewsasia.com/rssfeeds/8395986" },
  { id: "nhk", name: "NHK World", region: "asia", lang: "en", lean: "C", url: "https://www3.nhk.or.jp/rss/news/cat0.xml" },
  // 한국어
  { id: "yna", name: "연합뉴스", region: "ko", lang: "ko", lean: "C", url: "https://www.yna.co.kr/rss/news.xml" },
  { id: "hani", name: "한겨레", region: "ko", lang: "ko", lean: "L", url: "https://www.hani.co.kr/rss/" },
  { id: "khan", name: "경향신문", region: "ko", lang: "ko", lean: "L", url: "https://www.khan.co.kr/rss/rssdata/total_news.xml" },
  { id: "jtbc", name: "JTBC", region: "ko", lang: "ko", lean: "LL", url: "https://news-ex.jtbc.co.kr/v1/get/rss/newsflesh" },
  { id: "sbs-kr", name: "SBS", region: "ko", lang: "ko", lean: "C", url: "https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=01&plink=RSSREADER" },
  { id: "donga", name: "동아일보", region: "ko", lang: "ko", lean: "LR", url: "https://rss.donga.com/total.xml" },
  { id: "chosun", name: "조선일보", region: "ko", lang: "ko", lean: "R", url: "https://www.chosun.com/arc/outboundfeeds/rss/?outputType=xml" },
  // Topics (trade press; free to read)
  { id: "sourceable", name: "Sourceable", region: "topic", topic: "construction", lang: "en", lean: "T", url: "https://sourceable.net/feed/" },
  { id: "gcr", name: "Global Construction Review", region: "topic", topic: "construction", lang: "en", lean: "T", url: "https://www.globalconstructionreview.com/feed/" },
  { id: "constructiondive", name: "Construction Dive", region: "topic", topic: "construction", lang: "en", lean: "T", url: "https://www.constructiondive.com/feeds/news/" },
  { id: "archdesign", name: "Architecture & Design", region: "topic", topic: "construction", lang: "en", lean: "T", url: "https://www.architectureanddesign.com.au/rss" },
  { id: "createdigital", name: "create (Engineers Australia)", region: "topic", topic: "engineering", lang: "en", lean: "T", url: "https://createdigital.org.au/feed/" },
  { id: "inframag", name: "Infrastructure Magazine", region: "topic", topic: "engineering", lang: "en", lean: "T", url: "https://infrastructuremagazine.com.au/feed/" },
  { id: "nce", name: "New Civil Engineer", region: "topic", topic: "engineering", lang: "en", lean: "T", url: "https://www.newcivilengineer.com/feed" },
  { id: "urbandev", name: "The Urban Developer", region: "topic", topic: "property", lang: "en", lean: "T", url: "https://www.theurbandeveloper.com/rss" },
  { id: "rea-news", name: "realestate.com.au News", region: "topic", topic: "property", lang: "en", lean: "T", url: "https://www.realestate.com.au/news/feed/" },
  { id: "domain", name: "Domain News", region: "topic", topic: "property", lang: "en", lean: "T", url: "https://www.domain.com.au/news/feed/" },
];
