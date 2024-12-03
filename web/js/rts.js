const { ipcRenderer } = require("electron");

const rts_online = document.getElementById("rts_online");
const rts_stats = document.getElementById("rts_stats");
const rts_time = document.getElementById("rts_time");

ipcRenderer.on("DataRts", (event, ans) => {
  const data = ans.data;

  rts_online.textContent = Object.keys(data.station).length;
  rts_stats.textContent = !data ? "離線" : "上線";
  rts_stats.className = !data
    ? "info-box-body abnormal"
    : "info-box-body normal";

  rts_time.textContent = formatTime(data.time);
});

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}
