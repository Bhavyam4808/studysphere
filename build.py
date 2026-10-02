#!/usr/bin/env python3
"""
StudySphere - Modular Component Assembler
=========================================
Assembles individual React modular source files (src/components/*, src/pages/*)
into a single unified bundle (src/bundle.jsx) for zero-configuration,
instant execution with in-browser Babel Standalone or bundling tools.
"""

import os
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SRC_DIR = os.path.join(BASE_DIR, 'src')

ORDER = [
    'api.js',
    'components/Icons.jsx',
    'components/RatingStars.jsx',
    'components/ResourceCard.jsx',
    'components/SubjectCard.jsx',
    'components/PdfViewerModal.jsx',
    'components/VideoPlayerModal.jsx',
    'components/Toast.jsx',
    'components/Navbar.jsx',
    'components/Footer.jsx',
    'pages/Home.jsx',
    'pages/Subjects.jsx',
    'pages/Resources.jsx',
    'pages/Dashboard.jsx',
    'pages/Bookmarks.jsx',
    'pages/StudyAI.jsx',
    'pages/AdminDashboard.jsx',
    'pages/Login.jsx',
    'pages/Register.jsx',
    'App.jsx'
]

def build():
    combined = [
        "// ============================================================================",
        "// StudySphere - Combined React Application Bundle",
        "// Auto-assembled from modular components in src/",
        "// ============================================================================",
        "",
        "const { useState, useEffect, useRef, useMemo } = React;",
        ""
    ]

    for rel_path in ORDER:
        full_path = os.path.join(SRC_DIR, rel_path)
        if not os.path.exists(full_path):
            print(f"[Warning] File not found: {full_path}")
            continue

        with open(full_path, 'r', encoding='utf-8') as f:
            code = f.read()

        # Clean imports and exports for in-browser concatenated execution
        # 1. Remove ES6 import statements
        code = re.sub(r'^\s*import\s+.*?;\s*$', '', code, flags=re.MULTILINE)
        # 2. Convert 'export function ...' or 'export const ...' to standard definitions
        code = re.sub(r'^\s*export\s+default\s+', '', code, flags=re.MULTILINE)
        code = re.sub(r'^\s*export\s+(function|const|let|var|class)\s+', r'\1 ', code, flags=re.MULTILINE)
        # 3. Remove standalone 'export { ... }' blocks
        code = re.sub(r'^\s*export\s*\{[^}]*\}\s*;?\s*$', '', code, flags=re.MULTILINE)

        combined.append(f"\n// ==========================================")
        combined.append(f"// File: src/{rel_path}")
        combined.append(f"// ==========================================\n")
        combined.append(code)

    # Mount entrypoint
    combined.append("""
// ==========================================
// Application Mount Point
// ==========================================
(function mountApp() {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
  } else {
    console.error('Could not find #root element to mount StudySphere.');
  }
})();
""")

    out_path = os.path.join(SRC_DIR, 'bundle.jsx')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(combined))

    print(f"Successfully assembled StudySphere bundle: {out_path} ({len(combined)} sections)")

if __name__ == '__main__':
    build()
