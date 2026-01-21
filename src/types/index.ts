export interface Character {
    name: string;
    level: number;
    constellation: number; // 0-6
    element: 'pyro' | 'hydro' | 'anemo' | 'electro' | 'dendro' | 'cryo' | 'geo';
    imageUrl?: string;
    talents: {
        normal: Talent;
        skill: Talent;
        burst: Talent;
    };
    constellationIcons?: string[];
}

export interface Talent {
    level: number;
    boosted: boolean;
    icon: string;
}

export interface Weapon {
    name: string;
    level: number;
    refinement: number; // 1-5
    imageUrl?: string;
    mainStat?: { label: string; value: string };
    subStat?: { label: string; value: string };
    rarity?: number;
}

export interface Artifact {
    set: string;
    slot: 'flower' | 'plume' | 'sands' | 'goblet' | 'circlet';
    mainStat: { label: string; value: string };
    subStats: { label: string; value: string }[];
    level: number;
    imageUrl?: string;
    rarity?: number;
}

export interface Stats {
    hp: number;
    atk: number;
    def: number;
    em: number;
    cr: number; // Crit Rate %
    cd: number; // Crit Dmg %
    er: number; // Energy Recharge %
    dmgBonus: number; // Elemental Dmg Bonus %
}


export interface BuildData {
    character: Character;
    weapon: Weapon;
    artifacts: Artifact[];
    stats: Stats;
    scoreBase?: 'atk' | 'hp' | 'def' | 'er';
}

// Enka.Network API Types
export interface EnkaNetworkResponse {
    playerInfo: PlayerInfo;
    avatarInfoList?: AvatarInfo[];
    ttl?: number;
    uid?: string;
}

export interface PlayerInfo {
    nickname: string;
    level: number;
    worldLevel?: number;
    nameCardId: number;
    finishAchievementNum?: number;
    towerFloorIndex?: number;
    towerLevelIndex?: number;
    showAvatarInfoList?: ShowAvatarInfo[];
    showNameCardIdList?: number[];
    profilePicture?: ProfilePicture;
}

export interface ShowAvatarInfo {
    avatarId: number;
    level: number;
}

export interface ProfilePicture {
    id?: number;
    avatarId?: number;
}

export interface AvatarInfo {
    avatarId: number;
    propMap: { [key: string]: PropMapItem };
    fightPropMap: { [key: string]: number };
    skillDepotId: number;
    inherentProudSkillList?: number[];
    skillLevelMap?: { [key: string]: number };
    equipList: EquipItem[];
    fetterInfo?: { expLevel: number };
    talentIdList?: number[];
    proudSkillExtraLevelMap?: { [key: string]: number };
}

export interface PropMapItem {
    type: number;
    ival: string;
    val?: string;
}

export interface EquipItem {
    itemId: number;
    reliquary?: ReliquaryInfo;
    weapon?: WeaponInfo;
    flat: FlatInfo;
}

export interface ReliquaryInfo {
    level: number;
    mainPropId: number;
    appendPropIdList?: number[];
}

export interface WeaponInfo {
    level: number;
    promoteLevel?: number;
    affixMap?: { [key: string]: number };
}

export interface FlatInfo {
    nameTextMapHash: string;
    rankLevel: number;
    itemType: 'ITEM_RELIQUARY' | 'ITEM_WEAPON';
    icon: string;
    equipType?: 'EQUIP_BRACER' | 'EQUIP_NECKLACE' | 'EQUIP_SHOES' | 'EQUIP_RING' | 'EQUIP_DRESS';
    setNameTextMapHash?: string;
    reliquarySubstats?: ReliquarySubstat[];
    reliquaryMainstat?: ReliquaryMainstat;
    weaponStats?: WeaponStat[];
}

export interface ReliquarySubstat {
    appendPropId: string;
    statValue: number;
}

export interface ReliquaryMainstat {
    mainPropId: string;
    statValue: number;
}

export interface WeaponStat {
    appendPropId: string;
    statValue: number;
}
