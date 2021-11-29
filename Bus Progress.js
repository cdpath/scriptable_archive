// Just a rip-off of `Time Progress.js`
// All credit goes to https://github.com/Juniorchen2012/scriptable/blob/master/progress.js

const width=125
const h=5
const w = new ListWidget()
w.backgroundColor=new Color("#222222")

// 
// CONFIGURATION (modify to fit your need)
// 
const CITY_ID = "014"                          // 城市编号
const CITY = "0755"                            // 城市区号
const LINE = "03690"                           // 线路编号
const STOP_IDX = 13                            // 候车站是第几站
const DIRECTION = args.widgetParameter || "1"  // 车的方向
const DIRECTION_FOR_HUMAN = (DIRECTION == "0") ? "回家" : "上班"  // 自行调整
const LINE_ID = [CITY, LINE, DIRECTION].join('-')
const LIMIT = 60 * 10                          // 只考虑十分钟内会来的车
const BUS_COUNT = 3                            // 最多展示几班车


const res = await get_bus_info(LINE_ID, STOP_IDX)
if (res.jsonr.status == "00") {
  const businfo = res.jsonr.data;
  const lineTerminal = businfo.line.endSn      // 此方向的终点站（太长了，就没有用）
  const lineName = businfo.line.name
  putText(`${lineName} (${DIRECTION_FOR_HUMAN})`, 20)

  const buses = businfo.buses.filter(filter_passed_buses).reverse().slice(0, BUS_COUNT)
  if (buses.length == 0) {
    putText('末班已过', 10)
  }
  buses.forEach(bus => processBus(bus))
}

Script.setWidget(w)
Script.complete()
w.presentMedium()


// 
//  GUI components
// 
function putText(titleText, fontSize) {
  const titlew = w.addText(titleText)
  titlew.textColor = new Color("#e587ce")
  titlew.font = Font.boldSystemFont(fontSize)
  w.addSpacer(6)
}


function processBus(bus) {
  const licence = bus.licence
  const secondsToWait = bus.travels[0].travelTime
  const timeToWaitForHuman = fmt_seconds(bus.travels[0].travelTime)
  getwidget(LIMIT, LIMIT - secondsToWait, `${licence} (${timeToWaitForHuman})`)
}


function getwidget(total, haveGone, str) {
  const titlew = w.addText(str)
  titlew.textColor = new Color("#e587ce")
  titlew.font = Font.boldSystemFont(10)
  w.addSpacer(6)
  const imgw = w.addImage(creatProgress(total,haveGone))
  imgw.imageSize=new Size(width, h)
  w.addSpacer(6)
}


function creatProgress(total,havegone){
  const context =new DrawContext()
  context.size=new Size(width, h)
  context.opaque=false
  context.respectScreenScale=true
  context.setFillColor(new Color("#48484b"))
  const path = new Path()
  path.addRoundedRect(new Rect(0, 0, width, h), 3, 2)
  context.addPath(path)
  context.fillPath()
  context.setFillColor(new Color("#ffd60a"))
  const path1 = new Path()
  path1.addRoundedRect(new Rect(0, 0, width*havegone/total, h), 3, 2)
  context.addPath(path1)
  context.fillPath()
  return context.getImage()
}


// 
// BUS COMPONENT
// 
async function get_bus_info(line_id, stop_idx) {
  const url = `https://web.chelaile.net.cn/api/bus/line!busesDetail.action?s=h5&wxs=wx_app&sign=1&h5RealData=1&v=3.9.73&src=weixinapp_cx&ctm_mp=mp_wx&cityId=${CITY_ID}&lineId=${line_id}&targetOrder=${stop_idx}&cshow=busDetail`
  let req = new Request(url)
  req.method = "get"
  req.headers = {
      "Host": "web.chelaile.net.cn",
      "Content-Type": "text",
      "Connection": "keep-alive",
      "Accept": "*/*",
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 11_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E217 MicroMessenger/6.8.0(0x16080000) NetType/WIFI Language/en Branch/Br_trunk MiniProgramEnv/Mac",
      "Referer": "https://servicewechat.com/wx71d589ea01ce3321/530/page-frame.html",
      "Accept-Language": "en-us",
      "Accept-Encoding": "gzip, deflate, br",
  }
  let res = await req.loadString()
  res = res.slice(6, -6)
  return JSON.parse(res)
}


function filter_passed_buses(obj) {
  return obj.distanceToWaitStn > 0
}

function fmt_seconds(seconds) {
  return new Date(seconds * 1000).toISOString().substr(14, 5)
}
