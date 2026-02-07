# Download Security Books - Instructions

This document provides instructions for downloading the full content of security books for your documentation files.

---

## ✅ Free & Open-Source Books (Can Download)

### 1. Building Secure and Reliable Systems (Google)
**Source**: https://google.github.io/building-secure-and-reliable-systems/  
**License**: CC-BY-4.0 (Free to use)  
**Download Method**:
```bash
# Option 1: Use the download script
node scripts/download-security-books.js

# Option 2: Manual download
# Visit https://google.github.io/building-secure-and-reliable-systems/
# Use browser "Save Page As" or use wget/curl
```

### 2. OWASP API Security Top 10
**Source**: https://owasp.org/www-project-api-security/  
**License**: Creative Commons (Free)  
**Download Method**:
```bash
# Use the download script
node scripts/download-security-books.js

# Or manually visit and save
```

### 3. OWASP LLM Top 10
**Source**: https://owasp.org/www-project-large-language-model-applications/  
**License**: Creative Commons (Free)  
**Download Method**:
```bash
# Use the download script
node scripts/download-security-books.js
```

### 4. OWASP Web Security Testing Guide
**Source**: https://owasp.org/www-project-web-security-testing-guide/  
**License**: Creative Commons (Free)  
**Download Method**:
```bash
# Visit https://owasp.org/www-project-web-security-testing-guide/
# Download PDF or use online version
```

---

## 📚 Copyrighted Books (Must Obtain Legally)

For copyrighted books, you need to obtain them through legal means:

### 5. Security Engineering (Ross Anderson)
- **Internet Archive**: https://archive.org (borrow for free)
- **Public Libraries**: Check digital library access
- **Purchase**: Wiley, Amazon, etc.

### 6. Designing Secure Software (Loren Kohnfelder)
- **No Starch Press**: Free sample chapters
- **Public Libraries**: Check digital library access
- **Purchase**: ~$40-50

### 7. Secure by Design
- **Manning Publications**: Free Content Center
- **Public Libraries**: Check digital library access
- **Purchase**: ~$40-50

### 8. Real-World Cryptography
- **Manning Publications**: Free Content Center
- **Public Libraries**: Check digital library access
- **Purchase**: ~$40-50

### 9. The Web Application Hacker's Handbook
- **Internet Archive**: https://archive.org (borrow for free)
- **Public Libraries**: Check digital library access
- **Purchase**: Wiley, Amazon, etc.

### 10. The Site Reliability Workbook
- **O'Reilly Learning Platform**: Trial access
- **Public Libraries**: Check digital library access
- **Purchase**: ~$50-60

---

## 🔧 Automated Download Script

A script is provided to download free/open-source content:

```bash
node scripts/download-security-books.js
```

This will:
- Download OWASP guides (API Security, LLM Top 10)
- Download Google's Building Secure and Reliable Systems
- Save to your documentation files with proper naming

---

## 📝 Manual Download Instructions

### For OWASP Guides:
1. Visit the OWASP website
2. Use browser "Save Page As" or "Print to PDF"
3. Copy content to your markdown files

### For Google's Book:
1. Visit https://google.github.io/building-secure-and-reliable-systems/
2. Use browser tools to save content
3. Or use wget/curl to download HTML

### For Copyrighted Books:
1. Use Internet Archive (archive.org) - free borrowing
2. Check your public library's digital collection
3. Purchase from official publishers
4. Copy content manually (for personal use only)

---

## ⚠️ Legal Notice

- **Free/Open-Source Content**: Can be downloaded and stored
- **Copyrighted Content**: Must be obtained legally
- **Personal Use**: Content downloaded for personal reference is generally acceptable
- **Distribution**: Do not redistribute copyrighted content

---

## 🎯 Recommended Approach

1. **Download free content** using the script
2. **Borrow copyrighted books** from Internet Archive or libraries
3. **Create summaries** in your documentation files
4. **Link to official sources** for full content
5. **Store your notes** and implementation guides

---

*This approach gives you a complete security reference library while respecting copyright laws.*
