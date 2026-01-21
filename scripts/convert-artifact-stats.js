const fs = require('fs');
const path = require('path');

const INPUT_DIR = path.join(__dirname, '../public/artifacts_Main_Stats');
const OUTPUT_FILE = path.join(__dirname, '../src/data/artifactMainStats.json');

// Map CSV filenames to internal keys or labels
// If the key works as the label directly, great.
// We'll normalize keys to matching the application's expected labels where possible.
const FILE_MAPPING = {
    'HP.csv': 'HP',
    'HP%.csv': 'HP%',
    'ダメージバフ.csv': 'Elemental_Dmg', // Special key for elemental damage
    '与える治療効果.csv': 'Healing_Bonus', // Or '与える治癒効果'
    '会心ダメージ.csv': '会心ダメージ',
    '会心率.csv': '会心率',
    '元素チャージ効率.csv': '元素チャージ効率',
    '元素熟知.csv': '元素熟知',
    '攻撃力%.csv': '攻撃力%',
    '攻撃力.csv': '攻撃力',
    '物理ダメージバフ.csv': '物理ダメージ', // Mapping '物理ダメージバフ' to '物理ダメージ'
    '防御力%.csv': '防御力%',
};

function parseCSVLine(line) {
    // Simple CSV parser handling quoted fields containing commas
    const result = [];
    let current = '';
    let inQuote = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

const main = () => {
    try {
        if (!fs.existsSync(INPUT_DIR)) {
            console.error(`Input directory not found: ${INPUT_DIR}`);
            process.exit(1);
        }

        const files = fs.readdirSync(INPUT_DIR).filter(file => file.endsWith('.csv'));
        const data = {};

        files.forEach(file => {
            const filePath = path.join(INPUT_DIR, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');

            // Skip header (Level 0-20)
            const rows = lines.slice(1);

            const fileKey = FILE_MAPPING[file] || file.replace('.csv', '');

            data[fileKey] = {};

            rows.forEach(row => {
                const cols = parseCSVLine(row);
                // First col is rarity (★1, ★2, etc.)
                const rarityStr = cols[0];
                const rarityMatch = rarityStr.match(/★(\d+)/);

                if (rarityMatch) {
                    const rarity = parseInt(rarityMatch[1], 10);
                    // Remaining cols are values for levels 0, 1, ... 20
                    // Filter out '--' or empty
                    const values = cols.slice(1).map(val => {
                        val = val.replace(/"/g, '').trim(); // Remove quotes
                        if (val === '--' || val === '') return null;
                        return val;
                    });

                    data[fileKey][rarity] = values;
                }
            });
        });

        // Add special handling: Link 'Healing_Bonus' to '与える治癒効果' (App uses '治癒', file uses '治療')
        if (data['Healing_Bonus']) {
            data['与える治癒効果'] = data['Healing_Bonus'];
            // Also support '与える治療効果' if that's what user types? 
            // But existing map says '与える治癒効果'
        }

        // Expanded mapping for elemental damage
        if (data['Elemental_Dmg']) {
            const elementalTypes = [
                '炎元素ダメージ', '水元素ダメージ', '風元素ダメージ',
                '雷元素ダメージ', '草元素ダメージ', '氷元素ダメージ', '岩元素ダメージ'
            ];
            elementalTypes.forEach(type => {
                data[type] = data['Elemental_Dmg'];
            });
        }

        // Ensure "物理ダメージバフ" from file is also accessible via "物理ダメージ" which is in statMap
        // (Handled by FILE_MAPPING)

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
        console.log(`Generated ${OUTPUT_FILE}`);

    } catch (err) {
        console.error("Error converting artifact stats:", err);
    }
};

main();
