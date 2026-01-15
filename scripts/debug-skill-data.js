const https = require('https');

const BASE_URL = "https://gitlab.com/Dimbreath/AnimeGameData/-/raw/main";

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function checkData() {
    try {
        const skillConfig = await fetchJson(`${BASE_URL}/ExcelBinOutput/AvatarSkillExcelConfigData.json`);

        // Let's look at a few skills
        console.log("Sample Skill Config:", JSON.stringify(skillConfig.slice(0, 2), null, 2));

        // Check if there is a proudSkillGroupId
        const sample = skillConfig[0];
        if (sample.proudSkillGroupId) {
            console.log("Found proudSkillGroupId:", sample.proudSkillGroupId);
        } else {
            console.log("No proudSkillGroupId found in sample.");
        }

    } catch (e) {
        console.error(e);
    }
}

checkData();
