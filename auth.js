// Uygulama Kimlik Bilgileri
const clientId = '87356d185611423b94cc528eba03db91'; // Kendi Client ID'ni yapıştır
const redirectUri = 'https://herus435.github.io'; // Test ortamı portuna göre düzenle

// İstenen yetkiler (Radyo oynatma, geçmişi okuma ve durumu değiştirme) [cite: 31]
const scope = 'user-read-recently-played streaming user-read-email user-read-private user-modify-playback-state';

// 1. Rastgele Dize (Code Verifier) Oluşturma [cite: 26, 27]
function generateRandomString(length) {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

// 2. SHA-256 ile Code Challenge Oluşturma [cite: 28]
async function generateCodeChallenge(codeVerifier) {
    const data = new TextEncoder().encode(codeVerifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, [...new Uint8Array(digest)]))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

// 3. Spotify Yetkilendirme Sayfasına Yönlendirme [cite: 29]
async function redirectToAuthCodeFlow() {
    const verifier = generateRandomString(128);
    localStorage.setItem("verifier", verifier); // Doğrulayıcıyı sakla

    const challenge = await generateCodeChallenge(verifier);

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("response_type", "code");
    params.append("redirect_uri", redirectUri);
    params.append("scope", scope);
    params.append("code_challenge_method", "S256");
    params.append("code_challenge", challenge);

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

// 4. Yetkilendirme Kodunu Erişim Belirteciyle (Access Token) Değiştirme [cite: 33, 35]
async function getAccessToken(code) {
    const verifier = localStorage.getItem("verifier");

    const params = new URLSearchParams();
    params.append("client_id", clientId);
    params.append("grant_type", "authorization_code");
    params.append("code", code);
    params.append("redirect_uri", redirectUri);
    params.append("code_verifier", verifier);

    const result = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params
    });

    const { access_token, refresh_token } = await result.json();
    return { access_token, refresh_token };
}

// --- Sayfa Yüklendiğinde Çalışacak Akış ---
document.getElementById('login-btn').addEventListener('click', redirectToAuthCodeFlow);

// URL'de bir 'code' parametresi varsa (kullanıcı Spotify'dan geri dönmüşse)
const params = new URLSearchParams(window.location.search);
const code = params.get("code");

// auth.js içindeki kod bloğunun güncellenmiş hali:
// auth.js içindeki kod bloğunun güncellenmiş hali:
// auth.js içindeki kod bloğunun güncellenmiş hali:
// auth.js içindeki son bölümün GÜNCELLENMİŞ hali:
// auth.js içindeki son bölümün GÜNCELLENMİŞ hali:
if (code) {
    document.getElementById('login-btn').style.display = 'none';

    getAccessToken(code).then(async tokens => {
        const token = tokens.access_token;
        localStorage.setItem('spotify_access_token', token);
        
        // --- YENİ: OTURUM GEÇMİŞİ HAFIZASI ---
        const sessionHistory = new Set(); 
        
        document.getElementById('status').innerText = "Adım 1/4: Çekirdek set oluşturuluyor...";
        const analyzer = new TemporalAnalyzer(token);
        const seedSet = await analyzer.getSeedSet();
        
        document.getElementById('status').innerText = "Adım 2/4: Last.fm'den çeşitli şarkılar bulunuyor...";
        const LAST_FM_API_KEY = "3d07fd7d5d965c36f2ae1f8ef5938eaf"; // Kendi anahtarını unutma!
        const recommender = new LastFmRecommender(LAST_FM_API_KEY);
        const candidateSet = await recommender.getRecommendations(seedSet);
        
        document.getElementById('status').innerText = "Adım 3/4: Şarkılar Spotify ile eşleştiriliyor...";
        const filter = new PopularityFilter(token);
        const finalTracks = await filter.getSpotifyUris(candidateSet);
        
        // Sadece geçmişte çalınmayanları ilk kuyruğa ekle
        const uris = [];
        finalTracks.forEach(track => {
            if (!sessionHistory.has(track.spotifyUri)) {
                sessionHistory.add(track.spotifyUri);
                uris.push(track.spotifyUri);
            }
        });
        
        document.getElementById('status').innerText = "Adım 4/4: Radyo oynatıcısı bağlanıyor...";
        
        // --- GÜNCELLENEN: Kuyruk bittiğinde çalışacak algoritma ---
        const fetchMoreTracks = async () => {
            document.getElementById('status').innerText = "Arka planda yepyeni şarkılar bulunuyor...";
            const newSeedSet = await analyzer.getSeedSet(); 
            const newCandidateSet = await recommender.getRecommendations(newSeedSet);
            const newFinalTracks = await filter.getSpotifyUris(newCandidateSet);
            
            const newUris = [];
            newFinalTracks.forEach(track => {
                // Şarkı daha önce bu oturumda ÇALINMADIYSA listeye al
                if (!sessionHistory.has(track.spotifyUri)) {
                    sessionHistory.add(track.spotifyUri);
                    newUris.push(track.spotifyUri);
                }
            });

            document.getElementById('status').innerText = "🎵 Şu an çalıyor...";
            console.log(`${newUris.length} adet hiç çalınmamış şarkı kuyruğa eklendi.`);
            return newUris;
        };

        const handleTrackChange = (trackInfo) => {
            document.getElementById('now-playing').style.display = 'block';
            document.getElementById('album-art').src = trackInfo.image;
            document.getElementById('track-name').innerText = trackInfo.name;
            document.getElementById('artist-name').innerText = trackInfo.artist;
        };

        const radioPlayer = new SmartRadioPlayer(token, uris, fetchMoreTracks, handleTrackChange);
        await radioPlayer.initialize();

        document.getElementById('status').innerText = "Radyo yayınına hazırız! Aşağıdaki butona tıkla.";
        document.getElementById('player-controls').style.display = 'block';

        document.getElementById('play-radio-btn').addEventListener('click', () => {
            radioPlayer.play();
            document.getElementById('status').innerText = "🎵 Şu an çalıyor...";
        });

        document.getElementById('volume-slider').addEventListener('input', (e) => {
            radioPlayer.setVolume(e.target.value);
        });
        
        window.history.replaceState({}, document.title, "/index.html");
    }).catch(err => {
        console.error("Hata:", err);
        document.getElementById('status').innerText = "Bir hata oluştu, konsolu kontrol et.";
    });
}
