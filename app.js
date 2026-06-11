const API_URL = "https://script.google.com/macros/s/AKfycby58k-_g4GNZZmwRbsFiktc4YUTFlx9qHt8lx1YA7UP8CjEoeqMXkHvZiOwx-5dx_n6rg/exec";

async function searchMember(){
  const citizenId = document.getElementById("citizenId").value.trim().replace(/\D/g,"");
  const result = document.getElementById("result");

  if(citizenId.length !== 13){
    result.innerHTML = `<div class="error">กรุณากรอกเลขบัตรประชาชน 13 หลัก</div>`;
    return;
  }

  result.innerHTML = `<div class="loading">กำลังค้นหาข้อมูล...</div>`;

  try{
    const res = await fetch(`${API_URL}?action=searchMember&citizen_id=${encodeURIComponent(citizenId)}`);
    const data = await res.json();

    if(!data.success){
      result.innerHTML = `<div class="error">${data.message}</div>`;
      return;
    }

    const paymentsHtml = data.payments.map((p) => `
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
            <strong>${data.member.fullname || "-"}</strong>
          </div>

          <div>
            <span>เลขบัตรประชาชน</span>
            <strong>${formatCitizenId(data.member.citizen_id)}</strong>
          </div>

          <div>
            <span>เบอร์โทรศัพท์</span>
            <strong>${maskPhone(data.member.phone)}</strong>
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
            <strong>${data.payments.length}</strong> รายการ
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

  }catch(error){
    result.innerHTML = `<div class="error">เกิดข้อผิดพลาดในการเชื่อมต่อ</div>`;
  }
}

function money(value){
  const num = Number(value || 0);
  return num.toLocaleString("th-TH");
}

function formatCitizenId(id){
  const x = String(id || "").replace(/\D/g,"");
  if(x.length !== 13) return x || "-";
  return `${x[0]}-${x.slice(1,5)}-${x.slice(5,10)}-${x.slice(10,12)}-${x[12]}`;
}

function maskPhone(phone){
  const x = String(phone || "").replace(/\D/g,"");
  if(x.length < 4) return "-";
  return `${x.slice(0,2)}x-xxx-${x.slice(-4)}`;
}

function formatDate(value){
  if(!value) return "-";

  const text = String(value);

  if(text.includes("T")){
    const d = new Date(text);
    return d.toLocaleDateString("th-TH", {
      day:"2-digit",
      month:"2-digit",
      year:"numeric"
    });
  }

  return text;
}

function formatTime(value){
  if(!value) return "-";

  const text = String(value);

  if(text.includes("T")){
    const d = new Date(text);
    return d.toLocaleTimeString("th-TH", {
      hour:"2-digit",
      minute:"2-digit"
    });
  }

  return text;
}
