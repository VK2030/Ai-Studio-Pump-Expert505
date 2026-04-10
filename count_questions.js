
const fs = require('fs');
const content = fs.readFileSync('api/_questions.ts', 'utf8');

const modules = [
  { id: 'esp-selection-startup', name: 'Подбор УЭЦН и ВНР' },
  { id: 'failure-investigation', name: 'Расследование отказов' },
  { id: 'operating-factors', name: 'Факторы эксплуатации' },
  { id: 'pbotos-general', name: 'ПБ, ОТ и ОС: Общие вопросы' },
  { id: 'pbotos-siz', name: 'ПБ, ОТ и ОС: СИЗ' },
  { id: 'pbotos-harmful', name: 'ПБ, ОТ и ОС: Вредные факторы' },
  { id: 'pbotos-firstaid', name: 'ПБ, ОТ и ОС: Первая помощь' }
];

const results = {};

modules.forEach(mod => {
  const regex = new RegExp(`'${mod.id}': \\[([\\s\\S]*?)\\]`, 'g');
  const match = regex.exec(content);
  if (match) {
    const block = match[1];
    const count = (block.match(/text:/g) || []).length;
    results[mod.name] = count;
  }
});

console.log(JSON.stringify(results, null, 2));
