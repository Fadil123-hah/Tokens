const express = require('express');
const app = express();
app.use(express.json());

// Memori sementara buat status bayar
let paidNominals = {}; 
let dbRRN = [];

// =======================================================
// JALUR 1: POST CALLBACK DARI SMP PAYMENT
// =======================================================
app.post('/api/callbackqris/:kataRahasia', (req, res) => {
    try {
        const kataRahasiaInput = req.params.kataRahasia;
        const data = req.body;

        // 1. Jika key tidak valid (Response 401)
        if (kataRahasiaInput !== "ambatukamahahaolerrrjsuf") {
            return res.status(401).send("401 Unauthorized");
        }

        // Kalau payload kosong/tidak valid
        if (!data || Object.keys(data).length === 0) {
            return res.status(400).send("Bad Request: Payload kosong");
        }

        // 2. Jika username tidak valid (Response 4015200)
        if (data.us_username !== "dilzxxyz") {
            return res.json({ responseCode: "4015200", responseMessage: "Username invalid" });
        }

        // 3. Jika RRN sudah pernah diterima (Response 2005201)
        if (data.rrn && dbRRN.includes(data.rrn)) {
            return res.json({ responseCode: "2005201", responseMessage: "RRN already processed" });
        }

        // 4. Ambil nominal dari amount.value
        const nominalMasuk = data.amount && data.amount.value ? parseFloat(data.amount.value) : 0;
        
        // Simpan ke database Vercel
        paidNominals[nominalMasuk] = true;
        if (data.rrn) dbRRN.push(data.rrn);

        console.log(`[+] TEMBAKAN SUKSES! Saldo masuk: Rp ${nominalMasuk}`);

        // 5. Response Sukses (Response 2005200) - 100% sesuai teks dokumentasi
        return res.json({ 
            responseCode: "2005200", 
            responseMessage: "Request has been processed successfully" 
        });

    } catch (error) {
        console.error("Crash di Webhook:", error);
        return res.status(500).send("Internal Server Error");
    }
});

// =======================================================
// JALUR 2: GET CEK STATUS DARI BOT LU
// =======================================================
app.get('/api/cekstatus/:nominal', (req, res) => {
    try {
        const nominal = parseFloat(req.params.nominal);
        
        if (paidNominals[nominal]) {
            delete paidNominals[nominal]; // Langsung hapus biar transaksi berikutnya gak error
            return res.json({ status: "LUNAS" });
        } else {
            return res.json({ status: "PENDING" });
        }
    } catch (error) {
        return res.json({ status: "PENDING" });
    }
});

// Wajib ekspor module untuk Vercel
module.exports = app;
