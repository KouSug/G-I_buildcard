/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const https = require('https');

const BASE_URL = 'https://gitlab.com/Dimbreath/AnimeGameData/-/raw/master';
const OUTPUT_DIR = path.join(__dirname, '../src/data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'gameData.json');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const fetchJson = (url) => {
    return new Promise((resolve, reject) => {
        console.log(`Fetching ${url}...`);
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Failed to fetch ${url}: ${res.statusCode}`));
                return;
            }
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Failed to parse JSON from ${url}: ${e.message}`));
                }
            });
        }).on('error', reject);
    });
};

const main = async () => {
    try {
        const gameData = {
            characters: {},
            weapons: {},
            artifacts: {},
            artifactSets: {}
        };

        // 1. Fetch TextMap (Needed for everything)
        const textMap = await fetchJson(`${BASE_URL}/TextMap/TextMapJP.json`);
        console.log("TextMap fetched.");

        // 2. Fetch and Process Characters
        const avatarConfig = await fetchJson(`${BASE_URL}/ExcelBinOutput/AvatarExcelConfigData.json`);
        const skillDepotConfig = await fetchJson(`${BASE_URL}/ExcelBinOutput/AvatarSkillDepotExcelConfigData.json`);
        const skillConfig = await fetchJson(`${BASE_URL}/ExcelBinOutput/AvatarSkillExcelConfigData.json`);
        const talentConfig = await fetchJson(`${BASE_URL}/ExcelBinOutput/AvatarTalentExcelConfigData.json`);
        const enkaCharacters = await fetchJson('https://raw.githubusercontent.com/EnkaNetwork/API-docs/master/store/characters.json');

        // Create Maps
        const skillMap = {};
        const skillProudMap = {};
        skillConfig.forEach(skill => {
            skillMap[skill.id] = skill.skillIcon;
            skillProudMap[skill.id] = skill.proudSkillGroupId;
        });

        const talentMap = {};
        talentConfig.forEach(talent => {
            talentMap[talent.talentId] = talent.icon;
        });

        const skillDepotMap = {};
        skillDepotConfig.forEach(depot => {
            skillDepotMap[depot.id] = depot;
        });

        avatarConfig.forEach(avatar => {
            const id = avatar.id;
            const nameHash = avatar.nameTextMapHash;
            const name = textMap[nameHash];
            const iconName = avatar.iconName;
            const sideIconName = avatar.sideIconName;
            const skillDepotId = avatar.skillDepotId;

            if (name && (String(id).startsWith('1000') || String(id).startsWith('1100'))) {
                const depot = skillDepotMap[skillDepotId];
                const skills = {};
                const constellations = [];

                if (depot) {
                    if (depot.skills && depot.skills.length > 0) {
                        skills.normal = {
                            id: depot.skills[0],
                            icon: skillMap[depot.skills[0]],
                            proudSkillGroupId: skillProudMap[depot.skills[0]]
                        };
                    }
                    if (depot.skills && depot.skills.length > 1) {
                        skills.skill = {
                            id: depot.skills[1],
                            icon: skillMap[depot.skills[1]],
                            proudSkillGroupId: skillProudMap[depot.skills[1]]
                        };
                    }
                    if (depot.energySkill) {
                        skills.burst = {
                            id: depot.energySkill,
                            icon: skillMap[depot.energySkill],
                            proudSkillGroupId: skillProudMap[depot.energySkill]
                        };
                    }
                    if (depot.talents) {
                        depot.talents.forEach(tId => {
                            if (tId > 0) {
                                constellations.push(talentMap[tId]);
                            }
                        });
                    }
                }

                let element = 'anemo';
                const enkaChar = enkaCharacters[id];
                if (enkaChar && enkaChar.Element) {
                    switch (enkaChar.Element) {
                        case 'Fire': element = 'pyro'; break;
                        case 'Water': element = 'hydro'; break;
                        case 'Wind': element = 'anemo'; break;
                        case 'Electric': element = 'electro'; break;
                        case 'Grass': element = 'dendro'; break;
                        case 'Ice': element = 'cryo'; break;
                        case 'Rock': element = 'geo'; break;
                    }
                }

                gameData.characters[id] = {
                    name: name,
                    icon: iconName,
                    sideIcon: sideIconName,
                    skills: skills,
                    constellations: constellations,
                    element: element
                };
            }
        });
        console.log("Characters processed.");

        // 3. Fetch and Process Weapons
        const weaponConfig = await fetchJson(`${BASE_URL}/ExcelBinOutput/WeaponExcelConfigData.json`);
        weaponConfig.forEach(weapon => {
            const id = weapon.id;
            const nameHash = weapon.nameTextMapHash;
            const name = textMap[nameHash];
            const icon = weapon.icon;

            if (name) {
                gameData.weapons[id] = {
                    name: name,
                    icon: icon
                };
            }
        });
        console.log("Weapons processed.");

        // 4. Fetch and Process Artifacts
        const reliquaryConfig = await fetchJson(`${BASE_URL}/ExcelBinOutput/ReliquaryExcelConfigData.json`);
        reliquaryConfig.forEach(artifact => {
            const id = artifact.id;
            const nameHash = artifact.nameTextMapHash;
            const name = textMap[nameHash];
            const icon = artifact.icon;
            const setId = artifact.setId;

            if (name) {
                gameData.artifacts[id] = {
                    name: name,
                    icon: icon,
                    setId: setId
                };
            }
        });
        console.log("Artifacts processed.");

        // 5. Fetch and Process Artifact Sets
        const reliquarySetConfig = await fetchJson(`${BASE_URL}/ExcelBinOutput/ReliquarySetExcelConfigData.json`);
        const equipAffixConfig = await fetchJson(`${BASE_URL}/ExcelBinOutput/EquipAffixExcelConfigData.json`);

        const equipAffixMap = {};
        equipAffixConfig.forEach(affix => {
            equipAffixMap[affix.id] = affix;
        });

        reliquarySetConfig.forEach(set => {
            const setId = set.setId;
            if (!setId) return;

            let affixId = set.equipAffixId;
            if (affixId) {
                const affix = equipAffixMap[affixId];
                if (affix && affix.nameTextMapHash) {
                    const name = textMap[affix.nameTextMapHash];
                    if (name) {
                        gameData.artifactSets[setId] = name;
                    }
                }
            }
        });
        console.log("Artifact Sets processed.");

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(gameData, null, 2));
        console.log(`Game data saved to ${OUTPUT_FILE}`);

    } catch (error) {
        console.error('Error fetching data:', error);
    }
};

main();
