class LastFmRecommender {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    async getRecommendations(seedSet) {
        let candidatePool = [];

        // Her bir çekirdek şarkı için Last.fm'den benzerlerini bul
        for (const seed of seedSet) {
            const similarTracks = await this.fetchSimilarFromLastFm(seed.name, seed.artist);
            
            if (similarTracks && similarTracks.length > 0) {
                similarTracks.forEach(track => {
                    const matchScore = parseFloat(track.match);
                    const relevanceScore = seed.weight * matchScore;

                    candidatePool.push({
                        name: track.name,
                        artist: track.artist.name,
                        relevanceScore: relevanceScore
                    });
                });
            }
        }

        // --- YENİ EKLENEN: SANATÇI LİMİTİ VE ÇEŞİTLİLİK KONTROLÜ ---
        const artistCounts = {};
        const diverseCandidates = [];

        // Skorlara göre büyükten küçüğe sırala
        candidatePool.sort((a, b) => b.relevanceScore - a.relevanceScore);

        for (const candidate of candidatePool) {
            // Şarkı havuzda zaten varsa atla (Kopya kontrolü)
            if (diverseCandidates.find(c => c.name === candidate.name)) continue;

            const artist = candidate.artist;
            if (!artistCounts[artist]) artistCounts[artist] = 0;

            // Aynı sanatçıdan en fazla 2 şarkıya izin ver (Çeşitliliği artırır)
            if (artistCounts[artist] < 2) {
                diverseCandidates.push(candidate);
                artistCounts[artist]++;
            }

            if (diverseCandidates.length >= 30) break; // 30 farklı adayı bulduğumuzda dur
        }

        return diverseCandidates;
    }

    async fetchSimilarFromLastFm(trackName, artistName) {
        const encodedArtist = encodeURIComponent(artistName);
        const encodedTrack = encodeURIComponent(trackName);
        
        // Asıl gitmek istediğimiz Last.fm adresi
        const targetUrl = `https://ws.audioscrobbler.com/2.0/?method=track.getSimilar&artist=${encodedArtist}&track=${encodedTrack}&api_key=${this.apiKey}&format=json&autocorrect=1&limit=10`;

        // CORS engeline takılmamak için araya ücretsiz ve güvenilir bir vekil sunucu (allorigins) koyuyoruz
        // targetUrl'yi encodeURIComponent içine almamız çok önemli
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

        try {
            // İsteği artık Last.fm'e değil, proxy üzerinden atıyoruz
            const response = await fetch(proxyUrl);
            const data = await response.json();
            
            if (data.similartracks && data.similartracks.track) {
                return data.similartracks.track;
            }
            return [];
        } catch (error) {
            console.error("Last.fm'den veri çekilirken hata:", error);
            return [];
        }
    }
}
