import pypdf
import os

reader = pypdf.PdfReader(r'C:\Users\MSI\.gemini\antigravity\brain\b2946e39-ad91-4c44-b7b1-1fdcd0c2735e\.user_uploaded\media_1793653265729_1ae419fd.pdf')
for i, page in enumerate(reader.pages):
    txt = page.extract_text() or ''
    if 'sara shih' in txt.lower():
        print(f"=== PAGE {i+1} ===")
        # Clean non-ascii
        cleaned = txt.encode('ascii', errors='replace').decode('ascii')
        print(cleaned[:1500])
