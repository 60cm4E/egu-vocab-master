/* ===================================
   Audio Manager - TTS & Sound Effects
   =================================== */

const Audio = {
  synth: window.speechSynthesis,
  
  speak(text, lang = 'en-US') {
    if (!this.synth) return;
    this.synth.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = Storage.getSettings().ttsSpeed || 0.8;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Try to find a good English voice
    const voices = this.synth.getVoices();
    const preferred = voices.find(v => v.lang.startsWith('en') && v.name.includes('Samantha')) ||
                      voices.find(v => v.lang.startsWith('en-US')) ||
                      voices.find(v => v.lang.startsWith('en'));
    if (preferred) utterance.voice = preferred;
    
    this.synth.speak(utterance);
  },

  speakKorean(text) {
    this.speak(text, 'ko-KR');
  },

  // Sound effects using Web Audio API
  _ctx: null,
  
  _getCtx() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this._ctx;
  },

  playCorrect() {
    if (!Storage.getSettings().soundEffects) return;
    try {
      const ctx = this._getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      
      // Happy ascending notes
      osc.frequency.setValueAtTime(523, ctx.currentTime);        // C5
      osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);  // E5
      osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);  // G5
      
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch(e) {}
  },

  playWrong() {
    if (!Storage.getSettings().soundEffects) return;
    try {
      const ctx = this._getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      
      // Sad descending notes
      osc.frequency.setValueAtTime(330, ctx.currentTime);        // E4
      osc.frequency.setValueAtTime(262, ctx.currentTime + 0.15); // C4
      
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } catch(e) {}
  },

  playLevelUp() {
    if (!Storage.getSettings().soundEffects) return;
    try {
      const ctx = this._getCtx();
      const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
      
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.12 + 0.3);
        
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.3);
      });
    } catch(e) {}
  },

  playClick() {
    if (!Storage.getSettings().soundEffects) return;
    try {
      const ctx = this._getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.05);
    } catch(e) {}
  }
};

// Preload voices
if (Audio.synth) {
  Audio.synth.getVoices();
  Audio.synth.onvoiceschanged = () => Audio.synth.getVoices();
}
