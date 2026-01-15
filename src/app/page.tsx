"use client";

import React, { useState } from "react";
import { BuildCard } from "@/components/BuildCard";
import { InputForm } from "@/components/InputForm";
import { BuildData } from "@/types";
import { toPng } from 'html-to-image';
import { Download } from "lucide-react";

const INITIAL_DATA: BuildData = {
  character: {
    name: "",
    level: 1,
    constellation: 0,
    element: "pyro",
    imageUrl: "",
    talents: {
      normal: { level: 1, boosted: false, icon: "" },
      skill: { level: 1, boosted: false, icon: "" },
      burst: { level: 1, boosted: false, icon: "" },
    },
  },
  weapon: {
    name: "",
    level: 1,
    refinement: 1,
    imageUrl: "",
  },
  artifacts: [
    { slot: "flower", set: "", level: 0, mainStat: { label: "HP", value: "0" }, subStats: [] },
    { slot: "plume", set: "", level: 0, mainStat: { label: "ATK", value: "0" }, subStats: [] },
    { slot: "sands", set: "", level: 0, mainStat: { label: "Main", value: "0" }, subStats: [] },
    { slot: "goblet", set: "", level: 0, mainStat: { label: "Main", value: "0" }, subStats: [] },
    { slot: "circlet", set: "", level: 0, mainStat: { label: "Main", value: "0" }, subStats: [] },
  ],
  stats: {
    hp: 0,
    atk: 0,
    def: 0,
    em: 0,
    cr: 0,
    cd: 0,
    er: 0,
    dmgBonus: 0,
  },
};

export default function Home() {
  const [data, setData] = useState<BuildData>(INITIAL_DATA);

  const handleDownload = async () => {
    const element = document.getElementById("build-card");
    if (element) {
      try {
        const dataUrl = await toPng(element, { cacheBust: true, pixelRatio: 2 });
        const link = document.createElement("a");
        link.download = `${data.character.name}-build.png`;
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Failed to generate image', err);
      }
    }
  };

  return (
    <main className="min-h-screen p-4 flex flex-col items-center gap-8">
      <header className="w-full max-w-[1800px] flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif text-[#D4AF37]">Genshin Build Card Creator</h1>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 bg-[#D4AF37] text-[#1C1C22] px-4 py-2 rounded font-bold hover:bg-[#E5C048] transition-colors"
        >
          <Download size={20} />
          Download Card
        </button>
      </header>

      <div className="w-full max-w-[1800px] grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* Preview Area */}
        <div className="flex justify-center xl:sticky xl:top-8">
          {/* Layout Container - reserves space matching the scaled size */}
          <div className="
            relative
            w-[340px] h-[192px]
            sm:w-[520px] sm:h-[293px]
            md:w-[680px] md:h-[383px]
            lg:w-[720px] lg:h-[405px]
            xl:w-[560px] xl:h-[315px]
            2xl:w-[720px] 2xl:h-[405px]
            transition-all duration-300
          ">
            {/* Scaled Content */}
            <div className="
              absolute top-0 left-0 origin-top-left
              w-[800px] h-[480px]
              scale-[0.425]
              sm:scale-65
              md:scale-85
              lg:scale-90
              xl:scale-70
              2xl:scale-90
            ">
              <BuildCard data={data} id="build-card" />
            </div>
          </div>
        </div>

        {/* Edit Area */}
        <div className="w-full">
          <InputForm data={data} onChange={setData} />
        </div>
      </div>
    </main>
  );
}
