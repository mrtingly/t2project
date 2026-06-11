const API_URL = "https://script.google.com/macros/s/AKfycby58k-_g4GNZZmwRbsFiktc4YUTFlx9qHt8lx1YA7UP8CjEoeqMXkHvZiOwx-5dx_n6rg/exec";

async function searchMember(){
  const citizenId = document.getElementById("citizenId").value.trim();
  const result = document.getElementById("result");

  if(citizenId.length !== 13){
    result.innerHTML = `<div class="error">กรุณากรอกเลขบัตรประชาชน 13 หลัก</div>`;
    return;
  }

  result.innerHTML = `<p>กำลังค้นหาข้อมูล...</p>`;

  try{
    const res = await fetch(`${API_URL}?action=searchMember&citizen_id=${citizenId}`);
    const data = await res.json();

    if(!data.success){
      result.innerHTML = `<div class="error">${data.message}</div>`;
      return;
    }

    let paymentsHtml = "";

    data.payments.forEach((p, index) => {
      paymentsHtml += `
        <div class="item">
          <strong>รายการที่ ${index + 1}</strong><br>
          วันที่: ${p.pay_date || "-"} เวลา: ${p.pay_time || "-"}<br>
          ยอดลงทุน: ${Number(p.investment).toLocaleString()} บาท<br>
          เลขอ้างอิง: ${p.reference || "-"}<br>
          ค่าเดินทาง: ${p.travel_fee || "-"}<br>
          เงินด่วน: ${p.urgent_money || "-"}<br>
          เงินหลัก: ${p.principal_money || "-"}<br>
          หมายเหตุ: ${p.note || "-"}
        </div>
      `;
    });

    result.innerHTML = `
      <div class="card">
        <h2>${data.member.fullname}</h2>
        <p>เลขบัตรประชาชน: ${data.member.citizen_id}</p>
        <p>เบอร์โทรศัพท์: ${data.member.phone}</p>

        <hr>

        <p>ยอดลงทุนรวมทั้งหมด</p>
        <div class="total">${Number(data.totalInvestment).toLocaleString()} บาท</div>

        <h3>ประวัติการลงทุน</h3>
        ${paymentsHtml || "<p>ยังไม่มีรายการลงทุน</p>"}
      </div>
    `;

  }catch(error){
    result.innerHTML = `<div class="error">เกิดข้อผิดพลาดในการเชื่อมต่อ</div>`;
  }
}
