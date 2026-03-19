import { Link } from 'react-router-dom'
import { Github, Twitter, MessageSquare, Mail, Heart, Sparkles } from 'lucide-react'
import uiStrings from '../config/ui_strings.json'

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-white/5 bg-surface/30 backdrop-blur-3xl">
      <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-16 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          
          {/* Brand Section */}
          <div className="flex flex-col gap-6">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-accent to-accent shadow-lg shadow-accent/20 group-hover:scale-110 transition-transform duration-500">
                <Sparkles className="w-5 h-5 text-white fill-current" />
              </div>
              <span className="text-2xl font-black text-white tracking-tighter italic">{uiStrings.common.appName.toUpperCase()}</span>
            </Link>
            <p className="text-sm text-neutral-500 font-medium leading-relaxed max-w-xs opacity-80">
              {uiStrings.footer.description}
            </p>
            <div className="flex items-center gap-5 mt-2">
              {[
                { icon: <Github className="w-5 h-5" />, href: '#' },
                { icon: <Twitter className="w-5 h-5" />, href: '#' },
                { icon: <MessageSquare className="w-5 h-5" />, href: '#' },
              ].map((social, i) => (
                <a 
                  key={i} 
                  href={social.href} 
                  className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-neutral-500 hover:text-white hover:border-accent/30 hover:bg-accent/5 transition-all duration-500"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Columns */}
          <div className="flex flex-col gap-6">
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">{uiStrings.footer.explore}</h4>
            <nav className="flex flex-col gap-4">
              <Link to="/" className="text-sm font-bold text-neutral-500 hover:text-accent transition-colors">{uiStrings.home.featuredTitle}</Link>
              <Link to="/recommend" className="text-sm font-bold text-neutral-500 hover:text-accent transition-colors">{uiStrings.navbar.recommend}</Link>
              <Link to="/watchlist" className="text-sm font-bold text-neutral-500 hover:text-accent transition-colors">{uiStrings.navbar.watchlist}</Link>
            </nav>
          </div>

          <div className="flex flex-col gap-6">
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Internal API</h4>
            <nav className="flex flex-col gap-4">
              <a href="https://jikan.moe" target="_blank" className="text-sm font-bold text-neutral-500 hover:text-emerald transition-colors">Jikan v4</a>
              <a href="https://anilist.co" target="_blank" className="text-sm font-bold text-neutral-500 hover:text-blue-400 transition-colors">AniList v2</a>
              <a href="#" className="text-sm font-bold text-neutral-500 hover:text-white transition-colors">Documentation</a>
            </nav>
          </div>

          {/* Newsletter / CTA */}
          <div className="flex flex-col gap-6">
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em]">{uiStrings.footer.premiumStatus}</h4>
            <div className="p-6 rounded-[32px] glass-dark border border-white/5 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-24 h-24 bg-violet/5 blur-2xl rounded-full -mr-8 -mt-8" />
               <p className="text-[11px] font-black text-neutral-400 uppercase tracking-widest leading-relaxed relative z-10">
                 {uiStrings.footer.alphaProgram}
               </p>
               <button className="mt-6 w-full py-4 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-violet hover:text-white transition-all duration-500 shadow-xl relative z-10 active:scale-95">
                 {uiStrings.footer.joinWaitlist}
               </button>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-[10px] font-black text-neutral-600 uppercase tracking-[0.2em]">
            &copy; 2024 {uiStrings.common.appName.toUpperCase()} • CRAFTED WITH <Heart className="w-3 h-3 inline-block text-rose-500 fill-current mx-1 mb-0.5" /> {uiStrings.footer.craftedWith.split('WITH HEART ')[1]}
          </p>
          <div className="flex items-center gap-8">
            <a href="#" className="text-[10px] font-black text-neutral-600 uppercase tracking-widest hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-[10px] font-black text-neutral-600 uppercase tracking-widest hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
