"use client";

import React, { useState } from "react";
import { BuildData, Character, Weapon, Stats, Artifact, EnkaNetworkResponse, AvatarInfo } from "@/types";
import gameDataRaw from "@/data/gameData.json";
import { statMap, formatStatValue } from "@/utils/mappings";

// Type assertion for gameData to avoid implicit any errors if strict mode is on
const gameData = gameDataRaw as unknown as {
    characters: { [key: string]: { name: string; icon: string; sideIcon: string; element?: string; constellations?: string[]; skills?: { [key: string]: { id: number; icon?: string; proudSkillGroupId?: number } } } };
    weapons: { [key: string]: { name: string; icon: string } };
    artifacts: { [key: string]: { name: string; icon: string; setId: number } };
    artifactSets: { [key: string]: string };
};

interface InputFormProps {
    data: BuildData;
    onChange: (data: BuildData) => void;
}

const Input = ({ label, value, onChange, type = "text", ...props }: { label: string, value: string | number, onChange: (v: string) => void, type?: string } & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'>) => (
    <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-400">{label}</label>
        <input
            {...props}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`bg-[#15151A] border border-[#3A3A45] rounded px-2 py-1 text-sm focus:border-[#D4AF37] outline-none transition-colors ${props.className || ''}`}
        />
    </div>
);

export const InputForm: React.FC<InputFormProps> = ({ data, onChange }) => {
    const [uid, setUid] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [enkaData, setEnkaData] = useState<EnkaNetworkResponse | null>(null);
    const [isComposing, setIsComposing] = useState(false);

    const fetchEnkaData = async () => {
        if (!uid) return;
        const cleanUid = uid.trim();
        if (!cleanUid) return;

        setLoading(true);
        setError(null);
        setEnkaData(null);

        try {
            console.log(`Fetching data for UID: ${cleanUid}`);
            const response = await fetch(`/api/enka/${cleanUid}`);

            if (!response.ok) {
                let errorMsg = `Error: ${response.status} ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    if (errorData.error) {
                        errorMsg = errorData.error;
                    }
                } catch (e) {
                    console.error("Could not parse error response JSON", e);
                }
                throw new Error(errorMsg);
            }

            const data: EnkaNetworkResponse = await response.json();
            console.log("Enka Data Fetched:", data);
            setEnkaData(data);

            // Automatically select the first character if available
            if (data.avatarInfoList && data.avatarInfoList.length > 0) {
                selectCharacter(data.avatarInfoList[0]);
            }
        } catch (err: unknown) {
            console.error("Fetch error:", err);
            const errorMessage = err instanceof Error ? err.message : "Failed to fetch data";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const selectCharacter = (avatar: AvatarInfo) => {
        const fightProps = avatar.fightPropMap;
        const propMap = avatar.propMap;
        const avatarId = String(avatar.avatarId);
        console.log("Avatar Data:", avatar);
        console.log("Skill Level Map:", avatar.skillLevelMap);
        console.log("Proud Skill Extra Level Map:", avatar.proudSkillExtraLevelMap);

        // Find weapon
        const weapon = avatar.equipList.find(item => item.flat.itemType === 'ITEM_WEAPON');
        const weaponId = weapon ? String(weapon.itemId) : "";

        // Map Character Info
        const charData = gameData.characters[avatarId];
        const newCharacter: Character = {
            ...data.character,
            name: charData?.name || `Unknown (${avatarId})`,
            level: parseInt(propMap['4001']?.val || '0'),
            constellation: avatar.talentIdList ? avatar.talentIdList.length : 0,
            element: charData?.element as any || 'anemo',
            imageUrl: charData?.icon ? `https://enka.network/ui/${charData.icon.replace("UI_AvatarIcon_", "UI_Gacha_AvatarImg_")}.png` : "",
            talents: {
                normal: {
                    level: (charData?.skills?.normal ? (avatar.skillLevelMap?.[String(charData.skills.normal.id)] || 0) : 0) +
                        (charData?.skills?.normal?.proudSkillGroupId ? (avatar.proudSkillExtraLevelMap?.[String(charData.skills.normal.proudSkillGroupId)] || 0) : 0),
                    boosted: (charData?.skills?.normal?.proudSkillGroupId ? (avatar.proudSkillExtraLevelMap?.[String(charData.skills.normal.proudSkillGroupId)] || 0) : 0) > 0,
                    icon: charData?.skills?.normal?.icon ? `https://enka.network/ui/${charData.skills.normal.icon}.png` : ""
                },
                skill: {
                    level: (charData?.skills?.skill ? (avatar.skillLevelMap?.[String(charData.skills.skill.id)] || 0) : 0) +
                        (charData?.skills?.skill?.proudSkillGroupId ? (avatar.proudSkillExtraLevelMap?.[String(charData.skills.skill.proudSkillGroupId)] || 0) : 0),
                    boosted: (charData?.skills?.skill?.proudSkillGroupId ? (avatar.proudSkillExtraLevelMap?.[String(charData.skills.skill.proudSkillGroupId)] || 0) : 0) > 0,
                    icon: charData?.skills?.skill?.icon ? `https://enka.network/ui/${charData.skills.skill.icon}.png` : ""
                },
                burst: {
                    level: (charData?.skills?.burst ? (avatar.skillLevelMap?.[String(charData.skills.burst.id)] || 0) : 0) +
                        (charData?.skills?.burst?.proudSkillGroupId ? (avatar.proudSkillExtraLevelMap?.[String(charData.skills.burst.proudSkillGroupId)] || 0) : 0),
                    boosted: (charData?.skills?.burst?.proudSkillGroupId ? (avatar.proudSkillExtraLevelMap?.[String(charData.skills.burst.proudSkillGroupId)] || 0) : 0) > 0,
                    icon: charData?.skills?.burst?.icon ? `https://enka.network/ui/${charData.skills.burst.icon}.png` : ""
                }
            },
            constellationIcons: charData?.constellations?.map(icon => `https://enka.network/ui/${icon}.png`)
        };

        // Map Weapon Info
        const weaponData = weaponId ? gameData.weapons[weaponId] : null;
        const newWeapon: Weapon = {
            ...data.weapon,
            name: weaponData?.name || (weapon ? `Unknown (${weaponId})` : "Unknown"),
            level: weapon?.weapon?.level || 0,
            refinement: (weapon?.weapon?.affixMap && Object.values(weapon.weapon.affixMap)[0] + 1) || 1,
            imageUrl: weaponData?.icon ? `https://enka.network/ui/${weaponData.icon}.png` : "",
            mainStat: weapon?.flat.weaponStats?.[0] ? {
                label: statMap[weapon.flat.weaponStats[0].appendPropId] || weapon.flat.weaponStats[0].appendPropId,
                value: formatStatValue(weapon.flat.weaponStats[0].appendPropId, weapon.flat.weaponStats[0].statValue)
            } : undefined,
            subStat: weapon?.flat.weaponStats?.[1] ? {
                label: statMap[weapon.flat.weaponStats[1].appendPropId] || weapon.flat.weaponStats[1].appendPropId,
                value: formatStatValue(weapon.flat.weaponStats[1].appendPropId, weapon.flat.weaponStats[1].statValue)
            } : undefined,
            rarity: weapon?.flat.rankLevel || 1,
        };

        // Map Stats
        const elementDmgBonus = Math.max(
            fightProps[40] || 0, fightProps[41] || 0, fightProps[42] || 0,
            fightProps[43] || 0, fightProps[44] || 0, fightProps[45] || 0, fightProps[46] || 0
        );

        const newStats: Stats = {
            hp: Math.round(fightProps[2000] || 0),
            atk: Math.round(fightProps[2001] || 0),
            def: Math.round(fightProps[2002] || 0),
            em: Math.round(fightProps[28] || 0),
            cr: parseFloat(((fightProps[20] || 0) * 100).toFixed(1)),
            cd: parseFloat(((fightProps[22] || 0) * 100).toFixed(1)),
            er: parseFloat(((fightProps[23] || 0) * 100).toFixed(1)),
            dmgBonus: parseFloat((elementDmgBonus * 100).toFixed(1)),
        };

        // Map Artifacts
        const slotMap: { [key: string]: string } = {
            'EQUIP_BRACER': 'flower',
            'EQUIP_NECKLACE': 'plume',
            'EQUIP_SHOES': 'sands',
            'EQUIP_RING': 'goblet',
            'EQUIP_DRESS': 'circlet'
        };

        const mergedArtifacts = [...data.artifacts];
        avatar.equipList.forEach(item => {
            if (item.flat.itemType === 'ITEM_RELIQUARY') {
                const slotKey = item.flat.equipType;
                if (slotKey && slotMap[slotKey]) {
                    const slotName = slotMap[slotKey];
                    const index = mergedArtifacts.findIndex(a => a.slot === slotName);
                    if (index !== -1) {
                        const artifactData = gameData.artifacts[String(item.itemId)];
                        const mainStat = item.flat.reliquaryMainstat;
                        const subStats = item.flat.reliquarySubstats || [];

                        mergedArtifacts[index] = {
                            ...mergedArtifacts[index],
                            set: (artifactData?.setId && gameData.artifactSets[artifactData.setId]) || artifactData?.name || "Unknown",
                            level: item.reliquary?.level ? item.reliquary.level - 1 : 0,
                            imageUrl: artifactData?.icon ? `https://enka.network/ui/${artifactData.icon}.png` : undefined,
                            mainStat: {
                                label: mainStat ? (statMap[mainStat.mainPropId] || mainStat.mainPropId) : "Main",
                                value: mainStat ? formatStatValue(mainStat.mainPropId, mainStat.statValue) : "0"
                            },
                            subStats: subStats.map(s => ({
                                label: statMap[s.appendPropId] || s.appendPropId,
                                value: formatStatValue(s.appendPropId, s.statValue)
                            }))
                        };
                    }
                }
            }
        });

        onChange({
            ...data,
            character: newCharacter,
            weapon: newWeapon,
            stats: newStats,
            artifacts: mergedArtifacts
        });
    };

    const updateCharacter = (field: keyof Character, value: Character[keyof Character]) => {
        onChange({ ...data, character: { ...data.character, [field]: value } });
    };

    const updateWeapon = (field: keyof Weapon, value: Weapon[keyof Weapon]) => {
        onChange({ ...data, weapon: { ...data.weapon, [field]: value } });
    };

    const updateStats = (field: keyof Stats, value: Stats[keyof Stats]) => {
        onChange({ ...data, stats: { ...data.stats, [field]: value } });
    };



    return (
        <div className="flex flex-col gap-6 p-4 bg-[#1C1C22] text-white rounded-lg border border-[#3A3A45]">
            {/* API Import Section */}
            <section>
                <h3 className="text-xl font-bold mb-4 text-[#D4AF37] border-b border-[#3A3A45] pb-2">Import from Enka.Network</h3>
                <div className="flex gap-2 items-end mb-4">
                    <Input
                        label="UID"
                        value={uid}
                        className="[ime-mode:disabled]"
                        autoComplete="off"
                        onChange={(v) => {
                            if (isComposing) {
                                setUid(v);
                                return;
                            }
                            // Convert full-width to half-width and strip non-alphanumeric
                            const cleaned = v
                                .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
                                .replace(/[^a-zA-Z0-9]/g, '');
                            setUid(cleaned);
                        }}
                        onCompositionStart={() => setIsComposing(true)}
                        onCompositionEnd={(e: React.CompositionEvent<HTMLInputElement>) => {
                            setIsComposing(false);
                            const v = e.currentTarget.value;
                            const cleaned = v
                                .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
                                .replace(/[^a-zA-Z0-9]/g, '');
                            setUid(cleaned);
                        }}
                        placeholder="Enter UID (Alphanumeric)"
                    />
                    <button
                        onClick={fetchEnkaData}
                        disabled={loading}
                        className="bg-[#D4AF37] text-black font-bold py-1 px-4 rounded h-[30px] hover:bg-[#E5C158] disabled:opacity-50 transition-colors text-sm"
                    >
                        {loading ? "Fetching..." : "Fetch Data"}
                    </button>
                </div>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                {/* Character Selection Grid */}
                {enkaData && enkaData.avatarInfoList && (
                    <div className="mt-4">
                        <p className="text-sm text-gray-400 mb-2">Select Character:</p>
                        <div className="flex flex-wrap gap-1">
                            {enkaData.avatarInfoList.map((avatar) => {
                                const charInfo = gameData.characters[String(avatar.avatarId)];
                                const isSelected = data.character.name === charInfo?.name;
                                return (
                                    <button
                                        key={avatar.avatarId}
                                        onClick={() => selectCharacter(avatar)}
                                        className={`relative w-10 h-10 rounded-full overflow-hidden border-2 transition-all ${isSelected ? "border-[#D4AF37] scale-110" : "border-transparent hover:border-gray-500"
                                            }`}
                                        title={charInfo?.name || String(avatar.avatarId)}
                                    >
                                        <img
                                            src={charInfo?.icon ? `https://enka.network/ui/${charInfo.icon}.png` : ""}
                                            alt={charInfo?.name}
                                            className="w-full h-full object-cover bg-gray-800"
                                            onError={(e) => (e.currentTarget.style.display = 'none')}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </section>

            {/* Character Section */}
            <section>
                <h3 className="text-xl font-bold mb-4 text-[#D4AF37] border-b border-[#3A3A45] pb-2">Character Info</h3>
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Name" value={data.character.name} onChange={(v) => updateCharacter("name", v)} />
                    <Input label="Level" type="number" value={data.character.level} onChange={(v) => updateCharacter("level", parseInt(v))} />
                    <Input label="Constellation" type="number" value={data.character.constellation} onChange={(v) => updateCharacter("constellation", parseInt(v))} />
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400">Element</label>
                        <select
                            value={data.character.element}
                            onChange={(e) => updateCharacter("element", e.target.value as any)}
                            className="bg-[#15151A] border border-[#3A3A45] rounded px-2 py-1 text-sm focus:border-[#D4AF37] outline-none transition-colors h-[30px]"
                        >
                            <option value="pyro">Pyro (炎)</option>
                            <option value="hydro">Hydro (水)</option>
                            <option value="anemo">Anemo (風)</option>
                            <option value="electro">Electro (雷)</option>
                            <option value="dendro">Dendro (草)</option>
                            <option value="cryo">Cryo (氷)</option>
                            <option value="geo">Geo (岩)</option>
                        </select>
                    </div>
                    <Input label="Image URL" value={data.character.imageUrl || ""} onChange={(v) => updateCharacter("imageUrl", v)} />
                </div>
            </section>

            {/* Weapon Section */}
            <section>
                <h3 className="text-xl font-bold mb-4 text-[#D4AF37] border-b border-[#3A3A45] pb-2">Weapon Info</h3>
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Weapon Name" value={data.weapon.name} onChange={(v) => updateWeapon("name", v)} />
                    <Input label="Level" type="number" value={data.weapon.level} onChange={(v) => updateWeapon("level", parseInt(v))} />
                    <Input label="Refinement" type="number" value={data.weapon.refinement} onChange={(v) => updateWeapon("refinement", parseInt(v))} />
                    <Input label="Image URL" value={data.weapon.imageUrl || ""} onChange={(v) => updateWeapon("imageUrl", v)} />
                </div>
            </section>

            {/* Stats Section */}
            <section>
                <h3 className="text-xl font-bold mb-4 text-[#D4AF37] border-b border-[#3A3A45] pb-2">Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Max HP" type="number" value={data.stats.hp} onChange={(v) => updateStats("hp", parseInt(v))} />
                    <Input label="ATK" type="number" value={data.stats.atk} onChange={(v) => updateStats("atk", parseInt(v))} />
                    <Input label="DEF" type="number" value={data.stats.def} onChange={(v) => updateStats("def", parseInt(v))} />
                    <Input label="EM" type="number" value={data.stats.em} onChange={(v) => updateStats("em", parseInt(v))} />
                    <Input label="Crit Rate %" type="number" value={data.stats.cr} onChange={(v) => updateStats("cr", parseFloat(v))} />
                    <Input label="Crit DMG %" type="number" value={data.stats.cd} onChange={(v) => updateStats("cd", parseFloat(v))} />
                    <Input label="ER %" type="number" value={data.stats.er} onChange={(v) => updateStats("er", parseFloat(v))} />
                    <Input label="Dmg Bonus %" type="number" value={data.stats.dmgBonus} onChange={(v) => updateStats("dmgBonus", parseFloat(v))} />
                </div>
            </section>

            {/* Score Settings */}
            <section>
                <h3 className="text-xl font-bold mb-4 text-[#D4AF37] border-b border-[#3A3A45] pb-2">Score Settings</h3>
                <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-400">Score Base Stat</label>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { value: 'atk', label: '攻撃力' },
                            { value: 'hp', label: 'HP' },
                            { value: 'def', label: '防御力' },
                            { value: 'er', label: '元素チャージ効率' }
                        ].map((option) => (
                            <label
                                key={option.value}
                                className={`
                                    flex items-center gap-2 px-3 py-2 rounded cursor-pointer border transition-all text-sm
                                    ${(data.scoreBase || 'atk') === option.value
                                        ? 'bg-[#D4AF37] border-[#D4AF37] text-black font-bold'
                                        : 'bg-[#15151A] border-[#3A3A45] text-gray-300 hover:border-[#D4AF37]'}
                                `}
                            >
                                <input
                                    type="radio"
                                    name="scoreBase"
                                    value={option.value}
                                    checked={(data.scoreBase || 'atk') === option.value}
                                    onChange={(e) => onChange({ ...data, scoreBase: e.target.value as any })}
                                    className="hidden"
                                />
                                {option.label}
                            </label>
                        ))}
                    </div>
                </div>
            </section>

            {/* Artifacts Section */}
            <section>
                <h3 className="text-xl font-bold mb-4 text-[#D4AF37] border-b border-[#3A3A45] pb-2">Artifacts</h3>
                <div className="flex flex-col gap-6">
                    {data.artifacts.map((artifact, index) => (
                        <div key={index} className="p-4 bg-[#15151A] rounded border border-[#3A3A45]">
                            <h4 className="font-bold mb-3 text-[#D4AF37] capitalize">{artifact.slot}</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <Input label="Set Name" value={artifact.set} onChange={(v) => {
                                    const newArtifacts = [...data.artifacts];
                                    newArtifacts[index] = { ...artifact, set: v };
                                    onChange({ ...data, artifacts: newArtifacts });
                                }} />
                                <Input label="Level" type="number" value={artifact.level} onChange={(v) => {
                                    const newArtifacts = [...data.artifacts];
                                    newArtifacts[index] = { ...artifact, level: parseInt(v) };
                                    onChange({ ...data, artifacts: newArtifacts });
                                }} />
                                <Input label="Main Stat" value={artifact.mainStat.label} onChange={(v) => {
                                    const newArtifacts = [...data.artifacts];
                                    newArtifacts[index] = { ...artifact, mainStat: { ...artifact.mainStat, label: v } };
                                    onChange({ ...data, artifacts: newArtifacts });
                                }} />
                                <Input label="Main Value" value={artifact.mainStat.value} onChange={(v) => {
                                    const newArtifacts = [...data.artifacts];
                                    newArtifacts[index] = { ...artifact, mainStat: { ...artifact.mainStat, value: v } };
                                    onChange({ ...data, artifacts: newArtifacts });
                                }} />
                            </div>
                            <div className="mt-4">
                                <label className="text-xs text-gray-400 mb-2 block">Sub Stats</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {artifact.subStats.map((sub, subIdx) => (
                                        <div key={subIdx} className="flex gap-1">
                                            <input
                                                type="text"
                                                value={sub.label}
                                                onChange={(e) => {
                                                    const newArtifacts = [...data.artifacts];
                                                    newArtifacts[index].subStats[subIdx].label = e.target.value;
                                                    onChange({ ...data, artifacts: newArtifacts });
                                                }}
                                                className="w-1/2 bg-[#1C1C22] border border-[#3A3A45] rounded px-2 py-1 text-xs outline-none focus:border-[#D4AF37]"
                                            />
                                            <input
                                                type="text"
                                                value={sub.value}
                                                onChange={(e) => {
                                                    const newArtifacts = [...data.artifacts];
                                                    newArtifacts[index].subStats[subIdx].value = e.target.value;
                                                    onChange({ ...data, artifacts: newArtifacts });
                                                }}
                                                className="w-1/2 bg-[#1C1C22] border border-[#3A3A45] rounded px-2 py-1 text-xs outline-none focus:border-[#D4AF37]"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};
