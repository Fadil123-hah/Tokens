const express = require('express');
const app = express();
app.use(express.json());

// Memori sementara buat status bayar pakai Order ID
let paidOrders = {}; 

// =======================================================
// JALUR 1: POST CALLBACK DARI PAKASIR
// =======================================================
app.post('/api/callbackqris/:kataRahasia', (req, res) => {
    try {
        const kataRahasiaInput = req.params.kataRahasia;
        const data = req.body;

        // 1. Keamanan Endpoint
        if (kataRahasiaInput !== "ambatukamahahaolerrrjsuf") {
            return res.status(401).send("401 Unauthorized");
        }

        // Kalau payload kosong
        if (!data || Object.keys(data).length === 0) {
            return res.status(400).send("Bad Request: Payload kosong");
        }

        // 2. Validasi Proyek Pakasir
        if (data.project !== "dilzxstrore") {
            return res.status(403).json({ message: "Project invalid" });
        }

        // 3. Validasi status pembayaran completed dari Pakasir
        if (data.status !== "completed") {
            return res.status(200).json({ message: "Status belum lunas, diabaikan" });
        }

        // 4. Ambil order_id dari payload Pakasir
        const orderIdMasuk = data.order_id;
        
        if (!orderIdMasuk) {
            return res.status(400).json({ message: "Order ID tidak ditemukan" });
        }

        // Simpan status LUNAS ke database Vercel berdasarkan Order ID
        paidOrders[orderIdMasuk] = true;

        console.log(`[+] TEMBAKAN SUKSES (PAKASIR)! Order ID: ${orderIdMasuk} LUNAS`);

        // 5. Response Sukses
        return res.status(200).json({ message: "Success" });

    } catch (error) {
        console.error("Crash di Webhook:", error);
        return res.status(500).send("Internal Server Error");
    }
});

// =======================================================
// JALUR 2: GET CEK STATUS DARI BOT LU (PAKAI ID)
// =======================================================
app.get('/api/cekstatus/:orderId', (req, res) => {
    try {
        const orderId = req.params.orderId;
        
        // Cek apakah orderId tersebut ada di dalam memory yang sudah lunas
        if (paidOrders[orderId]) {
            delete paidOrders[orderId]; // Hapus biar gak dobel proses
            return res.json({ status: "LUNAS" });
        } else {
            return res.json({ status: "PENDING" });
        }
    } catch (error) {
        return res.json({ status: "PENDING" });
    }
});

module.exports = app;
