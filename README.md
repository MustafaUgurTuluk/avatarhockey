# 🌀 Avatar Element Hockey

Tek klavyede **2 Kişilik** veya **Yapay Zekaya (Bot)** karşı oynanabilen, özgün element bükücü yetenekleri ve 4 farklı atmosferik harita içeren aksiyon dolu masa hokeyi oyunu.

---

## 🎮 Bükücüler ve Özel Yetenekler

### 🌊 Katara (Su Bükücü)
- **1. Yetenek (`Q` / `RSHIFT`) - Buz Hunisi Duvarı**: Rakip kalesine doğru buz şeridi fırlatır. Kale ağzına değdiğinde 7 saniye boyunca topu kaleden içeri yönlendiren buz hunileri oluşturur.
- **2. Yetenek (`E` / `P`) - Su Kırbacı**: İleriye doğru su kırbacı savurur. Kırbaçla vurulan top buz enerjisiyle yüklenir; rakip oyuncuya temas ettiğinde rakibi **3 saniye boyunca dondurur**.

### 🔥 Zuko (Ateş Bükücü)
- **1. Yetenek (`Q` / `RSHIFT`) - Uzaktan Ateş Vuruşu**: Sahadaki topa uzaktan ateş patlaması ile müdahale ederek rakibe doğru fırlatır.
- **2. Yetenek (`E` / `P`) - Alev Duvarı**: Tuşa basılı tutulduğunda orta çizgide kademeli olarak büyüyen alev duvarı örer. Top bu duvara çarptığında süper hız boostu kazanır.

### 🌪️ Aang (Hava Bükücü)
- **1. Yetenek (`Q` / `RSHIFT`) - Rüzgar Çekimi & Fırlatma**: Yakındaki topu rüzgar vakumu ile yakalar ve yüksek hızla karşı kaleye fırlatır.
- **2. Yetenek (`E` / `P`) - Hava Işınlanması**: Anında kendi kalesinin önüne ışınlanarak rüzgar dalgası saçar ve kalesini savunur.

### 🪨 Toph (Toprak Bükücü)
- **1. Yetenek (`Q` / `RSHIFT`) - Kaya Duvarı**: Kendi kale ağzına kısa süreliğine kırılmaz kaya duvarı örer.
- **2. Yetenek (`E` / `P`) - Menzilli Kaya Fırlatma**: Saha boyunun yarısı kadar ilerleyen bir kaya fırlatır. Rakibe değerse **rakibi geri iter** ve menzili bitince zeminde geçici kaya engeli olarak kalır.

---

## 🗺️ Element Haritaları & Saha Tehlikeleri

- ❄️ **Buz Haritası**: Zemin kaygandır (Katara etkilenmez). Belli aralıklarla geçen dev su dalgası pedalları geriye sürükler.
- 🌋 **Ateş Haritası**: Orta alan yasaklı bölgedir (Zuko etkilenmez). Rastgan çıkan alev alanı topa temas ederse top süper hız kazanır.
- 💨 **Hava Haritası**: Çapraz rüzgar akımları pedalları iter (Aang etkilenmez). Zeminde çıkan hortum topu rastgele savurur.
- 🪨 **Toprak Haritası**: Çamurlu orta zemin oyuncuları yavaşlatır (Toph etkilenmez). Zeminden yükselen kaya engelleri oluşur.

---

## 🕹️ Oyun Kontrolleri

| Eylem | Oyuncu 1 (P1) | Oyuncu 2 (P2) |
|---|---|---|
| **Hareket** | `W` `A` `S` `D` | `Yön Okları` |
| **Topu Gönderme / Vuruş** | `SPACE` | `ENTER` / `Numpad0` |
| **1. Yetenek** | `Q` | `RSHIFT` / `Numpad1` |
| **2. Yetenek** | `E` | `P` / `Numpad2` |
| **Oyunu Durdurma** | `ESC` | `ESC` |

---

## 🛠️ Kullanılan Teknolojiler

- **HTML5 Canvas 2D Engine**: Özel fizik, ivmelenme ve vektörel çarpışma hesaplamaları.
- **Vanilla JavaScript (ES6+)**: Nesne yönelimli oyun sınıfları ve durum yöneticisi.
- **Web Audio API**: Harici dosyaya ihtiyaç duymayan dinamik ses efekt sentezleyici.
- **Vanilla CSS3**: Modern dark mode UI ve responsive modal katmanları.

---

## 🚀 Oyunu Çalıştırma

Proje klasöründe terminal açarak şu komutlardan birini çalıştırabilirsiniz:

```bash
npx serve -p 8080
```
veya
```bash
python -m http.server 8080
```

Veya [index.html](file:///C:/Users/Musti/.gemini/antigravity/scratch/air-hockey-game/index.html) dosyasına çift tıklayarak tarayıcınızda doğrudan çalıştırabilirsiniz.
