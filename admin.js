const API_URL = "https://script.google.com/macros/s/AKfycbwUOkimec_D0XROnvf8zPmZ2acJsDh0ChOpklL9Fmm5JS9PrdGcIYRz3xrgVhDEnLOwEA/exec";
const ADMIN_PASSWORD = "123456";

let editingRowNumber = null;
let editingPaymentId = null;

function adminLogin() {
  const password = document.getElementById("loginPassword").value.trim();

  if (password !== ADMIN_PASSWORD) {
    document.getElementById("loginResult").innerHTML = `<div class="error">รหัสผ่านไม่ถูกต้อง</div>`;
    return;
  }

  sessionStorage.setItem("admin_login", "true");
  showAdminPanel();
}

function adminLogout() {
  sessionStorage.removeItem("admin_login");
  location.reload();
}

window.onload = function () {
  if (sessionStorage.getItem("admin_login") === "true") {
    showAdminPanel();
  }
};

function showAdminPanel() {
  document.getElementById("loginBox").classList.add("hidden");
  document.getElementById("adminBox").classList.remove("hidden");
  loadDashboard();
}

async function loadDashboard() {
  const res = await fetch(`${API_URL}?action=getDashboard`);
  const data = await res.json();

  if (!data.success) return;

  document.getElementById("totalMembers").textContent = Number(data.totalMembers || 0).toLocaleString("th-TH");
  document.getElementById("totalInvestmentAll").textContent = Number(data.totalInvestment || 0).toLocaleString("th-TH");
  document.getElementById("totalPayments").textContent = Number(data.totalPayments || 0).toLocaleString("th-TH");
  document.getElementById("todayInvestment").textContent = Number(data.todayInvestment || 0).toLocaleString("th-TH");
}

async function findMemberForAdmin() {
  const citizenId = document.getElementById("citizen_id").value.trim().replace(/\D/g, "");
  const adminResult = document.getElementById("adminResult");

  if (citizenId.length !== 13) {
    adminResult.innerHTML = `<div class="error">กรุณากรอกเลขบัตรประชาชน 13 หลักก่อนค้นหา</div>`;
    return;
  }

  adminResult.innerHTML = `<div class="loading">กำลังค้นหาสมาชิก...</div>`;

  const res = await fetch(`${API_URL}?action=searchMember&citizen_id=${citizenId}`);
  const data = await res.json();

  if (!data.success) {
    adminResult.innerHTML = `<div class="error">ไม่พบสมาชิก สามารถกรอกชื่อและเบอร์เพื่อเพิ่มสมาชิกใหม่ได้</div>`;
    document.getElementById("memberHistory").innerHTML = "";
    return;
  }

  document.getElementById("fullname").value = data.member.fullname || "";
  document.getElementById("phone").value = data.member.phone || "";

  renderMemberHistory(data.payments || []);

  adminResult.innerHTML = `<div class="loading">✅ พบสมาชิกและประวัติรายการลงทุน</div>`;
}

function renderMemberHistory(payments) {
  const box = document.getElementById("memberHistory");

  if (!payments.length) {
    box.innerHTML = `<div class="notice">ยังไม่มีรายการลงทุน</div>`;
    return;
  }

  box.innerHTML = `
    <div class="history admin-history">
      <h3>ประวัติรายการลงทุน</h3>
      ${payments.map(p => `
        <div class="payment-card">
          <div>
            <div class="payment-date">${p.pay_date || "-"}</div>
            <div class="payment-time">เวลา ${p.pay_time || "-"} น.</div>
          </div>

          <div class="payment-main">
            <span>ยอดลงทุน</span>
            <strong>${Number(p.investment || 0).toLocaleString("th-TH")} บาท</strong>
          </div>

          <div class="payment-detail">
            <p>เลขอ้างอิง <b>${p.reference || "-"}</b></p>
            <p>ค่าเดินทาง <b>${p.travel_fee || 0}</b></p>
            <p>เงินด่วน <b>${p.urgent_money || 0}</b></p>
            <p>เงินหลัก <b>${p.principal_money || 0}</b></p>
            <p>หมายเหตุ <b>${p.note || "-"}</b></p>
          </div>

          <button class="small-btn" onclick='startEdit(${JSON.stringify(p)})'>แก้ไข</button>
        </div>
      `).join("")}
    </div>
  `;
}

function startEdit(p) {
  editingRowNumber = p.rowNumber;
  editingPaymentId = p.payment_id;

  document.getElementById("citizen_id").value = p.citizen_id || "";
  document.getElementById("pay_date").value = p.pay_date || "";
  document.getElementById("pay_time").value = p.pay_time || "";
  document.getElementById("investment").value = p.investment || "";
  document.getElementById("reference").value = p.reference || "";
  document.getElementById("travel_fee").value = p.travel_fee || "";
  document.getElementById("urgent_money").value = p.urgent_money || "";
  document.getElementById("principal_money").value = p.principal_money || "";
  document.getElementById("note").value = p.note || "";

  document.getElementById("updateBtn").classList.remove("hidden");
  document.getElementById("cancelEditBtn").classList.remove("hidden");

  document.getElementById("adminResult").innerHTML = `<div class="loading">กำลังแก้ไขรายการ ${p.payment_id}</div>`;
}

async function updatePayment() {
  if (!editingRowNumber) {
    document.getElementById("adminResult").innerHTML = `<div class="error">ยังไม่ได้เลือกรายการที่จะแก้ไข</div>`;
    return;
  }

  const payload = buildPayload("updatePayment");
  payload.rowNumber = editingRowNumber;
  payload.payment_id = editingPaymentId;

  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!data.success) {
    document.getElementById("adminResult").innerHTML = `<div class="error">${data.message}</div>`;
    return;
  }

  document.getElementById("adminResult").innerHTML = `<div class="loading">✅ แก้ไขข้อมูลเรียบร้อยแล้ว</div>`;

  const citizenId = document.getElementById("citizen_id").value;
  cancelEdit();
  await loadDashboard();
  await reloadMember(citizenId);
}

async function addPayment() {
  const payload = buildPayload("addPayment");

  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify(payload)
  });

  const data = await res.json();

  if (!data.success) {
    document.getElementById("adminResult").innerHTML = `<div class="error">${data.message}</div>`;
    return;
  }

  document.getElementById("adminResult").innerHTML = `<div class="loading">✅ บันทึกข้อมูลเรียบร้อยแล้ว</div>`;

  const citizenId = payload.citizen_id;
  clearForm();
  await loadDashboard();
  await reloadMember(citizenId);
}

function buildPayload(action) {
  return {
    action,
    password: ADMIN_PASSWORD,
    citizen_id: document.getElementById("citizen_id").value.trim().replace(/\D/g, ""),
    fullname: document.getElementById("fullname").value.trim(),
    phone: document.getElementById("phone").value.trim().replace(/\D/g, ""),
    pay_date: document.getElementById("pay_date").value.trim(),
    pay_time: document.getElementById("pay_time").value.trim(),
    investment: document.getElementById("investment").value.trim(),
    reference: document.getElementById("reference").value.trim(),
    travel_fee: document.getElementById("travel_fee").value.trim() || 0,
    urgent_money: document.getElementById("urgent_money").value.trim() || 0,
    principal_money: document.getElementById("principal_money").value.trim() || 0,
    note: document.getElementById("note").value.trim()
  };
}

async function reloadMember(citizenId) {
  if (!citizenId) return;

  const res = await fetch(`${API_URL}?action=searchMember&citizen_id=${citizenId}`);
  const data = await res.json();

  if (data.success) {
    renderMemberHistory(data.payments || []);
  }
}

function cancelEdit() {
  editingRowNumber = null;
  editingPaymentId = null;

  document.getElementById("updateBtn").classList.add("hidden");
  document.getElementById("cancelEditBtn").classList.add("hidden");
}

function clearForm() {
  document.getElementById("citizen_id").value = "";
  document.getElementById("fullname").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("pay_date").value = "";
  document.getElementById("pay_time").value = "";
  document.getElementById("investment").value = "";
  document.getElementById("reference").value = "";
  document.getElementById("travel_fee").value = "";
  document.getElementById("urgent_money").value = "";
  document.getElementById("principal_money").value = "";
  document.getElementById("note").value = "";
}
