const { ipcRenderer } = require("electron");
const echarts = require("../resource/js/echarts");
const region_v2 = require("../resource/region_v2.json");
const { showToast } = require('./toast');
const { formatTimeDifference } = require('./timeUtils');
const { MAX_DATA_POINTS, limitDataPoints } = require('./chartConfig');

const rts_online_low = document.getElementById("rts_online_low");
const rts_online_hight = document.getElementById("rts_online_hight");
const rts_off_low = document.getElementById("rts_off_low");
const rts_off_hight = document.getElementById("rts_off_hight");
const rts_off = document.getElementById("rts_off");
const rts_all = document.getElementById("rts_all");
const rts_online = document.getElementById("rts_online");
const rts_stats = document.getElementById("rts_stats");
const rts_time = document.getElementById("rts_time");
const local_time = document.getElementById("local_time");
const lag_time = document.getElementById("lag_time");
const rts_freeze_auto = document.getElementById("rts_freeze_auto");
const rts_freeze_list = document.getElementById("rts_freeze_list");
const rts_freeze = document.getElementById("rts_freeze");
const rts_alert = document.getElementById("rts_alert");

const core_eew_real_taipei = document.getElementById("core_eew_real_taipei");

const core_freeze_taipei_check = document.getElementById("core_freeze_taipei_check");

core_freeze_taipei_check.addEventListener("click", () => {
  const freezeList = document.getElementById('core_freeze_taipei');
  freezeList.classList.toggle('expanded');

  if (freezeList.classList.contains('expanded')) {
    freezeList.style.maxHeight = freezeList.scrollHeight + "px";
  } else {
    freezeList.style.maxHeight = "150px";
  }
});

const core_disconnect_taipei_check = document.getElementById("core_disconnect_taipei_check");

core_disconnect_taipei_check.addEventListener("click", () => {
  const disconnectList = document.getElementById('core_disconnect_taipei');
  disconnectList.classList.toggle('expanded');

  if (disconnectList.classList.contains('expanded')) {
    disconnectList.style.maxHeight = disconnectList.scrollHeight + "px";
  } else {
    disconnectList.style.maxHeight = "150px";
  }
});

const charts = [
	echarts.init(document.getElementById("wave-1"), null, { height: 100, width: 300, renderer: "svg" }),
	echarts.init(document.getElementById("wave-2"), null, { height: 100, width: 300, renderer: "svg" }),
  echarts.init(document.getElementById("wave-3"), null, { height: 100, width: 300, renderer: "svg" }),
  echarts.init(document.getElementById("wave-4"), null, { height: 100, width: 300, renderer: "svg" })
];
for (let i = 0, j = charts.length; i < j; i++) {
  charts[i].setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    xAxis: {
      type      : "time",
      splitLine : {
        show: false,
      },
      show: false,
    },
    yAxis: {
      type      : "value",
      animation : false,
      splitLine : {
        show: false,
      },
      axisLabel: {
        interval : 1,
        fontSize : 10,
      },
    },
    grid: {
      top    : 16,
      right  : 0,
      bottom : 0,
    }
  });
}
const chartdata = [
	[],
  [],
  [],
  []
];

const constant = {
  intensity_1 : new Audio("./audio/intensity-1.wav"),
  intensity_2 : new Audio("./audio/intensity-2.wav"),
  intensity_3 : new Audio("./audio/intensity-3.wav"),
  intensity_4 : new Audio("./audio/intensity-4.wav"),
  intensity_5 : new Audio("./audio/intensity-5.wav"),
  intensity_6 : new Audio("./audio/intensity-6.wav"),
  intensity_7 : new Audio("./audio/intensity-7.wav"),
  intensity_8 : new Audio("./audio/intensity-8.wav"),
  intensity_9 : new Audio("./audio/intensity-9.wav"),
};

let rts_time_num = 0;
let lag = 0;
let rts_off_time_num = 0;

let rts_off_low_num = 0;
let rts_off_hight_num = 0;
let rts_off_low_time = "";
let rts_off_hight_time = "";

let rts_online_low_num = 0;
let rts_online_hight_num = 0;
let rts_online_low_time = "";
let rts_online_hight_time = "";

let work_station = {};
let station_temp = {};
let off_station = {};
let freeze_station = {};

let play_mode_name = "HTTP";
let play_mode_num = 0;

ipcRenderer.on("play_mode", (event, ans) => {
  play_mode_num = ans;
  if (ans == 0) {
    play_mode_name = "HTTP";
  } else if (ans == 1) {
    play_mode_name = "websocket";
  } else if (ans == 2) {
    play_mode_name = "HTTP (重播)";
  }
});

ipcRenderer.on("DataRts", (event, ans) => {
  const data = ans.data;

  let trigger = 0;

  let rts_off_num = 0;
  let rts_all_num = 0;
  let rts_online_num = 0;
  let rts_freeze_num = 0;

  rts_all_num = Object.keys(work_station).length;

  if (rts_all_num != 0) {
    rts_all.textContent = rts_all_num;
    off_station = Object.assign({}, work_station);
    if (!data) return;
    if (!data.station) return;
    for (let i = 0, i_ks = Object.keys(data.station), j = i_ks.length; i < j; i++) {
      const online_station_id = i_ks[i];
      delete off_station[online_station_id];
      if (data.station[online_station_id].alert) {
        trigger++;
      }
    }
    const rts_alert_percentage = ((trigger / rts_all_num) * 100).toFixed(1);
    rts_alert.textContent = `${trigger} (${rts_alert_percentage}%)`;
  }

  rts_freeze_num = Object.keys(freeze_station).length;

  if (rts_freeze_num != 0) {
    const rts_freeze_percentage = ((rts_freeze_num / rts_all_num) * 100).toFixed(1);
    rts_freeze.textContent = `${rts_freeze_num} (${rts_freeze_percentage}%)`;
    for (let i = 0, i_ks = Object.keys(freeze_station), j = i_ks.length; i < j; i++) {
      const freeze_station_id = i_ks[i];
      delete off_station[freeze_station_id];
    }
  }

  const disconnectList = document.getElementById('core_disconnect_taipei');
  disconnectList.innerHTML = '';

  rts_off_num = Object.keys(off_station).length;

  if (rts_off_num != 0) {
    for (let i = 0, i_ks = Object.keys(off_station), j = i_ks.length; i < j; i++) {
      const off_station_id = i_ks[i];
      const station_new_id = off_station[off_station_id]?.id ?? off_station_id;
      const station_Loc = off_station[off_station_id]?.Loc ?? "未知";
      const station_text = `${station_new_id} ${station_Loc}`;

      const li = document.createElement('li');
      li.textContent = station_text;
      li.className = 'station-info';
      li.addEventListener("click", () => {
        navigator.clipboard.writeText(off_station_id).then(() => {
          // console.debug(station_text);
          // console.debug("複製成功");
          showToast(`${off_station_id} 複製成功`);
        });
      });
      disconnectList.appendChild(li);
    }
  }

  if (rts_off_low_num > 0) {
    if (rts_off_low_num > rts_off_num) {
      rts_off_low_num = rts_off_num;
      rts_off_low_time = formatTime(data.time);
    }
  } else {
    rts_off_low_num = rts_off_num;
    rts_off_low_time = formatTime(data.time);
  }

  if (rts_off_hight_num > 0) {
    if (rts_off_hight_num < rts_off_num) {
      rts_off_hight_num = rts_off_num;
      rts_off_hight_time = formatTime(data.time);
    }
  } else {
    rts_off_hight_num = rts_off_num;
    rts_off_hight_time = formatTime(data.time);
  }

  const rts_off_low_percentage = ((rts_off_low_num / rts_all_num) * 100).toFixed(1);
  rts_off_low.textContent = `${rts_off_low_num} (${rts_off_low_percentage}%) | ${rts_off_low_time}`;
  const rts_off_hight_percentage = ((rts_off_hight_num / rts_all_num) * 100).toFixed(1);
  rts_off_hight.textContent = `${rts_off_hight_num} (${rts_off_hight_percentage}%) | ${rts_off_hight_time}`;
  const rts_off_percentage = ((rts_off_num / rts_all_num) * 100).toFixed(1);
  rts_off.textContent = `${rts_off_num} (${rts_off_percentage}%)`;

  rts_online_num = Object.keys(data.station).length;

  if (rts_online_low_num > 0) {
    if (rts_online_low_num > rts_online_num) {
      rts_online_low_num = rts_online_num;
      rts_online_low_time = formatTime(data.time);
    }
  } else {
    rts_online_low_num = rts_online_num;
    rts_online_low_time = formatTime(data.time);
  }

  if (rts_online_hight_num > 0) {
    if (rts_online_hight_num < rts_online_num) {
      rts_online_hight_num = rts_online_num;
      rts_online_hight_time = formatTime(data.time);
    }
  } else {
    rts_online_hight_num = rts_online_num;
    rts_online_hight_time = formatTime(data.time);
  }

  chartdata[0].push({
    name  : Date.now(),
    value : [(play_mode_num == 2 ? Date.now() : data.time), rts_online_num],
  });

  chartdata[1].push({
    name  : Date.now(),
    value : [(play_mode_num == 2 ? Date.now() : data.time), rts_off_num],
  });

  chartdata[2].push({
    name  : Date.now(),
    value : [(play_mode_num == 2 ? Date.now() : data.time), rts_freeze_num],
  });

  chartdata[3].push({
    name  : Date.now(),
    value : [(play_mode_num == 2 ? Date.now() : data.time), trigger],
  });

  chartdata[0] = limitDataPoints(chartdata[0]);
  chartdata[1] = limitDataPoints(chartdata[1]);
  chartdata[2] = limitDataPoints(chartdata[2]);
  chartdata[3] = limitDataPoints(chartdata[3]);

  charts[0].setOption({
    animation : false,
    yAxis     : {
      max : (rts_online_hight_num + 30),
      min : (rts_online_low_num - 30),
    },
    series: [
      {
        name  : '上線測站數量',
        type  : "line",
        showSymbol : false,
        data  : chartdata[0],
        color : "rgb(85, 255, 0)",
      },
    ],
  });

  charts[1].setOption({
    animation : false,
    yAxis     : {
      max : (rts_off_hight_num + 30),
      min : (rts_off_low_num - 30),
    },
    series: [
      {
        name  : '斷線測站數量',
        type  : "line",
        showSymbol : false,
        data  : chartdata[1],
        color : "rgb(255, 0, 0)",
      },
    ],
  });

  charts[2].setOption({
    animation : false,
    yAxis     : {
      max : (rts_off_hight_num + 30),
      min : (rts_off_low_num - 30),
    },
    series: [
      {
        name  : '凍結測站數量',
        type  : "line",
        showSymbol : false,
        data  : chartdata[2],
        color : "rgb(255, 251, 0)",
      },
    ],
  });

  charts[3].setOption({
    animation : false,
    yAxis     : {
      max : (trigger + 30),
      min : (trigger - 30),
    },
    series: [
      {
        name  : '觸發測站數量',
        type  : "line",
        showSymbol : false,
        data  : chartdata[3],
        color : "rgb(0, 26, 255)",
      },
    ],
  });

  const rts_online_low_percentage = ((rts_online_low_num / rts_all_num) * 100).toFixed(1);
  rts_online_low.textContent = `${rts_online_low_num} (${rts_online_low_percentage}%) | ${rts_online_low_time}`;
  const rts_online_hight_percentage = ((rts_online_hight_num / rts_all_num) * 100).toFixed(1);
  rts_online_hight.textContent = `${rts_online_hight_num} (${rts_online_hight_percentage}%) | ${rts_online_hight_time}`;
  const rts_percentage = ((rts_online_num / rts_all_num) * 100).toFixed(1);
  rts_online.textContent = `${rts_online_num} (${rts_percentage}%)`;

  rts_time_num = data.time;
  rts_time.textContent = formatTime(rts_time_num);

  const keysAsNumbers = Object.values(data.box).map(Number);
  const maxKey = Math.max(...keysAsNumbers);
  if (maxKey != -Infinity) {
    core_eew_real_taipei.textContent = "";
    core_eew_real_taipei.className = `intensity-box intensity-${maxKey}`;
  } else {
    core_eew_real_taipei.className = "intensity-null";
    core_eew_real_taipei.textContent = "未觀測到任何震動";
  }
});

core_eew_real_taipei.textContent = "未觀測到任何震動";
const core_intensity_taipei = document.getElementById("core_intensity_taipei");
core_intensity_taipei.textContent = "目前沒有 震度速報 資訊";

let intensity = 0;

ipcRenderer.on("showIntensity", (event, ans) => {
  const data = ans.data;

  if (data.serial == 1) intensity = 0;

  if (intensity != data.max) {
    intensity = data.max;
    constant[`intensity_${data.max}`].play();
  }

  core_intensity_taipei.textContent = "";
  core_intensity_taipei.className = `intensity-box intensity-${data.max}`;

  setTimeout(() => {
    core_intensity_taipei.className = "intensity-null";
    core_intensity_taipei.textContent = "目前沒有 震度速報 資訊";
  }, 60000);
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

async function get_station_info() {
  const stationCache = localStorage.getItem('cache.station');
  station_temp = stationCache ? JSON.parse(stationCache) : {};
  const station_num = Object.keys(station_temp).length;

  if (station_num != 0) {
    const new_station = {};
    for (let k = 0, k_ks = Object.keys(station_temp), n = k_ks.length; k < n; k++) {
      const station_id = k_ks[k];
      const station_ = station_temp[station_id];

      //	if (!station_.work) continue;

      const station_net = station_.net === "MS-Net" ? "H" : "L";
      const work = station_.work;

      if (!work) {
        delete off_station[station_id];
        continue;
      }

      let id = "";
      let station_code = "000";
      let Loc = "";
      let area = "";
      let Lat = 0;
      let Long = 0;

      let latest = station_.info[0];

      if (station_.info.length > 1)
        for (let i = 1; i < station_.info.length; i++) {
          const currentTime = new Date(station_.info[i].time);
          const latestTime = new Date(latest.time);

          if (currentTime > latestTime)
            latest = station_.info[i];
        }

      for (let i = 0, ks = Object.keys(region_v2), j = ks.length; i < j; i++) {
        const reg_id = ks[i];
        const reg = region_v2[reg_id];

        for (let r = 0, r_ks = Object.keys(reg), l = r_ks.length; r < l; r++) {
          const ion_id = r_ks[r];
          const ion = reg[ion_id];

          if (ion.code === latest.code) {
            station_code = latest.code.toString();
            Loc = `${reg_id} ${ion_id}`;
            area = ion.area;
            Lat = latest.lat;
            Long = latest.lon;
          }
        }
      }

      id = `${station_net}-${station_code}-${station_id}`;

      if (station_code === "000") {
        Lat = latest.lat;
        Long = latest.lon;

        if (station_id === "13379360") {
          Loc = "重庆市 北碚区";
          area = "重庆市中部";
        } else if (station_id === "7735548") {
          Loc = "南楊州市 和道邑";
          area = "南楊州市中部";
        }
      }

      if (work) {
        new_station[station_id] = { id, Lat, Long, Loc, area, work };
      }
    }

    work_station = Object.assign({}, new_station);
    off_station = Object.assign({}, new_station);
  }
}

get_station_info();

setInterval(get_station_info, 600000);

setInterval(() => {
  local_time.textContent = formatTime(Date.now());
  lag = Date.now() - rts_time_num;
  if (lag > 6000 && play_mode_name != "HTTP (重播)") {
    if (rts_off_time_num == 0) {
      rts_stats.textContent = `離線 | (${play_mode_name})`;
      rts_stats.className = "info-box-body abnormal";
      rts_off_time_num = Date.now();
    } else {
      rts_stats.textContent = `離線 | (${play_mode_name}) ${formatTimeDifference(Date.now() - rts_off_time_num)}`;
      rts_stats.className = "info-box-body abnormal";
    }
  } else {
    rts_stats.textContent = `上線 | (${play_mode_name})`;
    rts_stats.className = "info-box-body normal";
    rts_off_time_num = 0;
  }
}, 500);

async function get_freeze_info() {
  const API = ['api-1.exptech.dev', 'api-2.exptech.dev']
  const url = API[Math.floor(Math.random() * API.length)];
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1500);
  await fetch(`https://${url}/api/v1/trem/freeze/list`, { signal: controller.signal, cache: "no-cache" })
  .then((ans) => {
    clearTimeout(timeoutId);
    if (!ans || !ans.ok) {
      return;
    }
    ans.json().then((ansjson) => {
      // console.log(ansjson);

      const freezeList = document.getElementById('core_freeze_taipei');
      freezeList.innerHTML = '';

      if (Object.keys(freeze_station).length != 0) freeze_station = {};

      const rts_freeze_auto_num = ansjson.auto.length;

      if (rts_freeze_auto_num != 0) {
        rts_freeze_auto.textContent = rts_freeze_auto_num;
        for (let i = 0, i_ks = ansjson.auto, j = i_ks.length; i < j; i++) {
          const auto_station_id = i_ks[i];
          freeze_station[auto_station_id] = work_station[auto_station_id];

          const station_new_id = work_station[auto_station_id]?.id ?? auto_station_id;
          const station_Loc = work_station[auto_station_id]?.Loc ?? "未知";
          const station_text = `${station_new_id} ${station_Loc} (自動)`;

          const li = document.createElement('li');
          li.textContent = station_text;
          li.className = 'station-info';
          li.addEventListener("click", () => {
            navigator.clipboard.writeText(auto_station_id).then(() => {
              // console.debug(station_text);
              // console.debug("複製成功");
              showToast(`${auto_station_id} 複製成功`);
            });
          });
          freezeList.appendChild(li);
        }
      }

      const rts_freeze_list_num = ansjson.list.length;

      if (rts_freeze_list_num != 0) {
        rts_freeze_list.textContent = rts_freeze_list_num;
        for (let i = 0, i_ks = ansjson.list, j = i_ks.length; i < j; i++) {
          const list_station_id = i_ks[i];
          freeze_station[list_station_id] = work_station[list_station_id];

          const station_new_id = work_station[list_station_id]?.id ?? list_station_id;
          const station_Loc = work_station[list_station_id]?.Loc ?? "未知";
          const station_text = `${station_new_id} ${station_Loc} (手動)`;

          const li = document.createElement('li');
          li.textContent = station_text;
          li.className = 'station-info';
          li.addEventListener("click", () => {
            navigator.clipboard.writeText(list_station_id).then(() => {
              // console.debug(station_text);
              // console.debug("複製成功");
              showToast(`${list_station_id} 複製成功`);
            });
          });
          freezeList.appendChild(li);
        }
      }
    });
  });
}

setInterval(() => {
  get_freeze_info();
  lag_time.textContent = `${formatTimeDifference(lag)} (${lag} ms)`;
}, 1000);