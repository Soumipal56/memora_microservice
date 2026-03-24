import re
import httpx
import asyncio
from bs4 import BeautifulSoup
from urllib.parse import urlparse

# ── Type Detection ─────────────────────────────────────────────────────────────

def detect_type(url: str) -> str:
    if re.search(r'youtube\.com|youtu\.be', url): return 'youtube'
    if re.search(r'linkedin\.com', url):           return 'linkedin'
    if re.search(r'twitter\.com|x\.com', url):     return 'twitter'
    if re.search(r'github\.com', url):             return 'github'
    if re.search(r'arxiv\.org', url):              return 'paper'
    if re.search(r'pinterest\.com', url):          return 'pinterest'
    if re.search(r'medium\.com|substack\.com', url): return 'blog'
    if re.search(r'\.pdf(\?|$)', url):             return 'pdf'
    return 'article'

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}

# ── Handlers ──────────────────────────────────────────────────────────────────

async def extract_youtube(url: str) -> dict:
    video_id = re.search(r'(?:youtube\.com/watch\?v=|youtu\.be/)([^&\n?#]+)', url)
    if not video_id:
        raise ValueError("Invalid YouTube URL")
    vid = video_id.group(1)

    async with httpx.AsyncClient(timeout=10) as client:
        oembed = await client.get(
            f"https://www.youtube.com/oembed?url={url}&format=json"
        )
        oembed_data = oembed.json() if oembed.status_code == 200 else {}

    return {
        "title": oembed_data.get("title", f"YouTube Video {vid}"),
        "summary": f"YouTube video by {oembed_data.get('author_name', 'Unknown')}",
        "content": f"YouTube video. Title: {oembed_data.get('title', '')}. Channel: {oembed_data.get('author_name', '')}",
        "tags": ["youtube", "video"],
        "type": "youtube",
        "thumbnail": oembed_data.get("thumbnail_url", ""),
    }

async def extract_github(url: str) -> dict:
    match = re.search(r'github\.com/([^/]+)/([^/\s?#]+)', url)
    if not match:
        raise ValueError("Invalid GitHub URL")
    owner, repo = match.group(1), match.group(2)

    async with httpx.AsyncClient(timeout=10, headers={"User-Agent": "Memora/1.0"}) as client:
        res = await client.get(f"https://api.github.com/repos/{owner}/{repo}")
        data = res.json() if res.status_code == 200 else {}

        readme_text = ""
        try:
            readme_res = await client.get(f"https://api.github.com/repos/{owner}/{repo}/readme")
            if readme_res.status_code == 200:
                import base64
                readme_data = readme_res.json()
                readme_text = base64.b64decode(readme_data.get("content", "")).decode("utf-8", errors="ignore")[:3000]
        except Exception:
            pass

    return {
        "title": data.get("full_name", f"{owner}/{repo}"),
        "summary": data.get("description", "GitHub repository"),
        "content": readme_text or data.get("description", "GitHub Repository"),
        "tags": data.get("topics", []) + ["github", "code"],
        "type": "github",
    }

async def extract_arxiv(url: str) -> dict:
    arxiv_id = re.search(r'arxiv\.org/abs/([^\s/]+)', url)
    if not arxiv_id:
        raise ValueError("Invalid arXiv URL")
    aid = arxiv_id.group(1)

    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.get(f"https://export.arxiv.org/api/query?id_list={aid}")
        text = res.text

    title = re.search(r'<title>(.*?)</title>', text, re.DOTALL)
    summary = re.search(r'<summary>(.*?)</summary>', text, re.DOTALL)
    authors = re.findall(r'<name>(.*?)</name>', text)

    return {
        "title": title.group(1).strip() if title else f"arXiv:{aid}",
        "summary": summary.group(1).strip() if summary else "",
        "content": summary.group(1).strip() if summary else "",
        "tags": authors[:5] + ["arxiv", "paper", "research"],
        "type": "paper",
    }

async def extract_article(url: str) -> dict:
    """Fetch and parse article using BeautifulSoup with meta tag fallback."""
    async with httpx.AsyncClient(
        timeout=15, headers=HEADERS, follow_redirects=True
    ) as client:
        res = await client.get(url)
        html = res.text

    soup = BeautifulSoup(html, "lxml")

    # Remove noise
    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "form"]):
        tag.decompose()

    # Title
    og_title = soup.find("meta", property="og:title")
    title = (
        og_title["content"] if og_title else
        soup.find("title").get_text(strip=True) if soup.find("title") else
        urlparse(url).netloc
    )

    # Description
    og_desc = soup.find("meta", property="og:description")
    meta_desc = soup.find("meta", attrs={"name": "description"})
    summary = (
        og_desc["content"] if og_desc else
        meta_desc["content"] if meta_desc else ""
    )

    # Main content - try article/main tags first
    content_el = (
        soup.find("article") or
        soup.find("main") or
        soup.find(class_=re.compile(r'(post|article|content|body)', re.I)) or
        soup.find("body")
    )
    content = content_el.get_text(separator=" ", strip=True)[:8000] if content_el else summary

    if len(content) < 100:
        raise ValueError("Insufficient content extracted")

    # Tags from keywords meta
    keywords_meta = soup.find("meta", attrs={"name": "keywords"})
    tags = []
    if keywords_meta and keywords_meta.get("content"):
        tags = [k.strip() for k in keywords_meta["content"].split(",")][:5]

    return {
        "title": title,
        "summary": summary or content[:200],
        "content": content,
        "tags": tags,
        "type": "article",
    }

async def extract_meta_fallback(url: str) -> dict:
    """Last resort: grab only og meta tags."""
    async with httpx.AsyncClient(timeout=10, headers=HEADERS, follow_redirects=True) as client:
        res = await client.get(url)
        html = res.text

    soup = BeautifulSoup(html, "lxml")
    og_title = soup.find("meta", property="og:title")
    og_desc = soup.find("meta", property="og:description")
    title_tag = soup.find("title")

    title = og_title["content"] if og_title else (title_tag.get_text() if title_tag else urlparse(url).netloc)
    desc = og_desc["content"] if og_desc else ""

    if not title:
        raise ValueError("Could not extract any content")

    return {
        "title": title,
        "summary": desc,
        "content": desc or title,
        "tags": [],
        "type": "article",
    }

# ── Universal Extractor ───────────────────────────────────────────────────────

async def universal_extract(url: str) -> dict:
    url_type = detect_type(url)
    print(f"[extractor] Detected type: {url_type} for {url}")

    # Blocked types
    if url_type in ("linkedin", "twitter", "pinterest"):
        # Fall through to meta fallback for these
        pass
    elif url_type == "youtube":
        return await extract_youtube(url)
    elif url_type == "github":
        return await extract_github(url)
    elif url_type == "paper":
        return await extract_arxiv(url)

    # Article / blog / blocked social — try full extraction then fallback
    try:
        data = await extract_article(url)
        print(f"[extractor] ✅ Article extraction succeeded")
        return data
    except Exception as e:
        print(f"[extractor] Article extraction failed: {e} — trying meta fallback")

    try:
        data = await extract_meta_fallback(url)
        print(f"[extractor] ⚠️ Using meta fallback")
        return data
    except Exception as e:
        raise ValueError(f"All extraction methods failed for {url}: {e}")
