class TemporalAnalyzer {
    constructor(token, decayRate = 0.5) {
        this.token = token;
        // Unutma katsayısı (\lambda). Yüksek değer, sistemi son dinlenenlere daha çok odaklar [cite: 61]
        this.lambda = decayRate; 
    }

    // Ana tetikleyici fonksiyon: Çekirdek Seti oluşturur [cite: 64]
    async getSeedSet() {
        const rawData = await this.fetchRecentlyPlayed();
        const cleanData = this.sanitizeData(rawData);
        const weightedTracks = this.applyTemporalDecay(cleanData);
        
        // En yüksek ağırlığa sahip 5 parçayı seç [cite: 64]
        return weightedTracks.sort((a, b) => b.weight - a.weight).slice(0, 5);
    }

    async fetchRecentlyPlayed() {
        // Spotify API, bu uç noktada geçmişe dönük en fazla 50 parça döndürür [cite: 45]
        const response = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=50", {
            headers: { "Authorization": `Bearer ${this.token}` }
        });
        
        if (!response.ok) throw new Error("Veri çekilemedi!");
        
        const data = await response.json();
        return data.items;
    }

    sanitizeData(items) {
        // Veri Doğrulama ve Normalleştirme Katmanı [cite: 51]
        return items.filter((item, index, arr) => {
            // 30 saniyeden kısa dinlemeleri atla [cite: 52]
            if (item.track.duration_ms < 30000) return false;
            
            // Arka arkaya aynı saniye damgasıyla gelen (imkansız) verileri filtrele [cite: 52]
            if (index > 0 && item.played_at === arr[index - 1].played_at) return false;

            return true;
        });
    }

    applyTemporalDecay(items) {
        const now = new Date();

        return items.map(item => {
            const playedAt = new Date(item.played_at);
            
            // Zaman farkını saat cinsinden hesapla (\Delta \tau_i) 
            const deltaTau = (now - playedAt) / (1000 * 60 * 60); 

            // Üstel bozunma formülü 
            const weight = Math.exp(-this.lambda * deltaTau);

            return {
                id: item.track.id,
                name: item.track.name,
                artist: item.track.artists[0].name,
                playedAt: item.played_at,
                weight: weight.toFixed(4) // Okunabilirlik için yuvarlıyoruz
            };
        });
    }
}