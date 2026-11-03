// Run: npm test   — checks the multilingual command parser against expected results.
const assert = require('assert');
const C = require('../public/core.js');
const inv = C.seedInventory(), idx = C.buildIndex(inv);

const cases = [
  ['अभिजीत, 16 साल, Dolo 650 की 10 स्ट्रिप का बिल बनाओ', 'bill', 'Abhijeet', 16, [['dolo650', 10, 'pack']]],
  ['अभिजीत सोलह साल डोलो छह सौ पचास दस स्ट्रिप', 'bill', 'Abhijeet', 16, [['dolo650', 10, 'pack']]],
  ['डोलो 650 की दस पत्ती अभिजीत के लिए उम्र सोलह', 'bill', 'Abhijeet', 16, [['dolo650', 10, 'pack']]],
  ['Abhijeet 16 saal ke liye Pan 40 ki 2 strip aur Cetzine 1 strip', 'bill', 'Abhijeet', 16, [['pan40', 2, 'pack'], ['cetzine', 1, 'pack']]],
  ['पैन डी 2 स्ट्रिप और सेट्ज़ीन 5 गोली राहुल 30 साल', 'bill', 'Rahul', 30, [['pand', 2, 'pack'], ['cetzine', 5, 'unit']]],
  ['Bill 3 strips of Azithral 500 for Priya, 28 years', 'bill', 'Priya', 28, [['azithral500', 3, 'pack']]],
  ['give 2 bottles benadryl syrup and 1 tube volini to Meena 52 years', 'bill', 'Meena', 52, [['benadryl', 2, 'pack'], ['volini', 1, 'pack']]],
  ['सुनीता साठी 45 वर्षे, Telma 40 च्या 2 स्ट्रिप बिल करा', 'bill', 'Suneeta', 45, [['telma40', 2, 'pack']]],
  ['ರವಿ 32 ವರ್ಷ, Crocin 5 ಸ್ಟ್ರಿಪ್ ಬಿಲ್ ಮಾಡಿ', 'bill', 'Ravi', 32, [['crocin', 5, 'pack']]],
  ['ರವಿಗೆ ಡೋಲೋ 650 ಎರಡು ಸ್ಟ್ರಿಪ್ ಕೊಡಿ', 'bill', 'Ravi', null, [['dolo650', 2, 'pack']]],
  ['లక్ష్మి 60 సంవత్సరాలు, Glycomet 500 3 స్ట్రిప్స్ బిల్ చేయండి', 'bill', 'Lakshmi', 60, [['glycomet500', 3, 'pack']]],
  ['Rahul ko Combiflam do strip de do', 'bill', 'Rahul', null, [['combiflam', 2, 'pack']]],
  ['Dolo 650 स्टॉक में है क्या?', 'stock', '', null, [['dolo650']]],
  ['Augmentin 625 ka stock check karo', 'stock', '', null, [['augmentin625']]],
  ['Pan 40 ki 20 strip stock mein add karo', 'restock', '', null, [['pan40', 20, 'pack']]],
];

let pass = 0;
for (const [text, intent, name, age, items] of cases) {
  const r = C.parseCommand(text, inv, idx, {});
  try {
    assert.strictEqual(r.intent, intent, 'intent');
    assert.strictEqual(r.patient.name, name, 'name');
    assert.strictEqual(r.patient.age, age, 'age');
    assert.strictEqual(r.items.length, items.length, 'item count');
    items.forEach(([id, qty, unit], k) => {
      assert.strictEqual(r.items[k].id, id, 'medicine');
      if (qty !== undefined) assert.strictEqual(r.items[k].qty, qty, 'qty');
      if (unit !== undefined) assert.strictEqual(r.items[k].unit, unit, 'unit');
    });
    pass++; console.log('✓', text);
  } catch (e) {
    console.log('✗', text, '\n   ', e.message, '→ got', JSON.stringify({ intent: r.intent, patient: r.patient, items: r.items.map(i => [i.id, i.qty, i.unit]) }));
  }
}
for (const [t, want] of [['हाँ', 'confirm'], ['haudu', 'confirm'], ['avunu', 'confirm'], ['ho', 'confirm'], ['नहीं', 'cancel'], ['cancel', 'cancel']]) {
  const r = C.parseCommand(t, inv, idx, { pending: true });
  if (r.intent === want) { pass++; console.log('✓', t); } else console.log('✗', t, '→', r.intent);
}
const total = cases.length + 6;
console.log(`\n${pass}/${total} passed`);
process.exit(pass === total ? 0 : 1);
