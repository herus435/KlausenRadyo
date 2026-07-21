# KlausenRadyo

Kullanıcıların organik Spotify dinleme geçmişini analiz ederek anlık müzik zevkine uygun, kesintisiz ve tamamen otonom bir radyo istasyonu yaratan web tabanlı bir uygulamadır. 

Modern dijital müzik platformlarının değişen yapılarına uyum sağlayan bu proje, Spotify'ın kapattığı öneri algoritmalarının yerine **Last.fm API**'sini kullanarak işbirlikçi filtreleme (collaborative filtering) yapar ve **Spotify Web Playback SDK** üzerinden müziği doğrudan tarayıcınızda çalar.

## ✨ Özellikler
* **Otonom Müzik Keşfi:** Son dinlediğiniz şarkıları analiz eder ve "Zamansal Bozunma" (Temporal Decay) algoritmasıyla anlık ruh halinize en uygun çekirdek veri setini oluşturur.
* **Kesintisiz Yayın (Sonsuz Döngü):** Şarkılar bitmek üzereyken arka planda yepyeni şarkılar bularak Spotify kuyruğunuza ekler, müzik siz durdurana kadar asla susmaz.
* **Tekrar Önleme Sistemi (Deduplication):** Aynı oturum içerisinde çalınan bir şarkıyı hafızasında tutarak tekrar çalınmasını engeller ve dinleme çeşitliliğini artırır.
* **Can Simidi (Fallback) Koruması:** Dış API'lerden (Last.fm) veri alınamaması veya ağ hataları yaşanması durumunda, yayın motorunun durmaması için otomatik olarak Global Hit parçaları devreye sokar.

## 🛠 Kullanılan Teknolojiler
* **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
* **Yetkilendirme:** OAuth 2.0 PKCE (Proof Key for Code Exchange)
* **Ses Oynatma:** Spotify Web Playback SDK
* **Veri ve Öneri Motoru:** Spotify Web API, Last.fm API

## ⚠️ Gereksinimler
Bu projenin çalışabilmesi için aşağıdaki şartların sağlanması gerekmektedir:
1. **Spotify Premium Hesabı:** Spotify Web Playback SDK, kurallar gereği yalnızca aktif Premium aboneliklerle ses oynatabilmektedir.
2. **Spotify Developer Hesabı:** [Spotify for Developers](https://developer.spotify.com/) paneli üzerinden oluşturulmuş bir uygulama.
3. **Last.fm API Anahtarı:** [Last.fm API](https://www.last.fm/api) üzerinden ücretsiz olarak alınmış bir geliştirici anahtarı.

## 🚀 Kurulum ve Ayarlar

Projeyi kendi yerel ortamınızda (`localhost`) veya canlı sunucunuzda (GitHub Pages vb.) çalıştırmak için aşağıdaki adımları izleyin:

### 1. Dosyaları İndirin
Proje dosyalarını bilgisayarınıza indirin veya klonlayın, ardından tercih ettiğiniz bir kod editöründe açın.

### 2. API Anahtarlarını ve URL Ayarlarını Yapılandırın
Projenin yetkilendirme ve iletişim süreçlerini yöneten `auth.js` dosyasını açın. Kendi hesaplarınıza ait bilgileri ilgili değişkenlere tanımlayın:


auth.js dosyasının ilgili bölümleri

1. Spotify Uygulama Kimliğiniz
const clientİd = 'BURAYA_SPOTIFY_CLIENT_ID_GELECEK'; 

2. Uygulamanızın çalıştığı ortam adresi (Otomatik veya Manuel)
const portURL = window.location.origin + window.location.pathname; 

3. Last.fm API Anahtarınız
const YOURAPİKEY = "BURAYA_LAST_FM_API_ANAHTARINIZ_GELECEK"; 


### 3. Spotify Geliştirici Panelini Ayarlayın (Kritik Adım)
Spotify'ın güvenli giriş akışını tamamlayabilmesi için uygulamanızın yönlendirme adresini yetkilendirmeniz gerekir:
1. Spotify Developer paneline gidin ve uygulamanızın **Settings (Ayarlar)** bölümüne girin.
2. **Redirect URIs** alanına, uygulamanızı çalıştırdığınız adresi ekleyin (örneğin `[http://127.0.0.1:5500/index.html](http://127.0.0.1:5500/index.html)` veya projenizin canlı yayın linki). 
3. *Not: Buraya eklediğiniz adresin, kod içerisindeki `portURL` değişkeni ile eşleşmesi zorunludur.*
4. Değişiklikleri kaydedin.

## 🎮 Kullanım
1. Projeyi tarayıcınızda açın.
2. Ekranda beliren **"Spotify ile Giriş Yap"** butonuna tıklayarak hesabınıza güvenli izin verin.
3. Algoritma arka planda son dinlemelerinizi analiz edip size özel şarkı havuzunu oluşturduktan sonra **"📻 Yayını Başlat"** butonu belirecektir.
4. Butona tıklayın, arkanıza yaslanın ve sizin için özel olarak seçilen kesintisiz otonom radyonun tadını çıkarın.

## 🏗 Sistem Mimarisi

Sistem, dört ana katmandan oluşan asenkron bir yapı üzerinde çalışır:
1. **Güvenlik Katmanı:** Tarayıcı tabanlı zafiyetleri önlemek için şifreleme ve karma (hashing) algoritmalarıyla PKCE akışı kullanılır.
2. **Geçmiş Veri Çıkarımı:** Spotify'dan kullanıcının son dinlediği 50 şarkı çekilir, hatalı zaman damgaları temizlenir ve *Zamansal Bozunma* modeliyle ağırlıklandırılır.
3. **Otonom Motor:** Çıkarılan ağırlıklı çekirdek set, Last.fm API'sine beslenerek işbirlikçi filtrelemeyle yepyeni aday parçalar üretir.
4. **Çapraz Doğrulama ve Oynatma:** Üretilen aday parçalar Spotify veri tabanında eşleştirilir ve URI kodları bulunarak Web Playback SDK üzerinden kesintisiz yayın kuyruğuna aktarılır.

---

## 👨‍💻 Kredi & Teşekkürler (Credits) 

Projenin otonom müzik keşfi özelliklerine sağladığı devasa veri tabanı ve algoritmik destekten dolayı [Last.fm / Audioscrobbler](https://www.last.fm/) altyapısına teşekkürler.
