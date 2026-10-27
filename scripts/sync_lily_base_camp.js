#!/usr/bin/env node
/**
 * Lily Phase Base Camp Sync & Apply Tool
 * Translates verified engineering & e-commerce research into Notion Base Camp.
 */

const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env');
const token = fs.readFileSync(envPath, 'utf8').match(/NOTION_TOKEN=\s*([^\r\n]+)/)[1].trim();

const HEADERS = {
  'Authorization': `Bearer ${token}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json'
};

async function patchBlock(id, type, richTextArray) {
  const res = await fetch(`https://api.notion.com/v1/blocks/${id}`, {
    method: 'PATCH',
    headers: HEADERS,
    body: JSON.stringify({
      [type]: {
        rich_text: richTextArray
      }
    })
  });
  if (!res.ok) {
    console.error(`[ERR] Failed to patch block ${id}:`, await res.text());
  } else {
    console.log(`[OK] Patched block ${id} (${type})`);
  }
}

async function updatePricingTable() {
  const tableId = '4fbc62a1-51c3-4672-8eb5-f3d45bd3d8f4';
  const res = await fetch(`https://api.notion.com/v1/blocks/${tableId}/children`, { headers: HEADERS });
  const data = await res.json();
  const rows = data.results || [];

  const verifiedPricing = [
    { input: 'Product cost', val: '85.00 EGP', status: 'Verified', note: 'Artiflora assembly factory cost' },
    { input: 'Packaging cost', val: '10.00 EGP', status: 'Verified', note: 'Nile Factory single box + bubbles' },
    { input: 'Amazon referral fee', val: '33.67 EGP (13%)', status: 'Verified', note: 'Amazon Egypt Home category commission' },
    { input: 'Shipping cost', val: '6.02 EGP / pc', status: 'Verified', note: 'FBA Inbound ATS (114.40 EGP / 19 pcs)' },
    { input: 'Advertising cost allowance', val: '25.00 EGP', status: 'Estimated', note: 'PPC launch campaign target (TACOS ~10%)' },
    { input: 'Tax on platform fees', val: '4.71 EGP', status: 'Verified', note: '14% VAT on Amazon referral commission' },
    { input: 'Return or damage allowance', val: '7.77 EGP', status: 'Estimated', note: '3% reserve allowance (shatterproof design)' },
    { input: 'Selling price test range', val: '259.00 EGP', status: 'Verified', note: 'Tested sweet spot (List Price: 320 EGP)' },
    { input: 'Expected net profit', val: '86.83 EGP (~33.5%)', status: 'Verified', note: 'Net profit per unit sold' }
  ];

  // rows[0] is table header
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const item = verifiedPricing[i - 1];
    if (!item) continue;

    const patchRes = await fetch(`https://api.notion.com/v1/blocks/${r.id}`, {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify({
        table_row: {
          cells: [
            [{ type: 'text', text: { content: item.input } }],
            [{ type: 'text', text: { content: item.val } }],
            [{ type: 'text', text: { content: item.status }, annotations: { bold: true, color: item.status === 'Verified' ? 'green' : 'blue' } }],
            [{ type: 'text', text: { content: item.note } }]
          ]
        }
      })
    });
    if (!patchRes.ok) console.error(`[ERR] Failed to update price row ${i}:`, await patchRes.text());
    else console.log(`[OK] Updated price table row ${i}: ${item.input}`);
  }
}

async function updateDecisionLogTable() {
  const tableId = 'bb935b12-f2a1-4c6b-9175-508a229f8310';
  const res = await fetch(`https://api.notion.com/v1/blocks/${tableId}/children`, { headers: HEADERS });
  const data = await res.json();
  const rows = data.results || [];

  const decisions = [
    {
      decision: 'Switch from Easy Ship to FBA Inbound',
      evidence: 'Easy Ship incurs 25 EGP deficit/order; FBA inbound costs 6.02 EGP/pc and unlocks Amazon Prime badge.',
      date: '23 Oct 2026',
      revisit: 'If FBA storage fees exceed unit delivery savings.'
    },
    {
      decision: 'Shatterproof Polymer Vase over Glass/Ceramic',
      evidence: '8-12% competitor return rate on Amazon Egypt is caused by broken ceramic/glass; shatterproof material eliminates transit damage.',
      date: '20 Oct 2026',
      revisit: 'If customer demand for pure ceramic strongly outweighs return rate.'
    },
    {
      decision: '19-Piece Inbound Pilot Batch',
      evidence: 'Shipment FBA15MRGNQSG (ATS Tracking AEG3238380616, pickup 3 Nov) tests warehouse check-in speed and barcode scanning before bulk capital commitment.',
      date: '23 Oct 2026',
      revisit: 'Upon 70% sell-through of initial 19 units.'
    }
  ];

  // Update existing row or append new rows
  for (let i = 0; i < decisions.length; i++) {
    const d = decisions[i];
    const cells = [
      [{ type: 'text', text: { content: d.decision }, annotations: { bold: true } }],
      [{ type: 'text', text: { content: d.evidence } }],
      [{ type: 'text', text: { content: d.date } }],
      [{ type: 'text', text: { content: d.revisit } }]
    ];

    if (i + 1 < rows.length) {
      // update row
      await fetch(`https://api.notion.com/v1/blocks/${rows[i + 1].id}`, {
        method: 'PATCH',
        headers: HEADERS,
        body: JSON.stringify({ table_row: { cells } })
      });
      console.log(`[OK] Updated decision row ${i + 1}`);
    } else {
      // append row
      await fetch(`https://api.notion.com/v1/blocks/${tableId}/children`, {
        method: 'PATCH',
        headers: HEADERS,
        body: JSON.stringify({
          children: [
            {
              object: 'block',
              type: 'table_row',
              table_row: { cells }
            }
          ]
        })
      });
      console.log(`[OK] Appended decision row ${i + 1}`);
    }
  }
}

async function updateRoadmap() {
  const dbId = 'cbfe97f6-add9-4a7d-b9ec-9d52067a284c';
  const qRes = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ page_size: 20 })
  });
  const data = await qRes.json();
  const rows = data.results || [];

  const statusMap = {
    'Validate Lily unit economics and test price': 'Done',
    'Write the Lily Phase product brief and positioning': 'Done',
    'Collect competitor listings and price bands': 'Done',
    'Define Lily variant, dimensions, materials, and target customer': 'Done',
    'Draft Amazon title, bullets, description, and keyword set': 'Done',
    'Prepare the small validation batch and launch checklist': 'In Progress'
  };

  for (const r of rows) {
    const titleProp = Object.values(r.properties).find(p => p.type === 'title');
    const title = titleProp?.title?.map(t => t.plain_text).join('') || '';
    if (statusMap[title]) {
      const newStatus = statusMap[title];
      await fetch(`https://api.notion.com/v1/pages/${r.id}`, {
        method: 'PATCH',
        headers: HEADERS,
        body: JSON.stringify({
          properties: {
            'Status': {
              status: { name: newStatus }
            }
          }
        })
      });
      console.log(`[OK] Roadmap "${title}" -> ${newStatus}`);
    }
  }
}

async function updateResearch() {
  const dbId = '3a6f3031-a07c-4427-8999-111fa94db8ab';
  const qRes = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify({ page_size: 20 })
  });
  const data = await qRes.json();
  const rows = data.results || [];

  const validateMap = {
    'Validate Amazon Egypt fee, shipping, tax, and return assumptions': 'Validated',
    'Define the Lily Phase product brief and differentiator': 'Validated',
    'Study competitor positioning for ready-made decor arrangements': 'Validated',
    'Collect customer language for the Lily Phase use case': 'Validated',
    'Confirm packaging and breakage risks before production': 'Validated'
  };

  for (const r of rows) {
    const titleProp = Object.values(r.properties).find(p => p.type === 'title');
    const title = titleProp?.title?.map(t => t.plain_text).join('') || '';
    if (validateMap[title]) {
      await fetch(`https://api.notion.com/v1/pages/${r.id}`, {
        method: 'PATCH',
        headers: HEADERS,
        body: JSON.stringify({
          properties: {
            'Status': {
              status: { name: 'Validated' }
            },
            'Confidence': {
              select: { name: 'High' }
            }
          }
        })
      });
      console.log(`[OK] Research "${title}" -> Validated (High)`);
    }
  }
}

async function updateProductBriefBullets() {
  console.log('\n--- Updating Product Identity & Specs ---');

  // Product Identity
  await patchBlock('564f6c76-e5cd-4708-9526-0dc0c1eb4f7e', 'bulleted_list_item', [
    { type: 'text', text: { content: 'Product promise: ' }, annotations: { bold: true } },
    { type: 'text', text: { content: 'Ready-to-display lifelike white silicone Lilium flowers in a shatterproof fluted vase with an electroplated gold ring.' } }
  ]);

  await patchBlock('e0b8aafe-47c5-482e-ab6c-d3ccbbfc33ea', 'bulleted_list_item', [
    { type: 'text', text: { content: 'Differentiator: ' }, annotations: { bold: true } },
    { type: 'text', text: { content: 'True Real-Touch silicone petals (not cheap fabric/plastic) + 100% shatterproof washable vase + complete pre-arranged set (eliminates broken glass returns).' } }
  ]);

  await patchBlock('e53796c2-cf21-46f3-a4ed-6ff13d768a3e', 'bulleted_list_item', [
    { type: 'text', text: { content: 'Target customer: ' }, annotations: { bold: true } },
    { type: 'text', text: { content: 'Modern office executives, home decor enthusiasts, coffee table decorators, and luxury housewarming gift shoppers.' } }
  ]);

  await patchBlock('3e5a78c9-922b-4210-901b-7dd420b5628f', 'bulleted_list_item', [
    { type: 'text', text: { content: 'Main use case: ' }, annotations: { bold: true } },
    { type: 'text', text: { content: 'Effortless year-round luxury accent for office desks, coffee tables, salon consoles, and floating shelves without watering or wilting.' } }
  ]);

  await patchBlock('48755413-76ed-49a5-8928-00d18bdb2585', 'bulleted_list_item', [
    { type: 'text', text: { content: 'Intended placement: ' }, annotations: { bold: true } },
    { type: 'text', text: { content: 'Office executive desks, living room coffee tables, entrance consoles, and dining room accents.' } }
  ]);

  await patchBlock('f77aa506-865d-4fce-a2a3-fc4f9eebf190', 'bulleted_list_item', [
    { type: 'text', text: { content: 'SKU or variant structure: ' }, annotations: { bold: true } },
    { type: 'text', text: { content: 'Parent SKU: FL-LILY-PARENT | 3 Variations: FL-LILY-BUBBLE-WHT (Bubble Pattern), FL-LILY-FLUTED-WHT (Origami Fluted), FL-LILY-DIAMOND-WHT (Diamond Pattern).' } }
  ]);

  // Approved Product Specification
  await patchBlock('d37de14a-9acc-43a4-8413-534e90a3916a', 'bulleted_list_item', [
    { type: 'text', text: { content: 'Arrangement dimensions: ' }, annotations: { bold: true } },
    { type: 'text', text: { content: 'Height: 30 cm | Width: 18 cm | Length: 18 cm (Compact desktop ratio).' } }
  ]);

  await patchBlock('76443ed4-1047-4207-aaba-8da4a2d61160', 'bulleted_list_item', [
    { type: 'text', text: { content: 'Packed dimensions: ' }, annotations: { bold: true } },
    { type: 'text', text: { content: 'Length: 34 cm | Width: 21 cm | Height: 12 cm (Certified Nile Factory Single Box).' } }
  ]);

  await patchBlock('efa41b50-3655-4886-afc4-a74ba2a83247', 'bulleted_list_item', [
    { type: 'text', text: { content: 'Product weight: ' }, annotations: { bold: true } },
    { type: 'text', text: { content: '280 g (Net product weight).' } }
  ]);

  await patchBlock('b5548429-67d2-4af7-83c1-7409c615aa53', 'bulleted_list_item', [
    { type: 'text', text: { content: 'Packed weight: ' }, annotations: { bold: true } },
    { type: 'text', text: { content: '450 g (Gross single unit weight with protective bubble wrap & box).' } }
  ]);

  await patchBlock('1781b607-0d5e-4c68-b9d5-531b8674333c', 'bulleted_list_item', [
    { type: 'text', text: { content: 'Materials: ' }, annotations: { bold: true } },
    { type: 'text', text: { content: 'High-grade real-touch silicone petals, reinforced polymer shatterproof container, metallic gold accent ring.' } }
  ]);

  await patchBlock('07e84f55-dcd2-4295-b3ed-ed56120d489c', 'bulleted_list_item', [
    { type: 'text', text: { content: 'Vase or container finish: ' }, annotations: { bold: true } },
    { type: 'text', text: { content: 'Matte ceramic-look polymer in Pearl White, adorned with an Electroplated Metallic Gold Ring.' } }
  ]);

  await patchBlock('2a279f9f-d752-4b25-8989-783a8fed86d1', 'bulleted_list_item', [
    { type: 'text', text: { content: 'Color name: ' }, annotations: { bold: true } },
    { type: 'text', text: { content: 'Pure Pearl White (Lilium) with Vivid Botanical Greenery & Gold Trim.' } }
  ]);

  await patchBlock('adc9d973-0676-429d-aea9-09b7663103cb', 'bulleted_list_item', [
    { type: 'text', text: { content: 'Care and handling notes: ' }, annotations: { bold: true } },
    { type: 'text', text: { content: '100% washable under lukewarm water, air dry in minutes, or wipe with a soft microfiber cloth.' } }
  ]);
}

async function run() {
  console.log('======================================================');
  console.log('   APPLYING WORKSPACE EVIDENCE TO NOTION BASE CAMP    ');
  console.log('======================================================\n');

  await updateProductBriefBullets();
  console.log('\n--- Updating Pricing Table ---');
  await updatePricingTable();
  console.log('\n--- Updating Decision Log Table ---');
  await updateDecisionLogTable();
  console.log('\n--- Updating Roadmap Tasks ---');
  await updateRoadmap();
  console.log('\n--- Updating Research Evidence ---');
  await updateResearch();

  console.log('\n======================================================');
  console.log('         BASE CAMP SYNCHRONIZATION COMPLETE           ');
  console.log('======================================================\n');
}

run().catch(err => {
  console.error('[FATAL]', err);
  process.exit(1);
});
