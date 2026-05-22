const express = require('express');
const app = express();
app.use(express.json());

// Simpan data nominal yang udah bayar di memori
let paidNominals = {}; 
let dbRRN = [];

// =======================================================
// JALUR 1: DITEMBAK OLEH SMP PAYMENT (WEBHOOK)
// =======================================================
app.post('/api/callbackqris/:kataRahasia', (req, res) => {
    const kataRahasiaInput = req.params.kataRahasia;
    const data = req.body;

    // Cek Kata Rahasia & Username (GANTI PAKE PUNYA LU)
    if (kataRahasiaInput !== "ambatukamahahaolerrrjsuf") return res.status(401).send("401 Unauthorized");
    if (data.us_username !== "dilzxxyz") return res.json({ responseCode: "4015200", responseMessage: "Username invalid" });
    if (dbRRN.includes(data.rrn)) return res.json({ responseCode: "2005201", responseMessage: "RRN already processed" });

    // Ambil nominal yang ditransfer
    const nominalMasuk = data.amount ? parseFloat(data.amount.value) : 0;
    
    // TANDAI NOMINAL INI SEBAGAI "SUDAH LUNAS"
    paidNominals[nominalMasuk] = true;
    dbRRN.push(data.rrn);

    // Balas sukses ke SMP
    return res.json({ responseCode: "2005200", responseMessage: "Request has been processed" });
});

// =======================================================
// JALUR 2: BUAT DICEK SAMA BOT LU TIAP 10 DETIK
// =======================================================
app.get('/api/cekstatus/:nominal', (req, res) => {
    const nominal = parseFloat(req.params.nominal);
    
    if (paidNominals[nominal]) {
        // Kalau udah lunas, hapus datanya biar transaksi berikutnya pake nominal sama gak error
        delete paidNominals[nominal];
        return res.json({ status: "LUNAS" });
    } else {
        return res.json({ status: "PENDING" });
    }
});

module.exports = app; 
// (Kalo deploy di Vercel biasanya pake module.exports = app, bukan app.listen)
