"use client";

import React from "react";
import { BuildData } from "@/types";
import { Sword, Shield, Heart, Zap, Star, Sparkles } from "lucide-react";
import { calculateArtifactScore, getArtifactRank, getTotalScoreRank } from "@/utils/score";

interface BuildCardProps {
    data: BuildData;
    id?: string;
}

export const BuildCard: React.FC<BuildCardProps> = ({ data, id }) => {
    const { character, weapon, artifacts, stats } = data;

    // Calculate artifact set counts
    const setCounts: { [key: string]: number } = {};
    artifacts.forEach(artifact => {
        if (artifact.set) {
            setCounts[artifact.set] = (setCounts[artifact.set] || 0) + 1;
        }
    });

    // Filter active sets (2 or more pieces)
    const activeSets = Object.entries(setCounts)
        .filter(([_, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1]); // Sort by count descending

    const elementColors: { [key: string]: string } = {
        'pyro': 'from-[#661a1a] to-[#381010]', // Red/Fire (Medium)
        'hydro': 'from-[#1c326b] to-[#192040]', // Blue/Water (Medium)
        'anemo': 'from-[#16544a] to-[#0f2a2a]', // Teal/Wind (Medium)
        'electro': 'from-[#491b69] to-[#321047]', // Purple/Electric (Medium)
        'dendro': 'from-[#174e24] to-[#102918]', // Green/Nature (Medium)
        'cryo': 'from-[#184c60] to-[#112b40]', // Ice Blue (Medium)
        'geo': 'from-[#5e3c16] to-[#382010]', // Yellow/Earth (Medium)
    };

    const elementBackgrounds: { [key: string]: string } = {
        'pyro': '/bgImg/bg_Pyro.png',
        'hydro': '/bgImg/bg_Hydro.png',
        'anemo': '/bgImg/bg_Anemo.png',
        'electro': '/bgImg/bg_Electro.png',
        'dendro': '/bgImg/bg_Dendro.png',
        'cryo': '/bgImg/bg_Cryo.png',
        'geo': '/bgImg/bg_Geo.png',
    };

    const bgGradient = elementColors[character.element] || 'from-[#1C1C22] to-[#2A2A35]';
    const backgroundImage = elementBackgrounds[character.element];

    const getWeaponRarityColor = (rarity: number = 0) => {
        switch (rarity) {
            case 1: return '#757575'; // Gray
            case 2: return '#6ab48e'; // Green
            case 3: return '#5aa5c8'; // Blue
            case 4: return '#9d78b8'; // Purple
            case 5: return '#cfaa52'; // Gold
            default: return '#25252D'; // Default Dark
        }
    };

    const getScoreBaseLabel = (base: string = 'atk') => {
        switch (base) {
            case 'hp': return 'HP換算';
            case 'def': return '防御力換算';
            case 'er': return '元チャ効率換算';
            case 'atk': default: return '攻撃力換算';
        }
    };



    return (
        <div
            id={id}
            className={`w-[800px] h-[450px] bg-gradient-to-br ${bgGradient} text-[#ECE5D8] p-4 relative overflow-hidden shadow-2xl border border-[#4A4A55] rounded-lg font-[family-name:var(--font-noto-sans)] flex flex-col`}
            style={backgroundImage ? {
                backgroundImage: `url(${backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            } : {}}
        >
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[rgba(234,179,8,0.2)] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[rgba(59,130,246,0.1)] rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="flex flex-col w-full h-full gap-1.5 relative z-10">
                {/* Top Section: Character, Stats, Weapon */}
                <div className="flex w-full h-[60%]">
                    {/* Left: Character Image & Basic Info */}
                    <div className="relative flex-grow h-full overflow-hidden group rounded-lg">
                        {/* Placeholder for Character Image */}
                        {character.imageUrl ? (
                            <div
                                className="w-full h-full bg-cover bg-center"
                                style={{ backgroundImage: `url(${character.imageUrl})` }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#6b7280] flex-col gap-2">
                                <Sparkles className="w-10 h-10 opacity-20" />
                                <span className="text-sm opacity-50">No Image</span>
                            </div>
                        )}

                        <div className="absolute top-0 left-0 w-full p-3 drop-shadow-md">
                            <h2 className="text-xl font-bold font-[family-name:var(--font-noto-sans)] text-white">{character.name}</h2>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="text-white font-bold">Lv.<span className="font-[family-name:var(--font-inter)]">{character.level}</span></span>
                            </div>
                        </div>

                        <div className="absolute bottom-2 left-2 flex flex-col gap-1 drop-shadow-md">
                            <TalentDisplay talent={character.talents.normal} />
                            <TalentDisplay talent={character.talents.skill} />
                            <TalentDisplay talent={character.talents.burst} />
                        </div>

                        <div className="absolute bottom-2 right-2 flex flex-col gap-1 drop-shadow-md">
                            {character.constellationIcons?.map((icon, idx) => (
                                <div
                                    key={idx}
                                    className={`w-8 h-8 rounded-full border flex items-center justify-center overflow-hidden p-0.5 transition-all ${idx < character.constellation ? "bg-[#eab308]/20 border-[#eab308] opacity-100" : "bg-[#15151A]/60 border-[#3A3A45]/50 opacity-40 grayscale"
                                        }`}
                                >
                                    {icon && <img src={icon} className="w-full h-full object-cover rounded-full" crossOrigin="anonymous" />}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Center: Stats */}
                    <div className="w-[28%] h-full bg-[#15151A]/60 rounded-lg p-3 border border-[#3A3A45]/50 flex flex-col gap-2 overflow-hidden">
                        <StatRow icon={<Heart size={14} className="text-[#f87171]" />} label="最大HP" value={stats.hp} />
                        <StatRow icon={<Sword size={14} className="text-[#fb923c]" />} label="攻撃力" value={stats.atk} />
                        <StatRow icon={<Shield size={14} className="text-[#60a5fa]" />} label="防御力" value={stats.def} />
                        <StatRow icon={<Zap size={14} className="text-[#c084fc]" />} label="元素熟知" value={stats.em} />

                        <StatRow icon={<Star size={14} className="text-[#facc15]" />} label="会心率" value={`${stats.cr}%`} />
                        <StatRow icon={<Star size={14} className="text-[#facc15]" />} label="会心ダメージ" value={`${stats.cd}%`} />
                        <StatRow icon={<Zap size={14} className="text-[#22d3ee]" />} label="元チャ効率" value={`${stats.er}%`} />
                        <StatRow icon={<Sparkles size={14} className="text-[#e879f9]" />} label="ダメージバフ" value={`${stats.dmgBonus}%`} />
                    </div>

                    {/* Right: Weapon & Score */}
                    <div className="w-[28%] h-full flex flex-col gap-2 ml-4">
                        {/* Weapon Card */}
                        <div className="h-[45%] bg-[#15151A]/60 rounded-lg border border-[#3A3A45]/50 p-3 flex items-center gap-3 relative">
                            <div
                                className="w-16 h-16 rounded border border-[#3A3A45] flex-shrink-0 overflow-hidden relative"
                                style={{ backgroundColor: getWeaponRarityColor(weapon.rarity || 0) }}
                            >
                                {weapon.imageUrl ? (
                                    <div
                                        className="w-full h-full bg-cover bg-center"
                                        style={{ backgroundImage: `url(${weapon.imageUrl})` }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Sword className="w-6 h-6 text-[#4b5563]" />
                                    </div>
                                )}
                                <div className="absolute top-0 left-0 bg-[#15151A]/80 px-1 rounded-br text-[10px] text-[#eab308] font-bold border-r border-b border-[#3A3A45]/50">
                                    R<span className="font-[family-name:var(--font-inter)]">{weapon.refinement}</span>
                                </div>
                                <div className="absolute bottom-0 w-full flex justify-center pb-0.5">
                                    {Array.from({ length: weapon.rarity || 0 }).map((_, i) => (
                                        <Star key={i} size={10} className="text-[#facc15] fill-[#facc15]" />
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col justify-center min-w-0 flex-grow gap-0.5">
                                <h3 className="font-bold text-sm truncate leading-normal text-left text-white">{weapon.name}</h3>
                                <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
                                    <span>Lv.<span className="font-[family-name:var(--font-inter)] text-white">{weapon.level}</span></span>
                                </div>
                                {(weapon.mainStat || weapon.subStat) && (
                                    <div className="flex flex-col gap-0.5 mt-0.5">
                                        {weapon.mainStat && (
                                            <div className="flex justify-between items-center text-[10px] bg-[#15151A]/40 px-1 rounded">
                                                <span className="text-white">{weapon.mainStat.label}</span>
                                                <span className="text-white font-[family-name:var(--font-inter)]">{weapon.mainStat.value}</span>
                                            </div>
                                        )}
                                        {weapon.subStat && (
                                            <div className="flex justify-between items-center text-[10px] bg-[#15151A]/40 px-1 rounded">
                                                <span className="text-white">{weapon.subStat.label}</span>
                                                <span className="text-white font-[family-name:var(--font-inter)]">{weapon.subStat.value}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Artifact Sets */}
                        <div className="flex-grow bg-[#15151A]/60 rounded-lg border border-[#3A3A45]/50 flex flex-col items-center justify-center gap-1 p-2">
                            {activeSets.length > 0 ? (
                                activeSets.map(([setName, count], idx) => (
                                    <div key={idx} className="text-[#9ca3af] text-xs font-bold font-[family-name:var(--font-sawarabi)]">
                                        {setName} <span className="text-[#eab308] font-[family-name:var(--font-inter)]">({count})</span>
                                    </div>
                                ))
                            ) : (
                                <span className="text-[#9ca3af] text-xs opacity-50">No Set Bonus</span>
                            )}
                        </div>

                        {/* Total Score */}
                        <div className="h-[30%] bg-[#15151A]/60 rounded-lg border border-[#3A3A45]/50 flex flex-col items-center justify-center gap-1">
                            <span className="text-xs text-[#9ca3af]">Total Score</span>
                            {(() => {
                                const totalScore = artifacts.reduce((acc, artifact) => acc + calculateArtifactScore(artifact, data.scoreBase), 0);
                                const rank = getTotalScoreRank(totalScore);
                                return (
                                    <div className="flex items-center gap-3 -mt-1">
                                        <span className="text-3xl font-bold text-[#eab308] font-[family-name:var(--font-inter)]">
                                            {totalScore.toFixed(1)}
                                        </span>
                                        <div className="h-10 w-auto flex items-center justify-center">
                                            <img
                                                src={`/rankImg/${rank.label}.png`}
                                                alt={rank.label}
                                                className="h-full w-auto object-contain"
                                                crossOrigin="anonymous"
                                            />
                                        </div>
                                    </div>
                                );
                            })()}
                            <span className="text-xs text-[#d1d5db] -mt-2 font-[family-name:var(--font-sawarabi)]">
                                {getScoreBaseLabel(data.scoreBase)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Artifacts */}
                <div className="grid grid-cols-5 gap-2 w-full h-[38%]">
                    {artifacts.map((artifact, idx) => {
                        const score = calculateArtifactScore(artifact, data.scoreBase);
                        const rank = getArtifactRank(score, artifact.slot);
                        return (
                            <div key={idx} className="bg-[#15151A]/30 rounded border border-[#3A3A45]/50 p-2 flex flex-col gap-1 relative group min-h-0">
                                {/* Icon Background */}
                                <div className="absolute top-[-10%] left-[-10%] w-24 h-24 scale-90 opacity-70 pointer-events-none z-0">
                                    {artifact.imageUrl ? (
                                        <div
                                            className="w-full h-full bg-cover bg-center"
                                            style={{ backgroundImage: `url(${artifact.imageUrl})` }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="text-4xl text-[#6b7280] font-bold">{artifact.slot[0].toUpperCase()}</span>
                                        </div>
                                    )}
                                </div>
                                {/* Header: Main Stat */}
                                <div className="flex items-center justify-end border-b border-[#3A3A45]/50 pb-1 mb-0.5 relative z-10">
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs font-bold text-[#D4AF37] truncate leading-tight font-[family-name:var(--font-sawarabi)]">{artifact.mainStat.label}</span>
                                        <span className="text-[20px] font-bold leading-none font-[family-name:var(--font-inter)]">{artifact.mainStat.value}</span>
                                    </div>
                                </div>

                                {/* Score & Rank */}
                                <div className="flex items-center justify-between bg-[#15151A]/40 rounded px-1.5 py-0.5 mb-1 relative z-10">
                                    <div className="h-6 w-auto flex items-center justify-center mt-0.5">
                                        <img
                                            src={`/rankImg/${rank.label}.png`}
                                            alt={rank.label}
                                            className="h-full w-auto object-contain"
                                            crossOrigin="anonymous"
                                        />
                                    </div>
                                    <span className="text-base text-[#eab308] font-[family-name:var(--font-inter)] font-bold">
                                        {score.toFixed(1)}
                                    </span>
                                </div>

                                {/* Sub Stats */}
                                <div className="flex flex-col gap-0.5 text-[10.5px] leading-tight flex-grow justify-center relative z-10">
                                    {artifact.subStats.map((sub, sIdx) => {
                                        let isHighlight = false;
                                        const scoreBase = data.scoreBase || 'atk';

                                        if (sub.label === '会心率' || sub.label === '会心ダメージ') {
                                            isHighlight = true;
                                        } else {
                                            switch (scoreBase) {
                                                case 'atk':
                                                    if (sub.label === '攻撃力%') isHighlight = true;
                                                    break;
                                                case 'hp':
                                                    if (sub.label === 'HP%') isHighlight = true;
                                                    break;
                                                case 'def':
                                                    if (sub.label === '防御力%') isHighlight = true;
                                                    break;
                                                case 'er':
                                                    if (sub.label === '元素チャージ効率') isHighlight = true;
                                                    break;
                                            }
                                        }

                                        return (
                                            <div key={sIdx} className={`flex justify-between ${isHighlight ? "text-[#ECE5D8]" : "text-[#d1d5db]"} font-bold font-[family-name:var(--font-sawarabi)]`}>
                                                <span>{sub.label === '元素チャージ効率' ? '元チャ効率' : sub.label}</span>
                                                <span className="font-[family-name:var(--font-inter)]">+{sub.value}</span>
                                            </div>
                                        );
                                    })}
                                </div>


                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const StatRow = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
    <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-[#d1d5db]">
            {icon}
            <span className="font-bold font-[family-name:var(--font-sawarabi)]">{label}</span>
        </div>
        <span className="font-[family-name:var(--font-inter)] font-bold">{value}</span>
    </div>
);

const TalentDisplay = ({ talent }: { talent: { level: number, boosted: boolean, icon: string } }) => (
    <div className="flex flex-col items-center gap-0.5">
        <div className="w-7 h-7 rounded-full bg-[#15151A]/80 border border-[#3A3A45]/50 flex items-center justify-center overflow-hidden p-1">
            {talent.icon && <img src={talent.icon} className="w-full h-full object-cover rounded-full" crossOrigin="anonymous" />}
        </div>
        <span className={`text-[9px] font-bold font-[family-name:var(--font-inter)] ${talent.boosted ? "text-[#22d3ee]" : "text-white"}`}>
            Lv.{talent.level}
        </span>
    </div>
);
