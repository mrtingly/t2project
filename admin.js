const API_URL = "https://script.google.com/macros/s/AKfycby58k-_g4GNZZmwRbsFiktc4YUTFlx9qHt8lx1YA7UP8CjEoeqMXkHvZiOwx-5dx_n6rg/exec";

const ADMIN_PASSWORD = "123456";

function adminLogin() {

  const password = document.getElementById("loginPassword").value;
  const loginResult = document.getElementById("loginResult");

  if(password !== ADMIN_PASSWORD){

    loginResult.innerHTML = `
      <div class="error">
        รหัสผ่านไม่ถูกต้อง
      </div>
    `;

    return;
  }

  sessionStorage.setItem("admin_login","true");

  document.getElementById("loginBox").classList.add("hidden");
  document.getElementById("adminBox").classList.remove("hidden");
}

function adminLogout(){

  sessionStorage.removeItem("admin_login");

  location.reload();
}

window.onload = function(){

  const isLogin = sessionStorage.getItem("admin_login");

  if(isLogin === "true"){

    document.getElementById("loginBox").classList.add("hidden");
    document.getElementById("adminBox").classList.remove("hidden");
  }
};

async function addPayment() {

  const adminResult = document.getElementById("adminResult");

  const payload = {
    action: "addPayment",
    password: ADMIN_PASSWORD,
    citizen_id: document.getElementById("citizen_id").value.trim(),
    fullname: document.getElementById("fullname").value.trim(),
    phone: document.getElementById("phone").value.trim(),
    pay_date: document.getElementById("pay_date").value.trim(),
    pay_time: document.getElementById("pay_time").value.trim(),
    investment: document.getElementById("investment").value.trim(),
    reference: document.getElementById("reference").value.trim(),
    travel_fee: document.getElementById("travel_fee").value.trim() || 0,
    urgent_money: document.getElementById("urgent_money").value.trim() || 0,
    principal_money: document.getElementById("principal_money").value.trim() || 0,
    note: document.getElementById("note").value.trim()
  };

  adminResult.innerHTML = `
    <div class="loading">
      กำลังบันทึกข้อมูล...
    </div>
  `;

  try {

    const res = await fetch(API_URL,{
      method:"POST",
      body:JSON.stringify(payload)
    });

    const data = await res.json();

    if(!data.success){

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

  } catch(error){

    adminResult.innerHTML = `
      <div class="error">
        เกิดข้อผิดพลาดในการเชื่อมต่อ
      </div>
    `;
  }
}

function clearForm(){

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
