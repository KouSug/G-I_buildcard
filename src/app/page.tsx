"use client";

import React, { useState } from "react";
import { BuildCard } from "@/components/BuildCard";
import { InputForm } from "@/components/InputForm";
import { BuildData } from "@/types";
import { toPng } from 'html-to-image';
import { Download, ChevronsRight, Settings2 } from "lucide-react";

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
    { slot: "flower", set: "", level: 0, rarity: 5, mainStat: { label: "HP", value: "0" }, subStats: [] },
    { slot: "plume", set: "", level: 0, rarity: 5, mainStat: { label: "ATK", value: "0" }, subStats: [] },
    { slot: "sands", set: "", level: 0, rarity: 5, mainStat: { label: "Main", value: "0" }, subStats: [] },
    { slot: "goblet", set: "", level: 0, rarity: 5, mainStat: { label: "Main", value: "0" }, subStats: [] },
    { slot: "circlet", set: "", level: 0, rarity: 5, mainStat: { label: "Main", value: "0" }, subStats: [] },
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
    <main className="min-h-screen p-4 flex flex-col items-center gap-8 relative overflow-x-hidden">
      <header className="w-full max-w-[1800px] flex justify-between items-center mb-8 relative z-10 pointer-events-none">
        <h1 className="text-3xl font-serif text-[#D4AF37] pointer-events-auto">Genshin Build Card Creator</h1>
        <div className="flex gap-4 pointer-events-auto">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-[#D4AF37] text-[#1C1C22] px-4 py-2 rounded font-bold hover:bg-[#E5C048] transition-colors"
          >
            <Download size={20} />
            Download Card
          </button>
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="flex items-center gap-2 bg-[#1C1C22] text-[#D4AF37] border border-[#3A3A45] px-4 py-2 rounded font-bold hover:bg-[#2A2A35] transition-colors"
            >
              <Settings2 size={20} />
              Edit
            </button>
          )}
        </div>
      </header>

      <div className="w-full h-full flex flex-1 relative">
        {/* Preview Area */}
        <div className={`flex-1 flex justify-center items-start transition-all duration-300 ${isSidebarOpen ? 'mr-[450px]' : ''}`}>
          <div className="sticky top-8">
            {/* Layout Container */}
            {/* Layout Container */}
            <div className={`
              relative
              transition-all duration-300
              ${isSidebarOpen
                ? 'w-[340px] h-[204px] sm:w-[520px] sm:h-[312px] md:w-[680px] md:h-[408px] lg:w-[760px] lg:h-[456px] xl:w-[800px] xl:h-[480px]'
                : 'w-[340px] h-[204px] sm:w-[520px] sm:h-[312px] md:w-[720px] md:h-[432px] lg:w-[900px] lg:h-[540px] xl:w-[1100px] xl:h-[660px]'
              }
            `}>
              {/* Scaled Content */}
              <div className={`
                absolute top-0 left-0 origin-top-left
                w-[800px] h-[480px]
                transition-all duration-300
                ${isSidebarOpen
                  ? 'scale-[0.425] sm:scale-65 md:scale-85 lg:scale-95 xl:scale-100'
                  : 'scale-[0.425] sm:scale-65 md:scale-90 lg:scale-[1.125] xl:scale-[1.375]'
                }
              `}>
                <BuildCard data={data} id="build-card" />
              </div>
            </div>
          </div>
        </div>

        {/* Edit Sidebar */}
        <div
          className={`
            fixed top-0 right-0 h-full w-[450px] bg-[#15151A] border-l border-[#3A3A45] shadow-2xl 
            transform transition-transform duration-300 z-50 overflow-y-auto
            ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}
          `}
        >
          <div className="p-4 relative">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-2"
              title="Close Sidebar"
            >
              <ChevronsRight size={24} />
            </button>
            <div className="mt-8">
              <InputForm data={data} onChange={setData} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
