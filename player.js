class SmartRadioPlayer {
    // Constructor'a yeni şarkı bulma (onNeedMoreTracks) ve arayüz güncelleme (onTrackChange) fonksiyonlarını ekledik
    constructor(token, trackUris, onNeedMoreTracks, onTrackChange) {
        this.token = token;
        this.trackUris = trackUris;
        this.deviceId = null;
        this.player = null;
        this.onNeedMoreTracks = onNeedMoreTracks; 
        this.onTrackChange = onTrackChange;       
        this.isFetching = false; // Aynı anda birden fazla şarkı arama isteğini engellemek için kilit
    }

    initialize() {
        return new Promise((resolve) => {
            window.onSpotifyWebPlaybackSDKReady = () => {
                this.player = new Spotify.Player({
                    name: 'Akıllı Radyo İstasyonu',
                    getOAuthToken: cb => { cb(this.token); },
                    volume: 0.5
                });

                this.player.addListener('ready', ({ device_id }) => {
                    console.log('Radyo Hoparlörü Hazır! Device ID:', device_id);
                    this.deviceId = device_id;
                    resolve();
                });

                // --- YENİ EKLENEN: DURUM İZLEME VE KUYRUK BESLEME ---
                this.player.addListener('player_state_changed', (state) => {
                    if (!state) return;

                    // 1. Mevcut Şarkı Bilgilerini Çıkar (Bir sonraki aşama için hazırlık)
                    const currentTrack = state.track_window.current_track;
                    if (currentTrack && this.onTrackChange) {
                        this.onTrackChange({
                            name: currentTrack.name,
                            artist: currentTrack.artists[0].name,
                            image: currentTrack.album.images[0].url
                        });
                    }

                    // 2. Şarkının bitmesine ne kadar kaldı hesapla (Senkronizasyon)
                    const position = state.position;
                    const duration = state.duration;
                    const remainingTimeMs = duration - position;

                    // Şarkının bitmesine 20 saniye kaldıysa ve kuyrukta şarkı yoksa
                    if (remainingTimeMs < 20000 && state.track_window.next_tracks.length === 0 && !this.isFetching) {
                        console.log("Kuyruk tükenmek üzere! Yeni şarkılar aranıyor...");
                        this.isFetching = true; 
                        
                        // auth.js'den gelecek olan yeni şarkı bulma döngüsünü tetikle
                        if (this.onNeedMoreTracks) {
                            this.onNeedMoreTracks().then((newUris) => {
                                this.addTracksToQueue(newUris).then(() => {
                                    this.isFetching = false; // Kilidi aç
                                });
                            });
                        }
                    }
                });

                this.player.addListener('initialization_error', ({ message }) => { console.error("Başlatma Hatası:", message); });
                this.player.addListener('authentication_error', ({ message }) => { console.error("Kimlik Hatası:", message); });

                this.player.connect();
            };

            const script = document.createElement("script");
            script.src = "https://sdk.scdn.co/spotify-player.js";
            script.async = true;
            document.body.appendChild(script);
        });
    }

    async play() {
        if (!this.deviceId) return;

        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${this.deviceId}`, {
            method: 'PUT',
            body: JSON.stringify({ uris: this.trackUris }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
        });
        console.log("🎶 Radyo yayını başladı!");
    }

    // --- YENİ EKLENEN: KUYRUĞA YENİ ŞARKI EKLEME METODU ---
    async addTracksToQueue(uris) {
        for (const uri of uris) {
            try {
                await fetch(`https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(uri)}&device_id=${this.deviceId}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${this.token}` }
                });
            } catch (error) {
                console.error("Kuyruğa ekleme hatası:", error);
            }
        }
        console.log(`${uris.length} yeni şarkı kuyruğa eklendi, yayın kesilmeyecek!`);
    }

    setVolume(level) {
        if (this.player) {
            this.player.setVolume(level);
        }
    }
}