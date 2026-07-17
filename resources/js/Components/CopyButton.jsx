import { useState } from 'react';

export default function CopyButton({ text, className = '' }) {
    const [copied, setCopied] = useState(false);

    async function copy(e) {
        e.preventDefault();
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            // Fallback for non-secure contexts / older browsers
            const el = document.createElement('textarea');
            el.value = text;
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    return (
        <button onClick={copy} title="نسخ اسم الملف"
            className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg transition-colors ${copied ? 'bg-green-100 text-green-700' : 'bg-cream-2 text-muted hover:bg-cream-3'} ${className}`}>
            {copied ? '✓ تم النسخ' : '📋 نسخ'}
        </button>
    );
}
