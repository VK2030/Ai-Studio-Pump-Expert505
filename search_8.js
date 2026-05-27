import fs from 'fs';
const data = JSON.parse(fs.readFileSync('api/_lib/questions.json', 'utf8'));
for (const key in data) {
  data[key].forEach(q => {
    let hasMatch = false;
    q.correct.forEach(idx => {
      let optionText = q.options[idx];
      if (optionText) {
        let text = optionText.toLowerCase();
        if (text.includes('8 ми') || text.includes('8 мм')) {
          hasMatch = true;
        }
      }
    });
    if (hasMatch) {
      console.log('-----');
      console.log('Q:', q.text);
      q.correct.forEach(idx => console.log('A:', q.options[idx]));
    }
  });
}
