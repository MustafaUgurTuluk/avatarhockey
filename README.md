# 🌀 Avatar Element Hockey

[![Canlı Demo](https://img.shields.io/badge/Canlı%20Oyna-GitHub%20Pages-00f5ff?style=for-the-badge&logo=github)](https://MustafaUgurTuluk.github.io/avatarhockey/)

Aksiyon dolu, özel fizik motoruna sahip, özgün element bükücü yetenekleri ve atmosferik haritalar içeren yeni nesil hava hokeyi oyunu. Tek klavyede **2 Kişilik**, **Yapay Zekaya (Bot)** karşı veya WebRTC üzerinden **P2P Çevrimiçi Çok Oyunculu** olarak oynanabilir!

---

## 🎮 Oyun Modları

* 🤖 **Yapay Zeka (Bot)**: Bükücü reflekslerine sahip akıllı bota karşı tek kişilik maç.
* 👥 **Yerel 2 Kişilik**: Tek klavye üzerinde arkadaşınızla yüz yüze kapışma.
* 🌐 **P2P Online Çok Oyunculu**: Sunucusuz, düşük gecikmeli WebRTC DataChannel teknolojisiyle oda kodu paylaşarak uzaktaki arkadaşınızla çevrimiçi maç.

---

## 🥋 Bükücüler (Şampiyonlar)

Her karakter kendine has kütle, ivmelenme, vuruş gücü ve iki aktif bükme yeteneğine sahiptir:

| Karakter | Element | Kütle / Profil | 1. Yetenek | 2. Yetenek |
|---|---|---|---|---|
| **Katara** | Su 🌊 | Dengeli Orta Sıklet (`mass: 1.0`) | **Buz Hunisi**: Rakip kaleye buz fırlatır; değerse 7sn kaleye yönlendiren buz hunisi örer. | **Su Kırbacı**: İleriye kırbaç savurur, topu fırlatır ve rakibi 3sn dondurur. |
| **Zuko** | Ateş 🔥 | Kaslı Hücumcu (`mass: 1.1`) | **Ateş Topu**: Sahadaki topa anında müdahale edip alev topu fırlatır. | **Alev Duvarı**: Ortada topu geri sektiren ve topa alev hız boostu kazandıran duvar örer. |
| **Aang** | Hava 🌪️ | Çevik Tüy Sıklet (`mass: 0.85`) | **Rüzgar Çekimi**: Yakınına gelen topu yakalayıp rakip kaleye süper hızla fırlatır. | **Hava Işınlanması**: Anında kendi kalesinin önüne ışınlanır ve rüzgar patlaması saçar. |
| **Toph** | Toprak 🪨 | Sarsılmaz Ağır Sıklet (`mass: 1.35`) | **Kaya Duvarı**: Kendi kalesinin ağzına geçici kaya barikatı örer. | **Kaya Fırlatma**: Menzilli kaya fırlatır; zeminde engel oluşturur. |
| **Azula** | Yıldırım ⚡ | Keskin & Patlayıcı (`mass: 0.95`) | **Yıldırım Oku**: Topa elektrik yükleyerek zikzak yörüngede süper hızla fırlatır. | **Statik Şok**: Şok dalgası yayar; topu Azula'nın tam tersine fırlatır ve rakibi sarsar. |

---

## 🏟️ Atmosferik Haritalar

1. ❄️ **Buz Haritası (Kuzey Su Kabilesi)**: Zemin kaygandır; bükücüler buz üzerinde kayar (Katara hariç). Ortadan iki yana süpüren devasa buz dalgaları doğal okyanus dalgası sesiyle sahayı yarar.
2. 🔥 **Ateş Haritası (Ateş Ulusu Başkenti)**: Zeminde volkanik yarık ve alev dilleri yükselir; üzerinden geçen top alev boostu alır, Zuko haricinde alevlere basan bükücüler anlık stun yer (aynı alevde yalnızca 1 kez sersemler, alevin içinde kilitli kalmaz).
3. 🌪️ **Hava Haritası (Güney Hava Tapınağı)**: Dinamik rüzgar akımları ve dönen hortum topu ve raketleri savurur.
4. 🪨 **Toprak Haritası (Ba Sing Se)**: Ortadaki balçık alan raketleri yavaşlatır; zemindeki kaya parçaları topu sektirir.
5. ⚡ **Fırtına Haritası (Yıldırım Zirvesi)**: Kenar bantları elektrik yüklüdür; banta çarpan top +%18 ivmelenir (Azula hariç).

---

## ⚙️ Fizik & Oynanış Dinamikleri (Version 2.0)

* **Kütle & Çekiş Fiziği (Grounded Weight)**: Karakterler basışta kütleye dayalı pürüzsüz ivmelenir, bırakışta 2-3 kare içinde kaymadan sağlam adımlarla durur. Hareket yönüne göre karakter hafifçe eğilir (tilt).
* **Dengeli Hücum Şutu (Momentum Smash)**: Yalnızca anlık dokunmalar yerine karakter koşu ivmesini tam aldığında (%75+ hız) güçlü hücum şutu açığa çıkar; hafif dokunmalar kontrollü temas sağlar.
* **Hızlı Hız Sönümlenmesi (Dynamic Decay)**: Top kazandığı aşırı hızı zamanla dengeli bir biçimde kaybeder, savunma oyuncularına stratejik reaksiyon payı tanır.
* **Arkadan Vuruş Cezası & Tok Stun Sesi (Back-Hit Penalty & Muted Thud)**: Top bükücüye arkadan çarparsa yetenek barları tamamen sıfırlanır, top vurması gibi tok hafif bir sesle anlık sersemletme (stun) alır. Başının üstünde dönen yıldızlar belirir.
* **Dengeli Yetenek Dolum Süreleri**: Yeteneklerin dolum süreleri taktiksel derinliği koruyacak şekilde optimize edilmiştir.
* **Ardışık Ralli İvmesi & İleri Hücum Şartı (Rally Heat & Forward Drive)**: İki oyuncu topun üzerine doğru hareket ederek karşılıklı vuruş yaptıkça ralli katlanarak hızlanır; topun üzerine koşulmayan durumlarda (sabit durma veya geri çekilme) ralli sıfırlanır:
  * `🔥 ATEŞLİ RALLİ X3` (13 - 16 km/h)
  * `⚡ SONİK RALLİ X5` (16 - 19 km/h)
  * `💥 HİPER RALLİ X7+` (20 - 21.5 km/h)
* **Alevli Kuyruklu Yıldız İzi & Süper Hız (Blazing Comet Trail)**: Ateş haritasındaki alevli alandan geçen veya Zuko'nun Alev Duvarı'na çarpan top, arkasında kor rengi alev izi ve kıvılcımlar bırakarak 23.0 - 24.5 km/h süpersonik hızlara ivmelenir.
* **Yastıklama (Defensive Cushion)**: Geri çekilirken vurulduğunda top yumuşatılır ve kontrol altına alınır.
* **Falso & Açı Saptırma (Spin & Slice)**: Dikey hareket halindeyken vurulduğunda falso ve kesme açısı verilir.

---

## ⌨️ Kontroller

| Eylem | 1. Oyuncu (P1) | 2. Oyuncu (P2) |
|---|---|---|
| **Hareket** | `W` `A` `S` `D` | `↑` `←` `↓` `→` (Ok Tuşları) |
| **Vuruş / Servis** | `SPACE` | `ENTER` veya `Numpad 0` |
| **1. Yetenek** | `Q` | `Shift Sağ` veya `Numpad 1` |
| **2. Yetenek** | `E` | `P` veya `Numpad 2` |
| **Duraklatma** | `ESC` | `ESC` |

---

## 🛠️ Kullanılan Teknolojiler

* **HTML5 Canvas 2D Engine**: Özel fizik, ivmelenme, sürekli çarpışma algılama (anti-tunneling sub-stepping) ve vektörel parçacık motoru.
* **Vanilla JavaScript (ES6+)**: Bağımlılıksız nesne yönelimli mimari.
* **Web Audio API**: Harici ses dosyası indirmeden tarayıcıda sentezlenen dinamik ses efektleri ve yükselen ralli frekansları.
* **WebRTC DataChannels**: P2P düşük gecikmeli, sunucusuz çok oyunculu senkronizasyon.
* **Modern CSS3**: Glassmorphism arayüz, neon glowing element auraları ve animasyonlar.

---

## 🚀 Yerel Olarak Çalıştırma

Projeyi yerel makinenizde çalıştırmak için terminalden şu komutlardan birini kullanabilirsiniz:

```bash
npx serve .
```
veya
```bash
python -m http.server 8080
```
Tarayıcınızda `http://localhost:3000` (veya `8080`) adresini açarak oynamaya başlayabilirsiniz!
