import React, { useState } from 'react';
import { EasterEggId } from '../types/horror';
import { EASTER_EGGS, TOTAL_EASTER_EGGS } from '../data/easterEggs';
import { soundEngine } from '../utils/soundEngine';
import { X, Eye, Lock, CheckCircle2, Skull, MapPin } from 'lucide-react';

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
  const [portraitStare, setPortraitStare] = useState(false);

  if (!isOpen) return null;

  const handlePortraitInteract = () => {
    setPortraitStare((prev) => !prev);
    soundEngine.playVhsStatic(0.25, 0.18);
    onDiscoverEgg('cursed_portrait');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#0b060a] border-2 border-red-800/80 shadow-[0_0_80px_rgba(153,27,27,0.5)] overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#16070d] border-b border-red-900/60">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-red-500" />
            <h2 className="font-pixel text-[10px] sm:text-xs text-red-200 tracking-wider uppercase">
              MISTÉRIOS &amp; APARIÇÕES DO CORREDOR ({discoveredEggs.length}/{TOTAL_EASTER_EGGS})
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
          <p className="font-serif-horror italic text-sm sm:text-base text-zinc-300 border-b border-red-950/70 pb-3">
            A mansão esconde presenças nas janelas, espelhos, portas entreabertas e frestas do assoalho. Caminhe pelo corredor ou interaja com o cenário para despertá-las.
          </p>

          {/* Interactive Portrait Inspection */}
          <div
            onClick={handlePortraitInteract}
            onMouseEnter={() => setPortraitStare(true)}
            onMouseLeave={() => setPortraitStare(false)}
            className="p-4 bg-[#12070d] border border-red-900/60 flex items-center gap-4 cursor-pointer hover:border-red-500 transition"
          >
            <div className="w-16 h-20 border-2 border-amber-700/70 bg-black flex flex-col items-center justify-center shrink-0 relative overflow-hidden">
              <Skull
                className={`w-9 h-9 transition-all ${
                  portraitStare
                    ? 'text-yellow-400 scale-125 animate-pulse'
                    : 'text-zinc-600'
                }`}
              />
            </div>
            <div className="space-y-1">
              <div className="font-pixel text-[9px] text-amber-300 uppercase">
                O Retrato que Observa a Galeria (Clique para inspecionar)
              </div>
              <p className="font-serif-horror text-sm text-zinc-300">
                {portraitStare
                  ? 'A pintura escurece e revela dois olhos amarelos penetrantes sob um véu negro encarando vocês dois!'
                  : 'Um retrato antigo pendurado sobre o candelabro. Algo parece se mexer atrás da tinta a óleo...'}
              </p>
            </div>
          </div>

          {/* List of All 9 Contextual Mansion Secrets */}
          <div className="space-y-2.5">
            {(Object.keys(EASTER_EGGS) as EasterEggId[]).map((id) => {
              const egg = EASTER_EGGS[id];
              const isFound = discoveredEggs.includes(id);
              return (
                <div
                  key={id}
                  className={`p-3.5 border transition ${
                    isFound
                      ? 'bg-[#14080e] border-red-800/70'
                      : 'bg-[#080508] border-zinc-800/80 opacity-75'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isFound ? (
                        <CheckCircle2 className="w-4 h-4 text-red-500 shrink-0" />
                      ) : (
                        <Lock className="w-4 h-4 text-zinc-500 shrink-0" />
                      )}
                      <span className="font-pixel text-[9px] sm:text-[10px] text-zinc-100 uppercase">
                        {isFound ? egg.title : 'Mistério Oculto na Mansão'}
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
