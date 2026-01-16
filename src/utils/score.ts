import { Artifact } from "@/types";

export const calculateArtifactScore = (artifact: Artifact, baseStat: 'atk' | 'hp' | 'def' | 'er' = 'atk'): number => {
    let score = 0;

    artifact.subStats.forEach(sub => {
        const value = parseFloat(sub.value.replace('%', ''));
        if (isNaN(value)) return;

        // Crit Rate * 2
        if (sub.label === '会心率') {
            score += value * 2;
        }
        // Crit DMG
        else if (sub.label === '会心ダメージ') {
            score += value;
        }
        // Base Stat
        else {
            switch (baseStat) {
                case 'atk':
                    if (sub.label === '攻撃力%') score += value;
                    break;
                case 'hp':
                    if (sub.label === 'HP%') score += value;
                    break;
                case 'def':
                    if (sub.label === '防御力%') score += value;
                    break;
                case 'er':
                    if (sub.label === '元素チャージ効率') score += value;
                    break;
            }
        }
    });

    return parseFloat(score.toFixed(1));
};

export const getArtifactRank = (score: number, slot: string): { label: string, color: string } => {
    const isFlowerOrPlume = slot === '生の花' || slot === '死の羽';

    if (isFlowerOrPlume) {
        if (score >= 50) return { label: 'SS', color: '#ff4d4d' };
        if (score >= 45) return { label: 'S', color: '#ff8c1a' };
        if (score >= 40) return { label: 'A', color: '#e6e600' };
        return { label: 'B', color: '#999999' };
    } else {
        if (score >= 45) return { label: 'SS', color: '#ff4d4d' };
        if (score >= 40) return { label: 'S', color: '#ff8c1a' };
        if (score >= 30) return { label: 'A', color: '#e6e600' };
        return { label: 'B', color: '#999999' };
    }
};

export const getTotalScoreRank = (totalScore: number): { label: string, color: string } => {
    if (totalScore >= 220) return { label: 'SS', color: '#ff4d4d' };
    if (totalScore >= 200) return { label: 'S', color: '#ff8c1a' };
    if (totalScore >= 180) return { label: 'A', color: '#e6e600' };
    return { label: 'B', color: '#999999' };
};
