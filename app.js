// ========== 共通UI ==========
const $ = (s) => document.querySelector(s);
const toast = $("#toast");
function showToast(msg="保存しました。"){ toast.textContent=msg; toast.classList.add("show"); setTimeout(()=>toast.classList.remove("show"),1600); }

// ========== 患者IDの管理 ==========
const LS_KEY = "gp_patient_id";
const pidView = $("#pidView");
const idbar = $("#idbar");
const idInput = $("#idInput");
const idSaveBtn = $("#idSaveBtn");
const idHelp = $("#idHelp");

function setPidDisplay(pid){
  if(pid){
    pidView.textContent = pid;
    pidView.style.background="rgba(22,163,74,.15)";
    pidView.style.borderColor="rgba(22,163,74,.35)";
    idbar.style.display="none";
  }else{
    pidView.textContent="（未設定）";
    pidView.style.background="rgba(245,158,11,.15)";
    pidView.style.borderColor="rgba(245,158,11,.35)";
    idbar.style.display="block";
  }
}
function savePid(pid){ if(!pid) return; localStorage.setItem(LS_KEY,pid); setPidDisplay(pid); showToast("患者IDを保存しました（端末内）"); }
function loadPid(){
  const qs = new URLSearchParams(location.search);
  const fromUrl = qs.get("id");
  if(fromUrl && /^[A-Za-z0-9_-]+$/.test(fromUrl)){ savePid(fromUrl); return fromUrl; }
  const saved = localStorage.getItem(LS_KEY) || "";
  setPidDisplay(saved);
  return saved;
}
let currentPid = loadPid();

idSaveBtn?.addEventListener("click",()=>{
  const v=(idInput?.value||"").trim();
  if(!v){ showToast("IDを入力してください"); return; }
  savePid(v); currentPid=v;
});
idHelp?.addEventListener("click",()=>{ alert("【IDのセット方法】\n1) 院で渡されたQRを読み取って開く\n2) 上部バーで「保存」を1回\n3) 以後はホームのアイコンから自動復元"); });

// ========== Supabase Client ==========
function getSb(){
  const h = document.documentElement || document.body.parentElement || document.head;
  const url = (h.dataset && h.dataset.projectUrl) || "";
  const key = (h.dataset && h.dataset.anonKey) || "";
  if(!url || !key) throw new Error("SupabaseのURL/Keyが未設定です（index.htmlのdata属性に設定）");
  // @supabase/supabase-js v2（CDN）
  return window.supabase.createClient(url, key);
}

// ========== 保存ロジック ==========
$("#saveBtn")?.addEventListener("click", async ()=>{
  const pid = localStorage.getItem(LS_KEY) || currentPid;
  const n24 = parseInt($("#nrs24").value || "", 10);
  const n48 = parseInt($("#nrs48").value || "", 10);
  const memo = $("#memo").value || "";

  if(!pid){ showToast("患者IDが未設定です"); setPidDisplay(""); return; }
  if(Number.isNaN(n24) || n24<0 || n24>10){ showToast("24hは0〜10で入力"); return; }
  if(Number.isNaN(n48) || n48<0 || n48>10){ showToast("48hは0〜10で入力"); return; }

  try{
    const sb = getSb();
    const { error } = await sb.from("patient_nrs").insert({
      patient_id: pid,
      nrs_24h: n24,
      nrs_48h: n48,
      memo
      // created_at はDBのdefault now()でOK
    });
    if(error) throw error;
    showToast("保存しました。ご協力ありがとうございます。");
    // 入力欄はそのままでもOK。クリアしたい場合は下3行を解除
    // $("#nrs24").value = ""; $("#nrs48").value = ""; $("#memo").value = "";
  }catch(e){
    console.error(e);
    showToast(`保存に失敗しました：${e.message||e}`);
  }
});

// ========== PWA: Service Worker ==========
if("serviceWorker" in navigator){
  navigator.serviceWorker.register("./sw.js").catch(()=>{});
}
