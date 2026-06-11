const API_URL = "https://script.google.com/macros/s/AKfycbwUOkimec_D0XROnvf8zPmZ2acJsDh0ChOpklL9Fmm5JS9PrdGcIYRz3xrgVhDEnLOwEA/exec";

const ADMIN_PASSWORD = "123456";

function adminLogin() {
  const password = document.getElementById("loginPassword").value.trim();
  const loginResult = document.getElementById("loginResult");

  if (password !== ADMIN_PASSWORD) {
    loginResult.innerHTML = `
      <div class="error">
        รหัสผ่านไม่ถูกต้อง
      </div>
    `;
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
  const isLogin = sessionStorage.getItem("admin_login");

  if (isLogin === "true") {
    showAdminPanel();
  }
};

function showAdminPanel() {
  document.getElementById("loginBox").classList.add("hidden");
  document.getElementById("adminBox").classList.remove("hidden");
  loadDashboard();
}

async function loadDashboard() {
  try {
    const res = await fetch(`${API_URL}?action=getDashboard`);
    const data = await res.json();

    if (!data.success) {
      console.log("Dashboard load failed");
      return;
    }

    document.getElementById("totalMembers").textContent =
      Number(data.totalMembers || 0).toLocaleString("th-TH");

    document.getElementById("totalInvestmentAll").textContent =
      Number(data.totalInvestment || 0).toLocaleString("th-TH");

    document.getElementById("totalPayments").textContent =
      Number(data.totalPayments || 0).toLocaleString("th-TH");

    document.getElementById("todayInvestment").textContent =
      Number(data.todayInvestment || 0).toLocaleString("th-TH");

  } catch (error) {
    console.log("Dashboard error:", error);
  }
}

async function addPayment() {
  const adminResult = document.getElementById("adminResult");

  const payload = {
    action: "addPayment",
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

  if (payload.citizen_id.length !== 13) {
    adminResult.innerHTML = `<div class="error">กรุณากรอกเลขบัตรประชาชน 13 หลัก</div>`;
    return;
  }

  if (!payload.fullname) {
    adminResult.innerHTML = `<div class="error">กรุณากรอกชื่อ-นามสกุล</div>`;
    return;
  }

  if (!payload.phone) {
    adminResult.innerHTML = `<div class="error">กรุณากรอกเบอร์โทรศัพท์</div>`;
    return;
  }

  if (!payload.pay_date) {
    adminResult.innerHTML = `<div class="error">กรุณากรอกวันที่จ่ายเงิน</div>`;
    return;
  }

  if (!payload.pay_time) {
    adminResult.innerHTML = `<div class="error">กรุณากรอกเวลา</div>`;
    return;
  }

  if (!payload.investment || Number(payload.investment) <= 0) {
    adminResult.innerHTML = `<div class="error">กรุณากรอกยอดลงทุนให้ถูกต้อง</div>`;
    return;
  }

  adminResult.innerHTML = `
    <div class="loading">
      กำลังบันทึกข้อมูล...
    </div>
  `;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!data.success) {
      adminResult.innerHTML = `
        <div class="error">
          ${data.message || "บันทึกไม่สำเร็จ"}
        </div>
      `;
      return;
    }

    adminResult.innerHTML = `
      <div class="loading">
        ✅ บันทึกข้อมูลเรียบร้อยแล้ว
      </div>
    `;

    clearForm();
    loadDashboard();

  } catch (error) {
    adminResult.innerHTML = `
      <div class="error">
        เกิดข้อผิดพลาดในการเชื่อมต่อ
      </div>
    `;
  }
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
