/**
 * T2PROJECT V3 — one-time Admin test account provisioning.
 * Depends on the deployed pilot's t2rows_, t2add_, t2set_, t2hash_, t2audit_ helpers.
 * Run ONLY in an authorized Apps Script editor. Never expose through a web endpoint.
 * Do not commit a password; supply it only at execution time.
 * Remove from deployed project after provisioning.
 */
const T2_TEST_ADMINS = [
  ['R001','S001','อรวิภา','ชัยสงคราม'],
  ['R002','S002','มนัสนันท์','ภพกิตติสิริกุล'],
  ['R003','S003','เมทินี','สุมาลี'],
  ['R004','S004','พชรกฤต','โสมนัส'],
  ['R005','S005','รุ่งนภา','สุภาศรี'],
  ['R006','S006','รมิตา','มีคุณ'],
  ['R007','S007','สมาน','พันธ์เพ็ง'],
  ['R008','S008','กุลคณินท์','นุดศุภร']
];
function provisionTestAdmins_(temporaryPassword) {
  if (typeof temporaryPassword !== 'string' || temporaryPassword.length < 9)
    throw Error('Provide a temporary password to this function at runtime');
  const lock=LockService.getScriptLock();lock.waitLock(30000);
  try {
    const users=t2rows_('Users'),rooms=t2rows_('Rooms'),result=[];
    for (const [room,username] of T2_TEST_ADMINS) {
      if (!rooms.some(r=>r.room_id===room)) throw Error('Missing room '+room);
      const existing=users.find(u=>String(u.username).toUpperCase()===username);
      if (existing && (existing.role!=='ADMIN'||existing.room_id!==room))
        throw Error('Conflicting existing user '+username+'; no changes made');
    }
    for (const [room,username,first,last] of T2_TEST_ADMINS) {
      const existing=users.find(u=>String(u.username).toUpperCase()===username);
      let id=existing&&existing.user_id;
      if (!existing) {
        id=Utilities.getUuid();const salt=Utilities.getUuid();
        t2add_('Users',{user_id:id,role:'ADMIN',room_id:room,username:username.toLowerCase(),
          password_hash:t2hash_(temporaryPassword,salt),password_salt:salt,
          status:'ACTIVE',created_at:new Date(),session_version:1});
        t2audit_('SYSTEM','TEST_ADMIN_CREATED','User',id,{room,username,first,last});
        result.push(username+': created');
      } else result.push(username+': already exists; password unchanged');
      const row=rooms.find(r=>r.room_id===room);
      t2set_('Rooms',row.__row,{admin_user_id:id});
    }
    Logger.log(result.join('\n'));return result;
  } finally {lock.releaseLock()}
}
