import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { motion } from 'framer-motion'
import { User, LogOut, Globe, Check, History, Settings, Save } from 'lucide-react'

const AniListManager = forwardRef(({ onUserUpdate, profileData, setProfileData }, ref) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [loginStatus, setLoginStatus] = useState('')
  const [showTroubleshoot, setShowTroubleshoot] = useState(false)
  const [isManual, setIsManual] = useState(false)
  const [manualTokenInput, setManualTokenInput] = useState('')
  const [isExchanging, setIsExchanging] = useState(false)
  const [isFetchingProfile, setIsFetchingProfile] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    syncProfile: async (newBio) => {
      if (!token) return { success: false, message: "Not logged in" };

      setIsSyncing(true);
      const query = `
        mutation ($about: String) {
          UpdateUser (about: $about) {
            about
          }
        }
      `;

      try {
        const res = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ query, variables: { about: newBio } }),
        });
        const data = await res.json();
        if (data.errors) throw new Error(data.errors[0].message);

        setLoginStatus('Bio synced to AniList!');
        return { success: true };
      } catch (err) {
        console.error("Sync error:", err);
        setLoginStatus('Bio sync failed: ' + err.message);
        return { success: false, message: err.message };
      } finally {
        setIsSyncing(false);
      }
    }
  }));

  // 1. Detection Logic for Code/Token Fallback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const hash = window.location.hash;

    // Handle Direct Token (Implicit Grant)
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      if (token) {
        copyToClipboard(token, 'Token detected and copied!');
        localStorage.setItem('anilist_token', token);
        window.history.replaceState({}, document.title, "/settings");
        setToken(token);
        setIsLoggedIn(true);
      }
    }

    // Handle Code Fallback (Copy & Pre-fill)
    if (code) {
      copyToClipboard(code, 'Code detected and copied! Please use manual login if needed.');
      setManualTokenInput(code);
      setIsManual(true);
      setLoginStatus('Code detected! Redirect often fails, so we copied it for you.');
      window.history.replaceState({}, document.title, "/settings");
    }

    if (!code && !hash.includes('access_token')) {
      const savedToken = localStorage.getItem('anilist_token');
      if (savedToken) {
        setToken(savedToken);
        setIsLoggedIn(true);
      }
    }
  }, []);

  const copyToClipboard = (text, message) => {
    try {
      navigator.clipboard.writeText(text);
      setLoginStatus(message);
      console.log(message);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // 2. Fetch User Profile & Sync Local State
  useEffect(() => {
    if (!token) return;

    setIsFetchingProfile(true);
    setLoginStatus('Fetching profile info...');

    const query = `
      query {
        Viewer {
          id
          name
          about
          avatar { large }
          bannerImage
          statistics {
            anime { count episodesWatched minutesWatched }
          }
        }
      }
    `;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    fetch('https://graphql.anilist.co', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ query }),
    })
      .then(res => res.json())
      .then(data => {
        clearTimeout(timeoutId);
        if (data.data?.Viewer) {
          const v = data.data.Viewer;
          setUser(v);
          localStorage.setItem('user_profile_data', JSON.stringify(v));
          if (onUserUpdate) onUserUpdate(v);
          setLoginStatus('Welcome back, ' + v.name + '!');

          // Sync AniList bio to local state if local is empty
          if (setProfileData) {
            setProfileData(prev => ({
              ...prev,
              name: prev.name || v.name,
              bio: prev.bio || v.about?.replace(/<[^>]*>/g, '') || ''
            }));
          }
        } else {
          setLoginStatus('Invalid token or session expired.');
          setIsLoggedIn(false);
          setToken(null);
          if (onUserUpdate) onUserUpdate(null);
        }
      })
      .catch(err => {
        clearTimeout(timeoutId);
        console.error("Error fetching profile:", err);
        if (err.name === 'AbortError') {
          setLoginStatus('Profile fetch timed out. Check your connection.');
        } else {
          setLoginStatus('Failed to load profile. Is your token valid?');
        }
      })
      .finally(() => setIsFetchingProfile(false));
  }, [token]);

  const handleLogin = () => {
    const clientId = "37352";
    // Removing redirect_uri as it causes issues for this client; using default registered one.
    window.location.href = `https://anilist.co/api/v2/oauth/authorize?client_id=${clientId}&response_type=token`;
  };

  const handleManualLogin = async () => {
    const rawVal = manualTokenInput.trim();
    if (!rawVal) return;

    // This block is primarily for handling 'code' if it somehow ends up here,
    // but with response_type=token, direct tokens are expected.
    if (rawVal.length < 100 || !rawVal.includes('.')) {
      setLoginStatus('Detected a code! Swapping for token...');
      setIsExchanging(true);

      const clientId = "37352";
      const clientSecret = 'wFsK0V8n3B6QvZFw0AspliudyHlOwVRoeqeaSGO2';
      const redirectUri = window.location.origin + '/settings';
      const body = `grant_type=authorization_code&client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${rawVal}`;

      try {
        const res = await fetch(`https://corsproxy.io/?${encodeURIComponent('https://anilist.co/api/v2/oauth/token')}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body
        });
        const data = await res.json();
        if (data.access_token) {
          localStorage.setItem('anilist_token', data.access_token);
          setToken(data.access_token);
          setIsLoggedIn(true);
          setLoginStatus('Swap successful! Logging in...');
        } else {
          setLoginStatus(`Swap failed: ${data.error || 'Invalid code'}. Trying as token...`);
          setToken(rawVal);
          setIsLoggedIn(true);
        }
      } catch (err) {
        setLoginStatus('Swap failed. Using as direct token...');
        setToken(rawVal);
        setIsLoggedIn(true);
      } finally {
        setIsExchanging(false);
      }
    } else {
      localStorage.setItem('anilist_token', rawVal);
      setToken(rawVal);
      setIsLoggedIn(true);
      setLoginStatus('Logging in with token...');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('anilist_token');
    setIsLoggedIn(false);
    setToken(null);
    setUser(null);
    if (onUserUpdate) onUserUpdate(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white uppercase tracking-wider italic">AniList Sync</h2>
        {isLoggedIn && (
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/20 transition-all border border-rose-500/20"
          >
            <LogOut className="w-3 h-3" />
            Disconnect
          </button>
        )}
      </div>

      {/* Profile Header (Compact) */}
      {user && (
        <div className="relative group rounded-[24px] overflow-hidden border border-white/5 bg-base/20 backdrop-blur-md">
          <div className="h-24 w-full relative">
            {user.bannerImage ? (
              <img src={user.bannerImage} className="w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-1000" alt="banner" />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-accent/10 to-transparent" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-base to-transparent" />
          </div>
          <div className="absolute inset-0 flex items-center px-6 pt-4">
            <div className="flex items-center gap-4">
              <div className="relative group/avatar">
                <img src={user.avatar.large} className="w-14 h-14 rounded-xl border-2 border-surface shadow-2xl transition-transform group-hover/avatar:scale-105" alt="avatar" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-lg font-black text-white tracking-tight leading-none mb-1">{user.name}</h3>
                <span className="text-[9px] font-black text-accent uppercase tracking-[0.2em] bg-accent/10 px-2 py-0.5 rounded-md inline-block">Authenticated</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Login & Controls (Compact) */}
      {!isLoggedIn ? (
        <div className="p-6 rounded-[24px] bg-surface/30 border border-white/5 flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
            <Globe className="w-6 h-6 text-accent" />
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-base font-black text-white uppercase tracking-widest">Connect Account</h3>
            <p className="text-neutral-500 text-[10px] font-bold max-w-[200px]">Sync your watching progress instantly</p>
          </div>
          <div className="flex flex-col items-center gap-3 w-full">
            <button
              onClick={handleLogin}
              className="w-full py-3 rounded-xl bg-accent hover:bg-accent-hover text-white font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-accent/20"
            >
              Sign in with AniList
            </button>

            <button
              onClick={() => setIsManual(!isManual)}
              className="text-[9px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
            >
              {isManual ? 'Use Automatic' : 'Manual Entry'}
            </button>

            {isManual && (
              <div className="w-full flex flex-col gap-2">
                <p className="text-[8px] font-black text-neutral-500 uppercase tracking-widest">
                  {manualTokenInput ? 'Code detected!' : 'Enter code or token'}
                </p>
                <input
                  type="text"
                  value={manualTokenInput}
                  onChange={(e) => setManualTokenInput(e.target.value)}
                  placeholder="Paste here..."
                  className="w-full px-3 py-2 rounded-lg bg-base/50 border border-border text-[10px] focus:border-accent/50 outline-none transition-all font-bold"
                />
                <button
                  onClick={handleManualLogin}
                  disabled={isExchanging}
                  className={`w-full py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${manualTokenInput ? 'bg-accent text-white' : 'bg-white/5 hover:bg-white/10 text-neutral-400'}`}
                >
                  {isExchanging ? 'Working...' : 'Verify Login'}
                </button>
              </div>
            )}
          </div>

          {loginStatus && (
            <p className={`text-[9px] font-black uppercase tracking-[0.15em] mt-2 ${loginStatus.includes('failed') || loginStatus.includes('Error') ? 'text-rose-500' : 'text-accent animate-pulse'}`}>
              {loginStatus}
            </p>
          )}
        </div>
      ) : isFetchingProfile && !user ? (
        <div className="p-8 rounded-[24px] bg-surface/40 border border-border/50 animate-pulse flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/5" />
          <p className="text-[9px] text-neutral-500 font-black uppercase tracking-widest">{loginStatus}</p>
        </div>
      ) : null}
    </div>
  )
})

export default AniListManager
