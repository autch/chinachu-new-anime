const express = require('express');
const app = express();
const nunjucks = require('nunjucks');
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));


const njk_env = nunjucks.configure('views', {
  autoescape: true,
  express: app
});
                  
njk_env.addFilter('date', (i) => {
  const dt = new Date(i * 1000);
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return `${dt.getMonth()+1}/${dt.getDate()} ${dow[dt.getDay()]} ${dt.getHours()}:${dt.getMinutes()}`
});

app.use(express.static('public'));

const chinachu = new URL(argv.c || argv.chinachu || 'http://localhost:10772/api/');

const chinachu_api = require('./chinachu.js');
const api = new chinachu_api.ChinachuAPI(chinachu);

function loadConditions() {
  function quote(str){
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  };

  const text = fs.readFileSync('ignore_keywords.txt', 'utf8');
  const re = text.split(/\r?\n/).filter(i => i.trim().length > 0).map(i => quote(i)).join("|");
  return new RegExp(re);
};

let conditions = loadConditions();

function determineClasses(row) {
  let classes = [];

  if(row.available) classes.push('a');
  if(row.filtered) classes.push('f');
  if(row.reserved) classes.push('r');
  classes.push(`prog-${row.channel.type}`);
  if(row.new) classes.push('n');
  if(row.last) classes.push('l');
  if(row.new || row.last) classes.push('nl');

  return classes.join(' ');
}

function determineCaptions(row) {
  let captions = [];

  if(row.filtered) captions.push({ "class": "glyphicon glyphicon-remove", caption: "無視" });
  if(row.reserved) captions.push({ "class": "glyphicon glyphicon-ok", caption: "予約済" });
  if(row.new) captions.push({ "class": "glyphicon glyphicon-step-backward", caption: "新番組" });
  if(row.last) captions.push({ "class": "glyphicon glyphicon-step-forward", caption: "最終回" });

  return captions;
}


app.get('/', async (req, res) => {

  let resv, prog;
  try {
    prog = await api.getPrograms();
    resv = await api.getReserves();
  }catch(e) {
    res.status(500).send(e);
    return;
  }

  const locals = {
    rows: [],
    baseuri: process.env.URI_ROOT || req.baseUrl,
    count: {
      all: 0,
      reserved: 0,
      filtered: 0,
      available: 0,
      new_or_last: 0,
      by_type: {
        BS: 0,
        CS: 0,
        GR: 0
      }
    }
  };

  const filtered = prog.filter(i => i.category === 'anime');  
  const mapped = filtered.map((el, i) => { return { index: i, value: el.start };});
  mapped.sort((a, b) => {
    return a.value - b.value;
  });
  const sorted = mapped.map(i => filtered[i.index]);

  for(let row of sorted) {
    row.reserved = !!resv.find(i => i.id === row.id);
    row.filtered = conditions.test(row.fullTitle);
    row.available = !row.reserved && !row.filtered; 
    row.matched = row.fullTitle.replace(conditions, m => `<span class=\"q\">${m}</span>`);
    row.new = /\[新\]/.test(row.fullTitle);
    row.last = /\[終\]/.test(row.fullTitle);
    row.start = Math.floor(row.start / 1000);
    row.end = Math.floor(row.end / 1000);
    row.detail = row.detail.replace(/\r?\n/g, "<br>\n");

    row.new_or_last = row.new || row.last;
    row.classes = determineClasses(row);
    row.captions = determineCaptions(row);

    locals.count.all++;
    if(row.reserved) locals.count.reserved++;
    if(row.filtered) locals.count.filtered++;
    if(row.available) locals.count.available++;
    if(row.new_or_last) locals.count.new_or_last++;

    switch(row.channel.type) {
      case 'BS': locals.count.by_type.BS++; break;
      case 'CS': locals.count.by_type.CS++; break;
      case 'GR': locals.count.by_type.GR++; break;
    }

    locals.rows.push(row);
  }

  res.render('chinachu.njk', locals);
});

app.listen(3000, () => {
  console.log('Listening on port 3000');
});
