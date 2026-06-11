const API_URL = "https://script.google.com/macros/s/AKfycbwUOkimec_D0XROnvf8zPmZ2acJsDh0ChOpklL9Fmm5JS9PrdGcIYRz3xrgVhDEnLOwEA/exec";

async function searchMember() {
  const input = document.getElementById("citizenId");
  const result = document.getElementById("result");

  const citizenId = input.value.trim().replace(/\D/g, "");

  if (citizenId.length !== 13) {
    result.innerHTML = `<div class="error">กรุณากรอกเลขบัตรประชาชน 13 หลัก</div>`;
    return;
  }

  result.innerHTML = `<div class="loading">กำลังค้นหาข้อมูล...</div>`;

  try {
    const url = `${API_URL}?action=searchMember&citizen_id=${encodeURIComponent(citizenId)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.success) {
      result.innerHTML = `<div class="error">${data.message || "ไม่พบข้อมูลสมาชิก"}</div>`;
      return;
    }

    const payments = Array.isArray(data.payments) ? data.payments : [];

    const firstPaymentDate = payments.length
      ? formatDate(payments[0].pay_date)
      : "-";

    const lastPaymentDate = payments.length
      ? formatDate(payments[payments.length - 1].pay_date)
      : "-";

    const paymentsHtml = payments.map((p) => `
      <div class="payment-card">

        <div>
          <div class="payment-date">${formatDate(p.pay_date)}</div>
          <div class="payment-time">เวลา ${formatTime(p.pay_time)} น.</div>
        </div>

        <div class="payment-main">
          <span>ยอดลงทุน</span>
          <strong>${money(p.investment)} บาท</strong>
        </div>

        <div class="payment-detail">
          <p>เลขอ้างอิง <b>${p.reference || "-"}</b></p>
          <p>ค่าเดินทาง <b>${money(p.travel_fee)} บาท</b></p>
          <p>เงินด่วน <b>${money(p.urgent_money)} บาท</b></p>
          <p>เงินหลัก <b>${money(p.principal_money)} บาท</b></p>
          <p>หมายเหตุ <b>${p.note || "-"}</b></p>
        </div>

      </div>
    `).join("");

    result.innerHTML = `
      <section class="found-box">
        <div class="found-icon">✓</div>
        <div>
          <h2>พบข้อมูลสมาชิก</h2>
          <p>ข้อมูลสำหรับตรวจสอบรายการลงทุนของท่าน</p>
        </div>
      </section>

      <section class="member-card">
        <h3>ข้อมูลสมาชิก</h3>

        <div class="member-grid">
          <div>
            <span>ชื่อ-นามสกุล</span>
            <strong>${data.member?.fullname || "-"}</strong>
          </div>

          <div>
            <span>เลขบัตรประชาชน</span>
            <strong>${formatCitizenId(data.member?.citizen_id)}</strong>
          </div>

          <div>
            <span>เบอร์โทรศัพท์</span>
            <strong>${maskPhone(data.member?.phone)}</strong>
          </div>
        </div>
      </section>

      <section class="summary-grid">
        <div class="summary-card green">
          <div class="icon">💰</div>
          <div>
            <span>ยอดลงทุนสะสมทั้งหมด</span>
            <strong>${money(data.totalInvestment)}</strong> บาท
          </div>
        </div>

        <div class="summary-card blue">
          <div class="icon">📄</div>
          <div>
            <span>จำนวนรายการลงทุน</span>
            <strong>${payments.length}</strong> รายการ
          </div>
        </div>

        <div class="summary-card blue">
          <div class="icon">📅</div>
          <div>
            <span>วันลงทุนครั้งแรก</span>
            <strong>${firstPaymentDate}</strong>
          </div>
        </div>

        <div class="summary-card green">
          <div class="icon">🕒</div>
          <div>
            <span>วันลงทุนล่าสุด</span>
            <strong>${lastPaymentDate}</strong>
          </div>
        </div>
      </section>

      <section class="history">
        <h3>ประวัติการลงทุน</h3>
        ${paymentsHtml || `<p>ยังไม่มีรายการลงทุน</p>`}
      </section>

      <section class="notice">
        หากข้อมูลไม่ถูกต้อง กรุณาติดต่อเจ้าหน้าที่เพื่อทำการตรวจสอบ
      </section>
    `;

  } catch (error) {
    result.innerHTML = `<div class="error">เกิดข้อผิดพลาดในการเชื่อมต่อ</div>`;
  }
}

function money(value) {
  const num = Number(value || 0);
  return num.toLocaleString("th-TH");
}

function formatCitizenId(id) {
  const x = String(id || "").replace(/\D/g, "");
  if (x.length !== 13) return x || "-";
  return `${x[0]}-${x.slice(1, 5)}-${x.slice(5, 10)}-${x.slice(10, 12)}-${x[12]}`;
}

function maskPhone(phone) {
  const x = String(phone || "").replace(/\D/g, "");
  if (x.length < 4) return "-";
  return `${x.slice(0, 2)}x-xxx-${x.slice(-4)}`;
}

function formatDate(value) {
  if (!value) return "-";

  const text = String(value).trim();

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text)) {
    return text;
  }

  if (text.includes("T")) {
    const d = new Date(text);
    if (isNaN(d)) return text;

    let day = String(d.getDate()).padStart(2, "0");
    let month = String(d.getMonth() + 1).padStart(2, "0");
    let year = d.getFullYear();

    if (year > 2600) {
      year = year - 543;
    }

    if (year < 2400) {
      year = year + 543;
    }

    return `${day}/${month}/${year}`;
  }

  return text;
}

function formatTime(value) {
  if (!value) return "-";

  const text = String(value).trim();

  if (/^\d{1,2}:\d{2}$/.test(text)) {
    return text;
  }

  if (text.includes("T")) {
    const d = new Date(text);
    if (isNaN(d)) return text;

    return d.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  }

  return text;
}
