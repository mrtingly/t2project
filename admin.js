const API_URL = "https://script.google.com/macros/s/AKfycby58k-_g4GNZZmwRbsFiktc4YUTFlx9qHt8lx1YA7UP8CjEoeqMXkHvZiOwx-5dx_n6rg/exec";

async function addPayment() {
  const adminResult = document.getElementById("adminResult");

  const payload = {
    action: "addPayment",
    password: document.getElementById("password").value.trim(),
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

  if (payload.password === "") {
    adminResult.innerHTML = `<div class="error">กรุณากรอกรหัสผ่านแอดมิน</div>`;
    return;
  }

  if (payload.citizen_id.length !== 13) {
    adminResult.innerHTML = `<div class="error">กรุณากรอกเลขบัตรประชาชน 13 หลัก</div>`;
    return;
  }

  if (payload.fullname === "") {
    adminResult.innerHTML = `<div class="error">กรุณากรอกชื่อ-นามสกุล</div>`;
    return;
  }

  if (payload.investment === "") {
    adminResult.innerHTML = `<div class="error">กรุณากรอกยอดลงทุน</div>`;
    return;
  }

  adminResult.innerHTML = `<div class="loading">กำลังบันทึกข้อมูล...</div>`;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!data.success) {
      adminResult.innerHTML = `<div class="error">${data.message || "บันทึกไม่สำเร็จ"}</div>`;
      return;
    }

    adminResult.innerHTML = `<div class="loading">✅ บันทึกข้อมูลเรียบร้อยแล้ว</div>`;

    clearForm();

  } catch (error) {
    adminResult.innerHTML = `<div class="error">เกิดข้อผิดพลาดในการเชื่อมต่อ</div>`;
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
