'use strict';

/**
 * TitleMusic — Web Audio API music player for the title screen.
 *
 * Handles the "user gesture required" policy of modern browsers gracefully:
 *   - AudioContext created immediately (suspended state, no error)
 *   - Music starts on first user interaction (tap/click/key)
 *   - If audio is blocked or unavailable → silent, no crash
 *   - audioBlocked flag exposed so UI can show 🔇 if needed
 */
const TitleMusic = (() => {
  let ctx       = null;   // AudioContext
  let _muted    = false;  // user mute toggle
  let buffer    = null;   // decoded PCM
  let source    = null;   // active BufferSourceNode
  let gainNode  = null;   // for fade out
  let loaded    = false;
  let playing   = false;
  let _blocked  = true;   // assume blocked until proven otherwise

  const FILE = 'assets/music_title.mp3';

  function _createCtx() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      gainNode = ctx.createGain();
      gainNode.gain.value = 0.65;  // comfortable volume
      gainNode.connect(ctx.destination);
    } catch(e) { ctx = null; }
  }

  function _load() {
    if (!ctx || loaded) return;
    fetch(FILE)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(buf => ctx.decodeAudioData(buf))
      .then(decoded => { buffer = decoded; loaded = true; })
      .catch(() => { loaded = false; });  // silent fail
  }

  function _startSource() {
    if (!ctx || !buffer || !gainNode) return;
    if (source) { try { source.stop(); } catch(e) {} }
    source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop   = true;
    source.connect(gainNode);
    source.start(0);
    playing  = true;
    _blocked = false;
  }

  return {
    get audioBlocked() { return _blocked; },
    get isPlaying()    { return playing; },

    init() {
      _createCtx();
      _load();
    },

    // Call on first user gesture — resumes AudioContext if suspended
    onUserGesture() {
      if (!ctx) return;
      ctx.resume()
        .then(() => {
          _blocked = false;
          if (loaded && !playing) _startSource();
          else if (loaded && playing) {}  // already playing
          // If not loaded yet, will auto-start when load completes
          // (re-check after a short delay)
          else setTimeout(() => {
            if (loaded && !playing) _startSource();
          }, 500);
        })
        .catch(() => { _blocked = true; });
    },

    playTitle() {
      if (!ctx) { _createCtx(); _load(); return; }
      if (ctx.state === 'suspended') {
        // Will start on next user gesture
        return;
      }
      if (loaded && !playing) _startSource();
    },

    fadeOut(duration) {
      if (!gainNode || !playing) return;
      const dur = duration || 1.2;
      const now = ctx.currentTime;
      gainNode.gain.setValueAtTime(gainNode.gain.value, now);
      gainNode.gain.linearRampToValueAtTime(0, now + dur);
      setTimeout(() => {
        if (source) { try { source.stop(); } catch(e) {} source = null; }
        gainNode.gain.value = 0.65;  // reset for next time
        playing = false;
      }, dur * 1000 + 50);
    },

    stop() {
      if (source) { try { source.stop(); } catch(e) {} source = null; }
      playing = false;
      if (gainNode) gainNode.gain.value = 0.65;
    },

    // Mute toggle — persists across title/game transitions
    get muted() { return _muted; },
    toggleMute() {
      _muted = !_muted;
      if (gainNode) gainNode.gain.value = _muted ? 0 : 0.65;
    },
  };
})();
