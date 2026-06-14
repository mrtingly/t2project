const API_URL = "https://script.google.com/macros/s/AKfycbwUOkimec_D0XROnvf8zPmZ2acJsDh0ChOpklL9Fmm5JS9PrdGcIYRz3xrgVhDEnLOwEA/exec";

let latestMemberData = null;

async function searchMember() {
  const citizenIdInput = document.getElementById("citizenId");
  const result = document.getElementById("result");

  const citizenId = citizenIdInput.value.trim().replace(/\D/g, "");

  if (!citizenId) {
    latestMemberData = null;
    result.innerHTML = `<div class="error">กรุณากรอกเลขบัตรประชาชน</div>`;
    return;
  }

  if (citizenId.length !== 13) {
    latestMemberData = null;
    result.innerHTML = `<div class="error">กรุณากรอกเลขบัตรประชาชนให้ครบ 13 หลัก</div>`;
    return;
  }

  result.innerHTML = `<div class="loading">กำลังตรวจสอบข้อมูล...</div>`;

  try {
    const res = await fetch(`${API_URL}?action=searchMember&citizen_id=${citizenId}`);
    const data = await res.json();

    if (!data.success) {
      latestMemberData = null;
      result.innerHTML = `<div class="error">${data.message || "ไม่พบข้อมูลสมาชิก"}</div>`;
      return;
    }

    latestMemberData = data;

    const payments = Array.isArray(data.payments) ? data.payments : [];
    const sortedPayments = [...payments].reverse();

    const totalInvestment = Number(data.totalInvestment || 0);
    const firstPayment = payments.length ? payments[0] : null;
    const lastPayment = payments.length ? payments[payments.length - 1] : null;

    result.innerHTML = `
      <div class="found-box">
        <div class="found-icon">✓</div>
        <div>
          <h2>พบข้อมูลสมาชิก</h2>
          <p>ข้อมูลสำหรับตรวจสอบรายการลงทุนของท่าน</p>
        </div>
      </div>

      ${renderMemberCard(data.member)}

      <div class="summary-grid">

        <div class="summary-card green">
          <div class="icon">💰</div>
          <div>
            <span>ยอดลงทุนสะสมทั้งหมด</span>
            <strong>${money(totalInvestment)}</strong> บาท
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
          <div class="icon">🗓️</div>
          <div>
            <span>วันลงทุนครั้งแรก</span>
            <strong>${firstPayment ? formatDate(firstPayment.pay_date) : "-"}</strong>
          </div>
        </div>

        <div class="summary-card green">
          <div class="icon">🕘</div>
          <div>
            <span>วันลงทุนล่าสุด</span>
            <strong>${lastPayment ? formatDate(lastPayment.pay_date) : "-"}</strong>
          </div>
        </div>

      </div>

      <div class="action-bar">
        <button class="print-btn" type="button" onclick="printMember()">
          🖨️ พิมพ์ข้อมูล
        </button>

        <button class="pdf-btn" type="button" onclick="downloadPDF()">
          📄 ดาวน์โหลด PDF
        </button>
      </div>

      <section class="history">
        <h3>ประวัติการลงทุน</h3>
        ${renderPayments(sortedPayments, payments.length)}
      </section>

      <div class="notice">
        หากข้อมูลไม่ถูกต้อง กรุณาติดต่อเจ้าหน้าที่เพื่อทำการตรวจสอบ
      </div>
    `;

  } catch (error) {
    console.error(error);
    latestMemberData = null;
    result.innerHTML = `<div class="error">เกิดข้อผิดพลาดในการเชื่อมต่อระบบ</div>`;
  }
}

function renderMemberCard(member) {
  return `
    <section class="member-card member-roll-card">

      <div class="member-roll-head" onclick="toggleMemberSummary()">
        <div class="member-roll-left">
          <div class="member-roll-icon">👤</div>
          <div>
            <h3>ข้อมูลสรุปสมาชิก</h3>
            <p>กดเพื่อดูข้อมูลส่วนตัว บัญชีธนาคาร และที่อยู่</p>
          </div>
        </div>

        <div id="memberSummaryArrow" class="member-roll-arrow">⌄</div>
      </div>

      <div id="memberSummaryDetail" class="member-roll-detail hidden">
        <div class="member-info-grid">

          <div class="member-info-item">
            <span>ชื่อ-นามสกุล</span>
            <strong>${safe(member.fullname)}</strong>
          </div>

          <div class="member-info-item">
            <span>เลขบัตรประชาชน</span>
            <strong>${formatCitizenId(member.citizen_id)}</strong>
          </div>

          <div class="member-info-item">
            <span>เบอร์โทรศัพท์</span>
            <strong>${formatPhone(member.phone)}</strong>
          </div>

          <div class="member-info-item">
            <span>ธนาคาร</span>
            <strong>${safe(member.bank_name)}</strong>
          </div>

          <div class="member-info-item">
            <span>สาขา</span>
            <strong>${safe(member.bank_branch)}</strong>
          </div>

          <div class="member-info-item">
            <span>เลขที่บัญชี</span>
            <strong>${safe(member.bank_account)}</strong>
          </div>

          <div class="member-info-item full">
            <span>ที่อยู่</span>
            <strong>${safe(member.address)}</strong>
          </div>

          <div class="member-info-item">
            <span>รหัสไปรษณีย์</span>
            <strong>${safe(member.zipcode)}</strong>
          </div>

        </div>
      </div>
    </section>
  `;
}

function renderPayments(sortedPayments, totalCount) {
  if (!sortedPayments.length) {
    return `<div class="notice">ยังไม่มีรายการลงทุน</div>`;
  }

  return sortedPayments.map((p, index) => {
    const itemNumber = totalCount - index;

    return `
      <div class="payment-card roll-card">

        <div class="roll-head" onclick="togglePayment(${index})">

          <div class="payment-order">รายการที่ ${itemNumber}</div>

          <div>
            <div class="payment-date">${formatDate(p.pay_date)}</div>
            <div class="payment-time">เวลา ${formatTime(p.pay_time)} น.</div>
          </div>

          <div class="payment-main">
            <span>ยอดลงทุน</span>
            <strong>${money(p.investment)} บาท</strong>
          </div>

          <div class="roll-arrow" id="arrow-${index}">⌄</div>
        </div>

        <div class="roll-detail hidden" id="payment-detail-${index}">
          <p>เลขอ้างอิง <b>${safe(p.reference)}</b></p>
          <p>ค่าเดินทาง <b>${money(p.travel_fee)} บาท</b></p>
          <p>เงินด่วน <b>${money(p.urgent_money)} บาท</b></p>
          <p>เงินหลัก <b>${money(p.principal_money)} บาท</b></p>
          <p>หมายเหตุ <b>${safe(p.note)}</b></p>
        </div>

      </div>
    `;
  }).join("");
}

function toggleMemberSummary() {
  const detail = document.getElementById("memberSummaryDetail");
  const arrow = document.getElementById("memberSummaryArrow");

  if (!detail || !arrow) return;

  detail.classList.toggle("hidden");
  arrow.textContent = detail.classList.contains("hidden") ? "⌄" : "⌃";
}

function togglePayment(index) {
  const detail = document.getElementById(`payment-detail-${index}`);
  const arrow = document.getElementById(`arrow-${index}`);

  if (!detail || !arrow) return;

  detail.classList.toggle("hidden");
  arrow.textContent = detail.classList.contains("hidden") ? "⌄" : "⌃";
}

function printMember() {
  window.print();
}

function downloadPDF() {
  if (typeof html2pdf === "undefined") {
    alert("ระบบ PDF ยังไม่พร้อม กรุณารีเฟรชหน้าเว็บ");
    return;
  }

  if (!latestMemberData || !latestMemberData.success) {
    alert("กรุณาค้นหาข้อมูลสมาชิกก่อนดาวน์โหลด PDF");
    return;
  }

  const data = latestMemberData;
  const payments = Array.isArray(data.payments) ? data.payments : [];
  const sortedPayments = [...payments].reverse();

  const report = document.createElement("div");
  report.className = "pdf-report";
  report.innerHTML = buildPdfReport(data, payments, sortedPayments);

  const holder = document.createElement("div");
  holder.style.position = "fixed";
  holder.style.left = "0";
  holder.style.top = "0";
  holder.style.width = "820px";
  holder.style.background = "#ffffff";
  holder.style.zIndex = "999999";
  holder.style.opacity = "0";
  holder.style.pointerEvents = "none";

  holder.appendChild(report);
  document.body.appendChild(holder);

  const opt = {
    margin: [0.25, 0.25, 0.25, 0.25],
    filename: `T2-${data.member.citizen_id || "member"}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      scrollY: 0
    },
    jsPDF: {
      unit: "in",
      format: "a4",
      orientation: "portrait"
    },
    pagebreak: {
      mode: ["css", "legacy"],
      avoid: [".pdf-header", ".pdf-section", ".pdf-summary-box"]
    }
  };

  html2pdf()
    .set(opt)
    .from(report)
    .save()
    .then(() => {
      document.body.removeChild(holder);
    })
    .catch((error) => {
      console.error(error);
      document.body.removeChild(holder);
      alert("ไม่สามารถดาวน์โหลด PDF ได้ กรุณาลองใหม่อีกครั้ง");
    });
}

function buildPdfReport(data, payments, sortedPayments) {
  return `
    <div class="pdf-header">
      <h1>รายงานข้อมูลสมาชิก T2</h1>
      <p>Member Investment Statement</p>
    </div>

    <div class="pdf-section">
      <h2>ข้อมูลสมาชิก</h2>

      <div class="pdf-grid">
        <p><b>ชื่อ-นามสกุล</b><br>${safe(data.member.fullname)}</p>
        <p><b>เลขบัตรประชาชน</b><br>${formatCitizenId(data.member.citizen_id)}</p>
        <p><b>เบอร์โทรศัพท์</b><br>${formatPhone(data.member.phone)}</p>
        <p><b>ธนาคาร</b><br>${safe(data.member.bank_name)}</p>
        <p><b>สาขา</b><br>${safe(data.member.bank_branch)}</p>
        <p><b>เลขที่บัญชี</b><br>${safe(data.member.bank_account)}</p>
        <p class="full"><b>ที่อยู่</b><br>${safe(data.member.address)}</p>
        <p><b>รหัสไปรษณีย์</b><br>${safe(data.member.zipcode)}</p>
      </div>
    </div>

    <div class="pdf-section">
      <h2>สรุปยอดลงทุน</h2>

      <div class="pdf-summary">
        <div class="pdf-summary-box">
          <b>${money(data.totalInvestment)}</b>
          <span>บาท</span>
          <small>ยอดลงทุนสะสม</small>
        </div>

        <div class="pdf-summary-box">
          <b>${payments.length}</b>
          <span>รายการ</span>
          <small>จำนวนรายการลงทุน</small>
        </div>
      </div>
    </div>

    <div class="pdf-section">
      <h2>ประวัติการลงทุน</h2>

      <table class="pdf-table">
        <thead>
          <tr>
            <th>ลำดับ</th>
            <th>วันที่</th>
            <th>เวลา</th>
            <th>ยอดลงทุน</th>
            <th>อ้างอิง</th>
          </tr>
        </thead>
        <tbody>
          ${sortedPayments.map((p, index) => `
            <tr>
              <td>${payments.length - index}</td>
              <td>${safe(p.pay_date)}</td>
              <td>${safe(p.pay_time)}</td>
              <td>${money(p.investment)} บาท</td>
              <td>${safe(p.reference)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <div class="pdf-footer">
      เอกสารนี้ออกจากระบบตรวจสอบข้อมูลสมาชิก T2
    </div>
  `;
}

function safe(value) {
  return value === undefined || value === null || value === "" ? "-" : String(value);
}

function money(value) {
  return Number(value || 0).toLocaleString("th-TH");
}

function formatDate(value) {
  return value || "-";
}

function formatTime(value) {
  return value || "-";
}

function formatCitizenId(value) {
  const text = String(value || "").replace(/\D/g, "");

  if (text.length !== 13) {
    return value || "-";
  }

  return `${text[0]}-${text.slice(1, 5)}-${text.slice(5, 10)}-${text.slice(10, 12)}-${text.slice(12)}`;
}

function formatPhone(value) {
  const text = String(value || "").replace(/\D/g, "");

  if (text.length === 10) {
    return `${text.slice(0, 3)}-${text.slice(3, 6)}-${text.slice(6)}`;
  }

  if (text.length === 9) {
    return `${text.slice(0, 2)}-${text.slice(2, 5)}-${text.slice(5)}`;
  }

  return value || "-";
}
