// -*- encoding: utf-8; -*-

'use strict';

const ejs = require('ejs');
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));
const config = JSON.parse(fs.readFileSync(argv.c || argv.config, 'utf8'));
const chinachu = new URL(config.chinachu || 'http://localhost:10772/api/');

const nodemailer = require('nodemailer');
const mail_template =
`<% for(let row of programs) { -%>
■<%= date_format(new Date(row.start)) %> [<%= row.channel.type %>] <%= row.channel.name %> <%= row.reserved ? "【予約済】" : "" %>
<%= row.fullTitle %>

<%= row.detail %>

<%=  new Array(76).fill('=').join('') %>
<% } %>
`;

const chinachu_api = require('./chinachu.js');
const api = new chinachu_api.ChinachuAPI(chinachu);

function bogus_wrap(text, columns) {
  let output = [];
  const is1Byte = (s, i) => s.codePointAt(i) < 0x80;
  const kinsoku = (s, i) => /[、。ーぁぃぅぇぉゃゅょゎっ「」｛｝『』【】]/.test(s.charAt(i));
  
  for(let line of text.split(/\r?\n/)) {
    let width = 0;
    let out_line = "";
    for(let col = 0; col < line.length; col++) {
      let width_incr = is1Byte(line, col) ? 1 : 2;
      
      if(width + width_incr > columns && !kinsoku(line, col)) {
        output.push(out_line);
        out_line = "";
        width = 0;
      }
      
      out_line += line[col];
      width += width_incr;
    }
    output.push(out_line);
  }
  return output.join("\n");
}

function loadConditions() {
  function quote(str){
    return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  };

  const text = fs.readFileSync('ignore_keywords.txt', 'utf8');
  const re = text.split(/\r?\n/).filter(i => i.trim().length > 0).map(i => quote(i)).join("|");
  return new RegExp(re);
}

const conditions = loadConditions();

async function filterPrograms() {
  try {
    const now = Date.now();
    const reserves = await api.getReserves();
    const resv_ids = reserves.map(i => i.id);
    const programs = (await api.getPrograms()).
            filter((i) => (i.start > now && i.category === 'anime' && i.flags.indexOf('新') > -1)).
            filter(i => !conditions.test(i.fullTitle)).
            sort((a, b) => a.start - b.start).
            map((i) => {
              i['reserved'] = resv_ids.indexOf(i.id) > -1;
              return i;
            });

    return programs;
  } catch (e) {
    throw e;
  }
}

async function send_mail(message, transport) {
  let transporter = nodemailer.createTransport(transport);

  let envelope = config.envelope;
  envelope.text = message

  return transporter.sendMail(envelope);
}


async function main() {
  const new_anime = await filterPrograms();

  if(new_anime.length == 0) return;

  const mail = ejs.render(mail_template, {
    programs: new_anime,
    date_format: (i) => `${i.getMonth() + 1}/${i.getDate()} ${i.getHours()}:${i.getMinutes()}`
  });

  const mail_to_send = bogus_wrap(mail, 76);
  let transport = config.transport;
  
  await send_mail(mail_to_send, transport); 
}

main();

