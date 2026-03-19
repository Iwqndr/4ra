import React from 'react';
import { ExternalLink, Globe } from 'lucide-react';

export default function RichLinkCard({ metadata, url }) {
  if (!metadata) return null;

  return (
    <div className="my-3 rounded-2xl bg-white/5 border border-white/10 overflow-hidden max-w-sm hover:border-accent/30 transition-all group">
      {metadata.image && (
        <div className="aspect-video w-full overflow-hidden border-b border-white/5">
          <img src={metadata.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
        </div>
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-[10px] font-black text-neutral-500 uppercase tracking-widest">
           <Globe className="w-3 h-3" />
           <span>{new URL(url).hostname}</span>
        </div>
        <h4 className="text-sm font-black text-white line-clamp-2 leading-tight group-hover:text-accent transition-colors">{metadata.title}</h4>
        {metadata.description && (
          <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">{metadata.description}</p>
        )}
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 pt-2 text-[10px] font-black text-accent uppercase tracking-widest hover:underline"
        >
          View Source <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
