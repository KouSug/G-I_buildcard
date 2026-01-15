export const statMap: { [key: string]: string } = {
    'FIGHT_PROP_HP': 'HP',
    'FIGHT_PROP_HP_PERCENT': 'HP%',
    'FIGHT_PROP_ATTACK': '攻撃力',
    'FIGHT_PROP_BASE_ATTACK': '基礎攻撃力',
    'FIGHT_PROP_ATTACK_PERCENT': '攻撃力%',
    'FIGHT_PROP_DEFENSE': '防御力',
    'FIGHT_PROP_DEFENSE_PERCENT': '防御力%',
    'FIGHT_PROP_CRITICAL': '会心率',
    'FIGHT_PROP_CRITICAL_HURT': '会心ダメージ',
    'FIGHT_PROP_CHARGE_EFFICIENCY': '元素チャージ効率',
    'FIGHT_PROP_ELEMENT_MASTERY': '元素熟知',
    'FIGHT_PROP_PHYSICAL_ADD_HURT': '物理ダメージ',
    'FIGHT_PROP_FIRE_ADD_HURT': '炎元素ダメージ',
    'FIGHT_PROP_ELEC_ADD_HURT': '雷元素ダメージ',
    'FIGHT_PROP_WATER_ADD_HURT': '水元素ダメージ',
    'FIGHT_PROP_GRASS_ADD_HURT': '草元素ダメージ',
    'FIGHT_PROP_WIND_ADD_HURT': '風元素ダメージ',
    'FIGHT_PROP_ROCK_ADD_HURT': '岩元素ダメージ',
    'FIGHT_PROP_ICE_ADD_HURT': '氷元素ダメージ',
    'FIGHT_PROP_HEAL_ADD': '与える治癒効果',
};

export const isPercentStat = (propId: string): boolean => {
    return propId.endsWith('_PERCENT') ||
        propId === 'FIGHT_PROP_CRITICAL' ||
        propId === 'FIGHT_PROP_CRITICAL_HURT' ||
        propId === 'FIGHT_PROP_CHARGE_EFFICIENCY' ||
        propId.includes('_ADD_HURT') ||
        propId === 'FIGHT_PROP_HEAL_ADD';
};

export const formatStatValue = (propId: string, value: number): string => {
    if (isPercentStat(propId)) {
        // Enka sometimes returns 0.466 for 46.6%, sometimes 46.6.
        // Usually in `flat` data it is already scaled?
        // Let's assume if it's < 2 it might be raw ratio, but for main stats like 46.6 it's clear.
        // Actually, looking at Enka docs/examples, `flat.reliquaryMainstat.statValue` is usually the displayed value (e.g. 46.6).
        // But let's just append % for now.
        // We might need to round it.
        return `${Number(value).toFixed(1)}%`;
    }
    return String(Math.round(value));
};
