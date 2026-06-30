// web-pwa/js/utils/validator.js
// Validasi input & token anti-manipulasi

export class Validator {
  constructor() {
    this.rules = {
      email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      phone: /^[0-9]{10,15}$/,
      nik: /^[0-9]{16}$/,
      price: /^[0-9]+(\.[0-9]{1,2})?$/,
      qty: /^[0-9]+$/,
      alphanumeric: /^[a-zA-Z0-9\s\-_]+$/,
      text: /^[\s\S]{1,1000}$/
    };
  }

  // 🔥 Validasi input berdasarkan tipe
  validate(input, type = 'text') {
    const rule = this.rules[type];
    if (!rule) return { valid: true, message: 'Tipe validasi tidak dikenal' };

    if (typeof input !== 'string') {
      return { valid: false, message: 'Input harus berupa teks' };
    }

    if (rule.test(input)) {
      return { valid: true, message: 'Valid' };
    } else {
      return { valid: false, message: `Format ${type} tidak valid` };
    }
  }

  // 📝 Validasi laporan warga
  validateReport(report) {
    const errors = [];

    // Cek ada text
    if (!report.text || report.text.trim().length < 3) {
      errors.push('Laporan harus minimal 3 karakter');
    }

    // Cek panjang maksimal
    if (report.text && report.text.length > 1000) {
      errors.push('Laporan maksimal 1000 karakter');
    }

    // Cek ada kata-kata terlarang (injection)
    const forbidden = ['<script', 'eval(', 'javascript:', 'onerror', 'onload'];
    for (const word of forbidden) {
      if (report.text && report.text.toLowerCase().includes(word)) {
        errors.push(`Laporan mengandung kata mencurigakan: ${word}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // 📦 Validasi transaksi
  validateTransaction(transaction) {
    const errors = [];

    // Cek ada items
    if (!transaction.items || transaction.items.length === 0) {
      errors.push('Transaksi harus memiliki minimal 1 item');
    }

    // Cek setiap item
    for (const item of transaction.items) {
      // Nama item
      if (!item.name || item.name.trim().length < 1) {
        errors.push('Nama item tidak boleh kosong');
      }
      // Harga
      if (!item.price || isNaN(item.price) || item.price <= 0) {
        errors.push(`Harga item "${item.name}" tidak valid`);
      }
      // Qty
      if (!item.qty || isNaN(item.qty) || item.qty <= 0) {
        errors.push(`Jumlah item "${item.name}" tidak valid`);
      }
    }

    // Cek total
    const calculatedTotal = transaction.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    if (Math.abs(calculatedTotal - transaction.total) > 0.01) {
      errors.push(`Total transaksi tidak sesuai (calculated: ${calculatedTotal}, actual: ${transaction.total})`);
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // 🔄 Validasi barter
  validateBarter(barter) {
    const errors = [];

    // Cek ada dari & ke
    if (!barter.from || !barter.to) {
      errors.push('Transaksi barter harus memiliki "dari" dan "ke"');
    }

    // Cek rasio
    if (!barter.ratio || isNaN(barter.ratio) || barter.ratio <= 0) {
      errors.push('Rasio barter tidak valid');
    }

    // Cek trust score
    if (barter.trustScore && (barter.trustScore < 0 || barter.trustScore > 100)) {
      errors.push('Trust Score harus 0-100');
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // 🎫 Validasi token Sembako
  validateToken(token) {
    const errors = [];

    // Cek format token (hash 64 karakter hex)
    if (!token || token.length !== 64) {
      errors.push('Token harus 64 karakter');
    }

    // Cek hanya hex
    if (token && !/^[0-9a-f]{64}$/i.test(token)) {
      errors.push('Token harus berupa hex');
    }

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // 📱 Validasi NIK KTP
  validateNIK(nik) {
    const result = this.validate(nik, 'nik');
    if (!result.valid) {
      return { valid: false, message: 'NIK harus 16 digit angka' };
    }

    // Cek digit pertama (provinsi)
    const provinsi = parseInt(nik.substring(0, 2));
    if (provinsi < 11 || provinsi > 99) {
      return { valid: false, message: 'Kode provinsi tidak valid' };
    }

    return { valid: true, message: 'NIK valid' };
  }

  // 💰 Validasi harga
  validatePrice(price) {
    const result = this.validate(String(price), 'price');
    if (!result.valid) {
      return { valid: false, message: 'Harga harus berupa angka' };
    }
    if (parseFloat(price) < 0) {
      return { valid: false, message: 'Harga tidak boleh negatif' };
    }
    if (parseFloat(price) > 1000000000) {
      return { valid: false, message: 'Harga terlalu besar' };
    }
    return { valid: true, message: 'Harga valid' };
  }

  // 🧹 Sanitasi input (bersihkan dari karakter berbahaya)
  sanitize(input) {
    if (typeof input !== 'string') return input;

    // Hapus tag HTML
    let sanitized = input.replace(/<[^>]*>/g, '');

    // Hapus karakter berbahaya
    sanitized = sanitized.replace(/['";()<>]/g, '');

    // Hapus spasi berlebih
    sanitized = sanitized.trim();

    return sanitized;
  }

  // 🛡️ Validasi lengkap untuk laporan warga (auto-sanitize + validate)
  validateAndSanitizeReport(report) {
    // Sanitasi dulu
    const sanitized = {
      ...report,
      text: this.sanitize(report.text)
    };

    // Validasi
    const validation = this.validateReport(sanitized);

    return {
      valid: validation.valid,
      errors: validation.errors,
      data: sanitized
    };
  }
}
