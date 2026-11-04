import React, { useState } from 'react';
import { EasterEggId } from '../types/horror';
import { EASTER_EGGS, TOTAL_EASTER_EGGS } from '../data/easterEggs';
import { soundEngine } from '../utils/soundEngine';
import { X, Eye, Lock, CheckCircle2, Sparkles, MapPin } from 'lucide-react';

interface SecretsModalProps {
  isOpen: boolean;
  discoveredEggs: EasterEggId[];
  onDiscoverEgg: (id: EasterEggId) => void;
  onClose: () => void;
}

export const SecretsModal: React.FC<SecretsModalProps> = ({
  isOpen,
  discoveredEggs,
  onDiscoverEgg,
  onClose,
}) => {
  const [rockPhilosophize, setRockPhilosophize] = useState(false);

  if (!isOpen) return null;

  const handleRockInteract = () => {
    setRockPhilosophize((prev) => !prev);
    soundEngine.playEeaaoRocksChime();
    onDiscoverEgg('eeaao_rocks');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#0b060a] border-2 border-amber-700/80 shadow-[0_0_80px_rgba(245,158,11,0.35)] overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#16070d] border-b border-amber-900/60">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400" />
            <h2 className="font-pixel text-[10px] sm:text-xs text-amber-200 tracking-wider uppercase">
              EASTER EGGS DO GRAND CINE OLHINHOS ({discoveredEggs.length}/{TOTAL_EASTER_EGGS})
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-white bg-red-950/50 border border-red-800/50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SECRETS JOURNAL */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <p className="font-serif-horror italic text-sm sm:text-base text-zinc-300 border-b border-amber-950/70 pb-3">
            O foyer do Grand Cine Olhinhos guarda 9 referências interativas dos filmes mais amados de vocês! Caminhe pelo corredor ou clique nos objetos do cenário para despertá-las.
          </p>

          {/* Interactive EEAAO Rocks Inspection */}
          <div
            onClick={handleRockInteract}
            onMouseEnter={() => setRockPhilosophize(true)}
            onMouseLeave={() => setRockPhilosophize(false)}
            className="p-4 bg-[#12070d] border border-amber-800/60 flex items-center gap-4 cursor-pointer hover:border-amber-400 transition"
          >
            <div className="w-16 h-20 border-2 border-amber-700/70 bg-black flex flex-col items-center justify-center shrink-0 relative overflow-hidden">
              <Sparkles
                className={`w-9 h-9 transition-all ${
                  rockPhilosophize
                    ? 'text-amber-300 scale-125 animate-pulse'
                    : 'text-zinc-500'
                }`}
              />
            </div>
            <div className="space-y-1">
              <div className="font-pixel text-[9px] text-amber-300 uppercase">
                Pedestal do Multiverso: As Duas Pedras (Clique para contemplar)
              </div>
              <p className="font-serif-horror text-sm text-zinc-300">
                {rockPhilosophize
                  ? 'Silêncio absoluto no cânion... Dois olhinhos plásticos (googly eyes) brilham nas rochas e a legenda aparece: "Just be a rock. Ha ha ha!"'
                  : 'Duas pedras silenciosas repousam sobre uma redoma no foyer do cinema. Parece um universo onde não existem impostos...'}
              </p>
            </div>
          </div>

          {/* List of All 9 Contextual Cinema Easter Eggs */}
          <div className="space-y-2.5">
            {(Object.keys(EASTER_EGGS) as EasterEggId[]).map((id) => {
              const egg = EASTER_EGGS[id];
              const isFound = discoveredEggs.includes(id);
              return (
                <div
                  key={id}
                  className={`p-3.5 border transition ${
                    isFound
                      ? 'bg-[#14080e] border-amber-700/70'
                      : 'bg-[#080508] border-zinc-800/80 opacity-75'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isFound ? (
                        <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-zinc-500 shrink-0" />
                      )}
                      <span className="font-pixel text-[9px] sm:text-[10px] text-zinc-100 uppercase">
                        {isFound ? egg.title : 'Easter Egg Oculto no Cinema'}
                      </span>
                    </div>
                    <span className="font-vt text-xs text-amber-400/90 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-amber-500" />
                      {egg.location}
                    </span>
                  </div>

                  <p className="mt-1.5 font-serif-horror text-sm text-zinc-300 pl-6">
                    {isFound ? egg.discoveryText : `Pista: ${egg.hint}`}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
