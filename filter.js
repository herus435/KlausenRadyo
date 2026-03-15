class PopularityFilter {
    constructor(token) {
        this.token = token;
    }

    async getSpotifyUris(candidateSet) {
        const finalTracks = [];
        
        // API arama limitlerine takılmamak ve performansı korumak için en yüksek skorlu 5 adayı seçiyoruz [cite: 97, 163]
        const topCandidates = candidateSet.slice(0, 5);

        // Şarkıların Spotify URI'lerini bulmak için paralel arama (Promise.all) kullanıyoruz 
        const searchPromises = topCandidates.map(candidate => 
            this.searchTrackOnSpotify(candidate.name, candidate.artist)
        );

        const uris = await Promise.all(searchPromises);

        // Sadece Spotify'da başarıyla eşleşenleri nihai listeye ekle
        topCandidates.forEach((candidate, index) => {
            if (uris[index]) {
                finalTracks.push({
                    name: candidate.name,
                    artist: candidate.artist,
                    spotifyUri: uris[index]
                });
            }
        });

        return finalTracks;
    }

    async searchTrackOnSpotify(trackName, artistName) {
        // İsimleri temizle ve arama sorgusunu oluştur
        const query = encodeURIComponent(`track:${trackName} artist:${artistName}`);
        
        // Arama limiti 10'a düşürüldüğü için gereksiz veri çekmemek adına limit=1 yapıyoruz [cite: 97]
        const url = `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`;

        try {
            const response = await fetch(url, {
                headers: { "Authorization": `Bearer ${this.token}` }
            });
            const data = await response.json();
            
            // Eğer Spotify'da bu isimde bir parça bulunduysa URI kodunu döndür
            if (data.tracks && data.tracks.items.length > 0) {
                return data.tracks.items[0].uri;
            }
            return null;
        } catch (error) {
            console.error(`Spotify'da '${trackName}' aranırken hata:`, error);
            return null;
        }
    }
}