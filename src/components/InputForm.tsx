"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Star, Trash2 } from "lucide-react";
import { BuildData, Character, Weapon, Stats, Artifact, EnkaNetworkResponse, AvatarInfo } from "@/types";
import gameDataRaw from "@/data/gameData.json";
import rarityDataRaw from "@/data/rarityData.json";
import artifactStatsRaw from "@/data/artifactMainStats.json";
import { statMap, formatStatValue } from "@/utils/mappings";

import { INITIAL_DATA } from "@/app/page";

// Type assertion for gameData to avoid implicit any errors if strict mode is on
const gameData = gameDataRaw as unknown as {
    characters: { [key: string]: { name: string; icon: string; sideIcon: string; element?: string; weaponType?: string; constellations?: string[]; skills?: { [key: string]: { id: number; icon?: string; proudSkillGroupId?: number } } } };
    weapons: { [key: string]: { name: string; icon: string; weaponType?: string; rarity?: number } };
    artifacts: { [key: string]: { name: string; icon: string; setId: number } };
    artifactSets: { [key: string]: string };
};

// Type assertion for rarityData
const rarityData = rarityDataRaw as { [key: string]: string };

// Type assertion for artifactStats
const artifactStats = artifactStatsRaw as { [key: string]: { [rarity: string]: (string | null)[] } };

const getArtifactMainStatValue = (label: string, rarity: number, level: number): string | null => {
    // Attempt lookup directly first
    let statKey = label;

    // If not found, check if it's in our mapping via statMap (reverse lookup or direct?)
    // The keys in artifactStats are mostly Japanese labels like '攻撃力', 'HP%', etc.
    // statMap maps EN keys to JP text.
    // If the label is valid JP text, it should be a key.

    if (!artifactStats[statKey]) {
        // Try to handle potentially missing % or slight variations if strictly needed,
        // but for now assume exact match or fallback.
        // Special case: 'Element Dmg' might be specific like '炎元素ダメージ' which IS in the json.
        return null;
    }

    const rarityStr = String(rarity);
    if (!artifactStats[statKey][rarityStr]) return null;

    const values = artifactStats[statKey][rarityStr];
    if (level < 0 || level >= values.length) return null;

    let value = values[level];
    if (value === null) return null;

    // Auto-append % for percentage stats if not present
    const nonPercentStats = ['HP', '攻撃力', '防御力', '元素熟知'];
    if (!nonPercentStats.includes(label) && !value.endsWith('%')) {
        // Double check if it looks like a number
        if (!isNaN(parseFloat(value))) {
            value += '%';
        }
    }

    return value;
};

const slotLabels: { [key: string]: string } = {
    flower: "生の花",
    plume: "死の羽",
    sands: "時の砂",
    goblet: "空の杯",
    circlet: "理の冠"
};

const getArtifactImageUrl = (setName: string, slot: string) => {
    const setId = Object.keys(gameData.artifactSets).find(key => gameData.artifactSets[key] === setName);
    if (!setId) return undefined;

    const suffixMap: { [key: string]: string } = {
        flower: '_4',
        plume: '_2',
        sands: '_5',
        goblet: '_1',
        circlet: '_3'
    };
    const suffix = suffixMap[slot];
    if (!suffix) return undefined;

    const artifact = Object.values(gameData.artifacts).find(a => a.setId === parseInt(setId) && a.icon.endsWith(suffix));
    return artifact?.icon ? `https://enka.network/ui/${artifact.icon}.png` : undefined;
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

    // Character Dropdown State
    const [charDropdownOpen, setCharDropdownOpen] = useState(false);
    const charDropdownRef = useRef<HTMLDivElement>(null);

    // Weapon Dropdown State
    const [weaponDropdownOpen, setWeaponDropdownOpen] = useState(false);
    const weaponDropdownRef = useRef<HTMLDivElement>(null);

    // Artifact Set Dropdown State
    const [openSetIndex, setOpenSetIndex] = useState<number | null>(null);
    const setDropdownRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (charDropdownRef.current && !charDropdownRef.current.contains(event.target as Node)) {
                setCharDropdownOpen(false);
            }
            if (weaponDropdownRef.current && !weaponDropdownRef.current.contains(event.target as Node)) {
                setWeaponDropdownOpen(false);
            }
            if (openSetIndex !== null && setDropdownRefs.current[openSetIndex] && !setDropdownRefs.current[openSetIndex]?.contains(event.target as Node)) {
                setOpenSetIndex(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [openSetIndex]);

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
                            rarity: item.flat.rankLevel || 5,
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
                <h3 className="text-xl font-bold mb-4 text-[#D4AF37] border-b border-[#3A3A45] pb-2">Enka.Networkからインポート</h3>
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
                        placeholder="UIDを入力 (半角英数字)"
                    />
                    <button
                        onClick={fetchEnkaData}
                        disabled={loading}
                        className="bg-[#D4AF37] text-black font-bold py-1 px-4 rounded h-[30px] hover:bg-[#E5C158] disabled:opacity-50 transition-colors text-sm"
                    >
                        {loading ? "取得中..." : "データ取得"}
                    </button>
                    <button
                        onClick={() => {
                            if (window.confirm("現在のデータをクリアして初期状態に戻しますか？")) {
                                onChange(INITIAL_DATA);
                                setUid("");
                            }
                        }}
                        className="bg-[#1C1C22] border border-[#3A3A45] text-red-400 font-bold py-1 px-3 rounded h-[30px] hover:bg-[#2A2A35] transition-colors text-sm flex items-center justify-center"
                        title="データをクリア"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                {/* Character Selection Grid */}
                {enkaData && enkaData.avatarInfoList && (
                    <div className="mt-4">
                        <p className="text-sm text-gray-400 mb-2">キャラクターを選択:</p>
                        <div className="grid grid-cols-6 gap-2">
                            {enkaData.avatarInfoList.map((avatar) => {
                                const charInfo = gameData.characters[String(avatar.avatarId)];
                                const isSelected = data.character.name === charInfo?.name;
                                const rarity = rarityData[String(avatar.avatarId)];
                                let bgColor = "bg-gray-800"; // Default
                                if (rarity === "QUALITY_ORANGE" || rarity === "QUALITY_ORANGE_SP") {
                                    bgColor = "bg-[#CA8427]"; // Gold/Orange 5*
                                } else if (rarity === "QUALITY_PURPLE") {
                                    bgColor = "bg-[#855CCC]"; // Purple 4*
                                }

                                return (
                                    <button
                                        key={avatar.avatarId}
                                        onClick={() => selectCharacter(avatar)}
                                        className={`relative w-full aspect-square rounded-full overflow-hidden border-2 transition-all ${isSelected ? "border-[#D4AF37] scale-110 z-10" : "border-transparent hover:border-gray-500 text-opacity-80"
                                            }`}
                                        title={charInfo?.name || String(avatar.avatarId)}
                                    >
                                        <div className={`absolute inset-0 ${bgColor} opacity-80`} />
                                        <img
                                            src={charInfo?.icon ? `https://enka.network/ui/${charInfo.icon}.png` : ""}
                                            alt={charInfo?.name}
                                            className="absolute inset-0 w-full h-full object-cover"
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
                <h3 className="text-xl font-bold mb-4 text-[#D4AF37] border-b border-[#3A3A45] pb-2">キャラクター情報</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400">名前</label>
                        <div className="relative" ref={charDropdownRef}>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={data.character.name}
                                    onFocus={() => setCharDropdownOpen(true)}
                                    onChange={(e) => {
                                        const name = e.target.value;
                                        setCharDropdownOpen(true);

                                        const charEntry = Object.values(gameData.characters).find(c => c.name === name);
                                        let newCharacter = { ...data.character, name };

                                        if (charEntry) {
                                            if (charEntry.element) {
                                                newCharacter.element = charEntry.element as any;
                                            }
                                            if (charEntry.icon) {
                                                newCharacter.imageUrl = `https://enka.network/ui/${charEntry.icon.replace("UI_AvatarIcon_", "UI_Gacha_AvatarImg_")}.png`;
                                            }
                                            if (charEntry.constellations) {
                                                newCharacter.constellationIcons = charEntry.constellations.map(icon => `https://enka.network/ui/${icon}.png`);
                                            }
                                            if (charEntry.skills) {
                                                newCharacter.talents = {
                                                    normal: {
                                                        ...data.character.talents.normal,
                                                        icon: charEntry.skills.normal?.icon ? `https://enka.network/ui/${charEntry.skills.normal.icon}.png` : ""
                                                    },
                                                    skill: {
                                                        ...data.character.talents.skill,
                                                        icon: charEntry.skills.skill?.icon ? `https://enka.network/ui/${charEntry.skills.skill.icon}.png` : ""
                                                    },
                                                    burst: {
                                                        ...data.character.talents.burst,
                                                        icon: charEntry.skills.burst?.icon ? `https://enka.network/ui/${charEntry.skills.burst.icon}.png` : ""
                                                    },
                                                };
                                            }
                                        }

                                        onChange({ ...data, character: newCharacter });
                                    }}
                                    className="w-full bg-[#15151A] border border-[#3A3A45] rounded px-2 py-1 text-sm focus:border-[#D4AF37] outline-none transition-colors pr-8"
                                />
                                <button
                                    type="button"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                    onClick={() => setCharDropdownOpen(!charDropdownOpen)}
                                >
                                    <ChevronDown size={16} />
                                </button>
                            </div>

                            {charDropdownOpen && (
                                <ul className="absolute z-50 left-0 right-0 top-full mt-1 max-h-60 overflow-y-auto bg-[#1C1C22] border border-[#3A3A45] rounded shadow-lg">
                                    {(() => {
                                        const sortedChars = Object.values(gameData.characters).sort((a, b) => a.name.localeCompare(b.name, 'ja'));
                                        const isExactMatch = sortedChars.some(c => c.name === data.character.name);
                                        const filteredChars = (data.character.name && !isExactMatch)
                                            ? sortedChars.filter(c => c.name.toLowerCase().includes(data.character.name.toLowerCase()))
                                            : sortedChars;

                                        if (filteredChars.length === 0) {
                                            return <li className="px-3 py-2 text-sm text-gray-500">結果なし</li>;
                                        }

                                        return filteredChars.map((char) => (
                                            <li
                                                key={char.name}
                                                className={`px-3 py-2 text-sm cursor-pointer hover:bg-[#3A3A45] flex items-center justify-between ${char.name === data.character.name ? "text-[#D4AF37]" : "text-gray-200"}`}
                                                onClick={() => {
                                                    const charEntry = char;
                                                    let newCharacter = { ...data.character, name: char.name };

                                                    if (charEntry.element) {
                                                        newCharacter.element = charEntry.element as any;
                                                    }
                                                    if (charEntry.icon) {
                                                        newCharacter.imageUrl = `https://enka.network/ui/${charEntry.icon.replace("UI_AvatarIcon_", "UI_Gacha_AvatarImg_")}.png`;
                                                    }
                                                    if (charEntry.constellations) {
                                                        newCharacter.constellationIcons = charEntry.constellations.map(icon => `https://enka.network/ui/${icon}.png`);
                                                    }
                                                    if (charEntry.skills) {
                                                        newCharacter.talents = {
                                                            normal: {
                                                                ...data.character.talents.normal,
                                                                icon: charEntry.skills.normal?.icon ? `https://enka.network/ui/${charEntry.skills.normal.icon}.png` : ""
                                                            },
                                                            skill: {
                                                                ...data.character.talents.skill,
                                                                icon: charEntry.skills.skill?.icon ? `https://enka.network/ui/${charEntry.skills.skill.icon}.png` : ""
                                                            },
                                                            burst: {
                                                                ...data.character.talents.burst,
                                                                icon: charEntry.skills.burst?.icon ? `https://enka.network/ui/${charEntry.skills.burst.icon}.png` : ""
                                                            },
                                                        };
                                                    }

                                                    onChange({ ...data, character: newCharacter });
                                                    setCharDropdownOpen(false);
                                                }}
                                            >
                                                <span>{char.name}</span>
                                                {char.name === data.character.name && <Check size={14} />}
                                            </li>
                                        ));
                                    })()}
                                </ul>
                            )}
                        </div>
                    </div>
                    <Input label="レベル" type="number" value={data.character.level} onChange={(v) => updateCharacter("level", parseInt(v))} />
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400">命の星座 (凸)</label>
                        <div className="flex gap-2">
                            {Array.from({ length: 6 }).map((_, i) => {
                                const isOpen = i < data.character.constellation;

                                // Look up icon dynamically from gameData
                                const currentChar = Object.values(gameData.characters).find(c => c.name === data.character.name);
                                const iconId = currentChar?.constellations?.[i];
                                const iconUrl = iconId ? `https://enka.network/ui/${iconId}.png` : data.character.constellationIcons?.[i];

                                return (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            const newLevel = data.character.constellation === i + 1 ? 0 : i + 1;
                                            updateCharacter("constellation", newLevel);
                                        }}
                                        className={`
                                            w-10 h-10 rounded-full border-2 flex items-center justify-center overflow-hidden transition-all relative
                                            ${isOpen
                                                ? "border-[#D4AF37] opacity-100"
                                                : "border-[#3A3A45] opacity-40 grayscale hover:opacity-70"
                                            }
                                        `}
                                        title={`Constellation ${i + 1}`}
                                    >
                                        <div className={`absolute inset-0 bg-[#1C1C22] ${isOpen ? "bg-opacity-0" : "bg-opacity-60"} z-10 transition-all`} />
                                        {iconUrl ? (
                                            <img
                                                src={iconUrl}
                                                alt={`C${i + 1}`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => e.currentTarget.style.display = 'none'}
                                            />
                                        ) : (
                                            <span className="text-xs font-bold text-gray-500 z-20 relative">{i + 1}</span>
                                        )}
                                        {/* Overlay for active state glow/tint if needed */}
                                        {isOpen && <div className="absolute inset-0 bg-[#D4AF37] opacity-10 mix-blend-overlay z-20 pointer-events-none" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400">元素</label>
                        <select
                            value={data.character.element}
                            onChange={(e) => updateCharacter("element", e.target.value as any)}
                            className="bg-[#15151A] border border-[#3A3A45] rounded px-2 py-1 text-sm focus:border-[#D4AF37] outline-none transition-colors h-[30px]"
                        >
                            <option value="pyro">炎</option>
                            <option value="hydro">水</option>
                            <option value="anemo">風</option>
                            <option value="electro">雷</option>
                            <option value="dendro">草</option>
                            <option value="cryo">氷</option>
                            <option value="geo">岩</option>
                        </select>
                    </div>

                    <div className="col-span-2 mt-2">
                        <label className="text-xs text-gray-400 mb-2 block">天賦 (通常 / スキル / 爆発)</label>
                        <div className="flex gap-4 bg-[#1C1C22] p-3 rounded border border-[#3A3A45]">
                            {(['normal', 'skill', 'burst'] as const).map((type) => {
                                const talent = data.character.talents[type];
                                const labels = { normal: "通常", skill: "スキル", burst: "爆発" };

                                return (
                                    <div key={type} className="flex-1 flex flex-col gap-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs text-gray-400">{labels[type]}</span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newTalents = {
                                                        ...data.character.talents,
                                                        [type]: {
                                                            ...talent,
                                                            boosted: !talent.boosted
                                                        }
                                                    };
                                                    onChange({ ...data, character: { ...data.character, talents: newTalents } });
                                                }}
                                                className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${talent.boosted
                                                    ? "bg-[#D4AF37] text-[#1C1C22] border-[#D4AF37] font-bold"
                                                    : "bg-transparent text-gray-500 border-gray-600 hover:border-gray-400"
                                                    }`}
                                            >
                                                Boost
                                            </button>
                                        </div>
                                        <input
                                            type="number"
                                            value={talent.level}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value) || 1;
                                                const newTalents = {
                                                    ...data.character.talents,
                                                    [type]: {
                                                        ...talent,
                                                        level: val
                                                    }
                                                };
                                                onChange({ ...data, character: { ...data.character, talents: newTalents } });
                                            }}
                                            className={`w-full bg-[#15151A] border rounded px-2 py-1 text-sm outline-none transition-colors ${talent.boosted
                                                ? "border-[#D4AF37] text-[#D4AF37]"
                                                : "border-[#3A3A45] focus:border-[#D4AF37]"
                                                }`}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </section>

            {/* Weapon Section */}
            <section>
                <h3 className="text-xl font-bold mb-4 text-[#D4AF37] border-b border-[#3A3A45] pb-2">武器情報</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-400">武器名</label>
                        <div className="relative" ref={weaponDropdownRef}>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={data.weapon.name}
                                    onFocus={() => setWeaponDropdownOpen(true)}
                                    onChange={(e) => {
                                        const name = e.target.value;
                                        updateWeapon("name", name);
                                        setWeaponDropdownOpen(true);

                                        const weaponEntry = Object.values(gameData.weapons).find(w => w.name === name);
                                        if (weaponEntry) {
                                            if (weaponEntry.icon) {
                                                updateWeapon("imageUrl", `https://enka.network/ui/${weaponEntry.icon}.png`);
                                            }
                                            if (weaponEntry.rarity) {
                                                updateWeapon("rarity", weaponEntry.rarity);
                                            }
                                        }
                                    }}
                                    className="w-full bg-[#15151A] border border-[#3A3A45] rounded px-2 py-1 text-sm focus:border-[#D4AF37] outline-none transition-colors pr-8"
                                />
                                <button
                                    type="button"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                    onClick={() => setWeaponDropdownOpen(!weaponDropdownOpen)}
                                >
                                    <ChevronDown size={16} />
                                </button>
                            </div>

                            {weaponDropdownOpen && (
                                <ul className="absolute z-50 left-0 right-0 top-full mt-1 max-h-60 overflow-y-auto bg-[#1C1C22] border border-[#3A3A45] rounded shadow-lg">
                                    {(() => {
                                        // 1. Get current character's weapon type
                                        const currentCharEntry = Object.values(gameData.characters).find(c => c.name === data.character.name);
                                        const targetWeaponType = currentCharEntry?.weaponType;

                                        // 2. Filter weapons
                                        const sortedWeapons = Object.values(gameData.weapons)
                                            .filter(w => !targetWeaponType || w.weaponType === targetWeaponType) // Filter if type is known
                                            .sort((a, b) => {
                                                const rarityA = a.rarity || 0;
                                                const rarityB = b.rarity || 0;
                                                if (rarityA !== rarityB) {
                                                    return rarityB - rarityA; // Descending rarity
                                                }
                                                return a.name.localeCompare(b.name, 'ja');
                                            });

                                        const isExactMatch = sortedWeapons.some(w => w.name === data.weapon.name);
                                        const filteredWeapons = (data.weapon.name && !isExactMatch)
                                            ? sortedWeapons.filter(w => w.name.toLowerCase().includes(data.weapon.name.toLowerCase()))
                                            : sortedWeapons;

                                        if (filteredWeapons.length === 0) {
                                            return <li className="px-3 py-2 text-sm text-gray-500">結果なし</li>;
                                        }

                                        return filteredWeapons.map((weapon) => (
                                            <li
                                                key={weapon.name}
                                                className={`px-3 py-2 text-sm cursor-pointer hover:bg-[#3A3A45] flex items-center justify-between ${weapon.name === data.weapon.name ? "text-[#D4AF37]" : "text-gray-200"}`}
                                                onClick={() => {
                                                    updateWeapon("name", weapon.name);
                                                    if (weapon.icon) {
                                                        updateWeapon("imageUrl", `https://enka.network/ui/${weapon.icon}.png`);
                                                    }
                                                    if (weapon.rarity) {
                                                        updateWeapon("rarity", weapon.rarity);
                                                    }
                                                    setWeaponDropdownOpen(false);
                                                }}
                                            >
                                                <span>{weapon.name}</span>
                                                {weapon.name === data.weapon.name && <Check size={14} />}
                                            </li>
                                        ));
                                    })()}
                                </ul>
                            )}
                        </div>
                    </div>
                    <Input label="レベル" type="number" value={data.weapon.level} onChange={(v) => updateWeapon("level", parseInt(v))} />
                    <Input label="精錬ランク" type="number" value={data.weapon.refinement} onChange={(v) => updateWeapon("refinement", parseInt(v))} />

                </div>
            </section>

            {/* Stats Section */}
            <section>
                <h3 className="text-xl font-bold mb-4 text-[#D4AF37] border-b border-[#3A3A45] pb-2">ステータス</h3>
                <div className="grid grid-cols-2 gap-4">
                    <Input label="HP上限" type="number" value={data.stats.hp} onChange={(v) => updateStats("hp", parseInt(v))} />
                    <Input label="攻撃力" type="number" value={data.stats.atk} onChange={(v) => updateStats("atk", parseInt(v))} />
                    <Input label="防御力" type="number" value={data.stats.def} onChange={(v) => updateStats("def", parseInt(v))} />
                    <Input label="元素熟知" type="number" value={data.stats.em} onChange={(v) => updateStats("em", parseInt(v))} />
                    <Input label="会心率 %" type="number" value={data.stats.cr} onChange={(v) => updateStats("cr", parseFloat(v))} />
                    <Input label="会心ダメージ %" type="number" value={data.stats.cd} onChange={(v) => updateStats("cd", parseFloat(v))} />
                    <Input label="元素チャージ効率 %" type="number" value={data.stats.er} onChange={(v) => updateStats("er", parseFloat(v))} />
                    <Input label="ダメージバフ %" type="number" value={data.stats.dmgBonus} onChange={(v) => updateStats("dmgBonus", parseFloat(v))} />
                </div>
            </section>

            {/* Score Settings */}
            <section>
                <h3 className="text-xl font-bold mb-4 text-[#D4AF37] border-b border-[#3A3A45] pb-2">聖遺物スコア計算設定</h3>
                <div className="flex flex-col gap-2">
                    <label className="text-xs text-gray-400">基準ステータス</label>
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
                <h3 className="text-xl font-bold mb-4 text-[#D4AF37] border-b border-[#3A3A45] pb-2">聖遺物</h3>
                <div className="flex flex-col gap-6">
                    {data.artifacts.map((artifact, index) => (
                        <div key={index} className="p-4 bg-[#15151A] rounded border border-[#3A3A45]">
                            <h4 className="font-bold mb-3 text-[#D4AF37]">{slotLabels[artifact.slot] || artifact.slot}</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-gray-400">セット名</label>
                                    <div className="relative" ref={el => { setDropdownRefs.current[index] = el; }}>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={artifact.set}
                                                onFocus={() => setOpenSetIndex(index)}
                                                onChange={(e) => {
                                                    const newArtifacts = [...data.artifacts];
                                                    const newSet = e.target.value;
                                                    const newImg = getArtifactImageUrl(newSet, artifact.slot);
                                                    newArtifacts[index] = { ...artifact, set: newSet, imageUrl: newImg };
                                                    onChange({ ...data, artifacts: newArtifacts });
                                                    setOpenSetIndex(index);
                                                }}
                                                className="w-full bg-[#1C1C22] border border-[#3A3A45] rounded px-2 py-1 text-sm focus:border-[#D4AF37] outline-none transition-colors pr-8"
                                            />
                                            <button
                                                type="button"
                                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                                onClick={() => setOpenSetIndex(openSetIndex === index ? null : index)}
                                            >
                                                <ChevronDown size={14} />
                                            </button>
                                        </div>

                                        {openSetIndex === index && (
                                            <ul className="absolute z-50 left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto bg-[#1C1C22] border border-[#3A3A45] rounded shadow-lg">
                                                {(() => {
                                                    const allSets = Array.from(new Set(Object.values(gameData.artifactSets))).sort((a, b) => a.localeCompare(b, 'ja'));
                                                    const isExactMatch = allSets.includes(artifact.set);
                                                    const filteredSets = (artifact.set && !isExactMatch)
                                                        ? allSets.filter(s => s.toLowerCase().includes(artifact.set.toLowerCase()))
                                                        : allSets;

                                                    if (filteredSets.length === 0) {
                                                        return <li className="px-3 py-2 text-sm text-gray-500">結果なし</li>;
                                                    }

                                                    return filteredSets.map((setName) => (
                                                        <li
                                                            key={setName}
                                                            className={`px-3 py-2 text-xs cursor-pointer hover:bg-[#3A3A45] flex items-center justify-between ${setName === artifact.set ? "text-[#D4AF37]" : "text-gray-200"}`}
                                                            onClick={() => {
                                                                const newArtifacts = [...data.artifacts];
                                                                const newImg = getArtifactImageUrl(setName, artifact.slot);
                                                                newArtifacts[index] = { ...artifact, set: setName, imageUrl: newImg };
                                                                onChange({ ...data, artifacts: newArtifacts });
                                                                setOpenSetIndex(null);
                                                            }}
                                                        >
                                                            <span>{setName}</span>
                                                            {setName === artifact.set && <Check size={12} />}
                                                        </li>
                                                    ));
                                                })()}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs text-gray-400">レア度</label>
                                    <div className="flex gap-1 h-[30px] items-center">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => {
                                                    const newArtifacts = [...data.artifacts];

                                                    // Calculate new main stat value if possible
                                                    const newVal = getArtifactMainStatValue(artifact.mainStat.label, star, artifact.level);

                                                    newArtifacts[index] = {
                                                        ...artifact,
                                                        rarity: star,
                                                        mainStat: {
                                                            ...artifact.mainStat,
                                                            // If we found a valid value, use it. Otherwise keep the old one (or user can edit).
                                                            value: newVal !== null ? newVal : artifact.mainStat.value
                                                        }
                                                    };
                                                    onChange({ ...data, artifacts: newArtifacts });
                                                }}
                                                className="transition-transform hover:scale-110 focus:outline-none"
                                            >
                                                <Star
                                                    size={16}
                                                    fill={star <= (artifact.rarity || 5) ? "#D4AF37" : "none"}
                                                    color={star <= (artifact.rarity || 5) ? "#D4AF37" : "#4A4A55"}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <Input label="レベル" type="number" value={artifact.level} onChange={(v) => {
                                    const newArtifacts = [...data.artifacts];
                                    const newLevel = parseInt(v) || 0;

                                    // Calculate new main stat value if possible
                                    const newVal = getArtifactMainStatValue(artifact.mainStat.label, artifact.rarity || 5, newLevel);

                                    newArtifacts[index] = {
                                        ...artifact,
                                        level: newLevel,
                                        mainStat: {
                                            ...artifact.mainStat,
                                            value: newVal !== null ? newVal : artifact.mainStat.value
                                        }
                                    };

                                    onChange({ ...data, artifacts: newArtifacts });
                                }} />
                                {artifact.slot === 'sands' ? (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-gray-400">メイン効果</label>
                                        <select
                                            value={artifact.mainStat.label}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                const newVal = getArtifactMainStatValue(v, artifact.rarity || 5, artifact.level);

                                                const newArtifacts = [...data.artifacts];
                                                newArtifacts[index] = {
                                                    ...artifact,
                                                    mainStat: {
                                                        ...artifact.mainStat,
                                                        label: v,
                                                        value: newVal !== null ? newVal : artifact.mainStat.value
                                                    }
                                                };
                                                onChange({ ...data, artifacts: newArtifacts });
                                            }}
                                            className="bg-[#15151A] border border-[#3A3A45] rounded px-2 py-1 text-sm focus:border-[#D4AF37] outline-none transition-colors h-[30px]"
                                        >
                                            <option value="攻撃力%">攻撃力%</option>
                                            <option value="防御力%">防御力%</option>
                                            <option value="HP%">HP%</option>
                                            <option value="元素熟知">元素熟知</option>
                                            <option value="元素チャージ効率">元素チャージ効率</option>
                                        </select>
                                    </div>
                                ) : artifact.slot === 'goblet' ? (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-gray-400">メイン効果</label>
                                        <select
                                            value={artifact.mainStat.label}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                const newVal = getArtifactMainStatValue(v, artifact.rarity || 5, artifact.level);

                                                const newArtifacts = [...data.artifacts];
                                                newArtifacts[index] = {
                                                    ...artifact,
                                                    mainStat: {
                                                        ...artifact.mainStat,
                                                        label: v,
                                                        value: newVal !== null ? newVal : artifact.mainStat.value
                                                    }
                                                };
                                                onChange({ ...data, artifacts: newArtifacts });
                                            }}
                                            className="bg-[#15151A] border border-[#3A3A45] rounded px-2 py-1 text-sm focus:border-[#D4AF37] outline-none transition-colors h-[30px]"
                                        >
                                            <option value="攻撃力%">攻撃力%</option>
                                            <option value="防御力%">防御力%</option>
                                            <option value="HP%">HP%</option>
                                            <option value="元素熟知">元素熟知</option>
                                            <option value="炎元素ダメージ">炎元素ダメージ</option>
                                            <option value="水元素ダメージ">水元素ダメージ</option>
                                            <option value="風元素ダメージ">風元素ダメージ</option>
                                            <option value="雷元素ダメージ">雷元素ダメージ</option>
                                            <option value="草元素ダメージ">草元素ダメージ</option>
                                            <option value="氷元素ダメージ">氷元素ダメージ</option>
                                            <option value="岩元素ダメージ">岩元素ダメージ</option>
                                            <option value="物理ダメージ">物理ダメージ</option>
                                        </select>
                                    </div>
                                ) : artifact.slot === 'circlet' ? (
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-gray-400">メイン効果</label>
                                        <select
                                            value={artifact.mainStat.label}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                const newVal = getArtifactMainStatValue(v, artifact.rarity || 5, artifact.level);

                                                const newArtifacts = [...data.artifacts];
                                                newArtifacts[index] = {
                                                    ...artifact,
                                                    mainStat: {
                                                        ...artifact.mainStat,
                                                        label: v,
                                                        value: newVal !== null ? newVal : artifact.mainStat.value
                                                    }
                                                };
                                                onChange({ ...data, artifacts: newArtifacts });
                                            }}
                                            className="bg-[#15151A] border border-[#3A3A45] rounded px-2 py-1 text-sm focus:border-[#D4AF37] outline-none transition-colors h-[30px]"
                                        >
                                            <option value="攻撃力%">攻撃力%</option>
                                            <option value="防御力%">防御力%</option>
                                            <option value="HP%">HP%</option>
                                            <option value="元素熟知">元素熟知</option>
                                            <option value="会心率">会心率</option>
                                            <option value="会心ダメージ">会心ダメージ</option>
                                            <option value="与える治癒効果">与える治癒効果</option>
                                        </select>
                                    </div>
                                ) : (
                                    <Input
                                        label="メイン効果"
                                        value={artifact.mainStat.label}
                                        disabled={artifact.slot === 'flower' || artifact.slot === 'plume'}
                                        onChange={(v) => {

                                            // Calculate new main stat value if possible for the new label
                                            const newVal = getArtifactMainStatValue(v, artifact.rarity || 5, artifact.level);

                                            const newArtifacts = [...data.artifacts];
                                            newArtifacts[index] = {
                                                ...artifact,
                                                mainStat: {
                                                    ...artifact.mainStat,
                                                    label: v,
                                                    value: newVal !== null ? newVal : artifact.mainStat.value
                                                }
                                            };
                                            onChange({ ...data, artifacts: newArtifacts });
                                        }} />
                                )}
                                <Input label="メイン値" value={artifact.mainStat.value} onChange={(v) => {
                                    const newArtifacts = [...data.artifacts];
                                    newArtifacts[index] = { ...artifact, mainStat: { ...artifact.mainStat, value: v } };
                                    onChange({ ...data, artifacts: newArtifacts });
                                }} />
                            </div>
                            <div className="mt-4">
                                <label className="text-xs text-gray-400 mb-2 block">サブステータス</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[0, 1, 2, 3].map((subIdx) => {
                                        const sub = artifact.subStats[subIdx] || { label: '', value: '' };

                                        return (
                                            <div key={subIdx} className="flex gap-1">
                                                <input
                                                    type="text"
                                                    value={sub.label}
                                                    onChange={(e) => {
                                                        const newArtifacts = [...data.artifacts];

                                                        // Ensure subStats array has objects up to this index
                                                        if (!newArtifacts[index].subStats) newArtifacts[index].subStats = [];
                                                        for (let i = 0; i <= subIdx; i++) {
                                                            if (!newArtifacts[index].subStats[i]) {
                                                                newArtifacts[index].subStats[i] = { label: '', value: '' };
                                                            }
                                                        }

                                                        newArtifacts[index].subStats[subIdx].label = e.target.value;
                                                        onChange({ ...data, artifacts: newArtifacts });
                                                    }}
                                                    className="w-1/2 bg-[#1C1C22] border border-[#3A3A45] rounded px-2 py-1 text-xs outline-none focus:border-[#D4AF37]"
                                                    placeholder="ステータス"
                                                />
                                                <input
                                                    type="text"
                                                    value={sub.value}
                                                    onChange={(e) => {
                                                        const newArtifacts = [...data.artifacts];

                                                        // Ensure subStats array has objects up to this index
                                                        if (!newArtifacts[index].subStats) newArtifacts[index].subStats = [];
                                                        for (let i = 0; i <= subIdx; i++) {
                                                            if (!newArtifacts[index].subStats[i]) {
                                                                newArtifacts[index].subStats[i] = { label: '', value: '' };
                                                            }
                                                        }

                                                        newArtifacts[index].subStats[subIdx].value = e.target.value;
                                                        onChange({ ...data, artifacts: newArtifacts });
                                                    }}
                                                    className="w-1/2 bg-[#1C1C22] border border-[#3A3A45] rounded px-2 py-1 text-xs outline-none focus:border-[#D4AF37]"
                                                    placeholder="値"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};
