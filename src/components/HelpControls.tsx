import React from 'react';

interface HelpControlsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpControls: React.FC<HelpControlsProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-xs select-none">
      <div className="mc-panel w-[560px] max-w-[95vw] p-5">
        <div className="flex items-center justify-between pb-2 border-b-2 border-[#888] mb-3">
          <span className="font-pixel text-sm text-yellow-300 drop-shadow-xs">Справка по управлению и строительству</span>
          <button onClick={onClose} className="mc-button w-7 h-7 flex items-center justify-center font-pixel text-xs text-white">
            ✕
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto space-y-3.5 pr-1.5 text-neutral-900">
          {/* Highlighted Banner: HOW TO PLACE BLOCKS */}
          <div className="p-3 bg-amber-100/90 border-2 border-amber-600 rounded-xs shadow-xs space-y-1.5">
            <h3 className="font-pixel text-xs text-amber-950 font-bold flex items-center gap-1.5">
              <span>🧱</span> КАК СТАВИТЬ БЛОКИ (Строительство):
            </h3>
            <ol className="font-mc text-sm text-neutral-900 space-y-1 list-decimal list-inside leading-snug">
              <li>
                <strong>Выберите блок:</strong> нажмите клавиши <span className="font-pixel text-[10px] bg-white px-1.5 py-0.5 border border-amber-500">1</span>–<span className="font-pixel text-[10px] bg-white px-1.5 py-0.5 border border-amber-500">9</span> или прокрутите колёсико мыши.
              </li>
              <li>
                <strong>Наведите прицел:</strong> направьте центральный крестик на ту грань блока, к которой хотите пристроить новый.
              </li>
              <li>
                <strong>Нажмите ПКМ (Правую кнопку мыши):</strong> блок мгновенно появится на выбранной грани!
              </li>
            </ol>
            <p className="font-mc text-xs text-amber-900/90 italic pt-0.5 border-t border-amber-300/80">
              💡 <em>Если играете на тачпаде ноутбука: правый клик выполняется нажатием двумя пальцами.</em>
            </p>
          </div>

          {/* HOW TO MINE BLOCKS */}
          <div className="p-3 bg-blue-50/90 border-2 border-blue-400 rounded-xs shadow-xs space-y-1.5">
            <h3 className="font-pixel text-xs text-blue-950 font-bold flex items-center gap-1.5">
              <span>⛏</span> КАК ДОБЫВАТЬ И ЛОМАТЬ БЛОКИ:
            </h3>
            <p className="font-mc text-sm text-neutral-800 leading-snug">
              Наведите прицел на блок и нажмите <strong>ЛКМ (Левую кнопку мыши)</strong>. В режиме выживания удерживайте ЛКМ до появления трещин, пока блок не разрушится и не выпадет как предмет.
            </p>
          </div>

          {/* Full Keybindings Table */}
          <div>
            <h4 className="font-pixel text-xs text-neutral-800 mb-2 font-bold">Все клавиши управления:</h4>
            <div className="space-y-1.5">
              {[
                { key: 'Правая кнопка (ПКМ)', desc: 'Поставить блок / Открыть верстак или сундук / Поджечь TNT' },
                { key: 'Левая кнопка (ЛКМ)', desc: 'Ломать блок / Атаковать моба (рукой или мечом)' },
                { key: '1 - 9 / Колёсико', desc: 'Выбор активного предмета / блока в хотбаре' },
                { key: 'W, A, S, D', desc: 'Перемещение персонажа' },
                { key: 'ПРОБЕЛ (Space)', desc: 'Прыжок / Плавание вверх / Взлет (в Creative)' },
                { key: '2x ПРОБЕЛ', desc: 'Включить или выключить режим полета (в Creative)' },
                { key: 'SHIFT', desc: 'Красться (присесть) / Опускаться вниз при полете' },
                { key: 'CTRL или 2x W', desc: 'Спринт (быстрый бег)' },
                { key: 'E', desc: 'Открыть инвентарь / Каталог блоков / Рецепты крафта' },
                { key: 'H', desc: 'Быстро открыть эту справку по управлению' },
                { key: 'F3', desc: 'Экран отладки (координаты XYZ, биом, FPS)' },
                { key: 'ESC', desc: 'Пауза / Главное меню / Настройки графики и звука' },
              ].map((b, i) => (
                <div key={i} className="flex items-center justify-between p-1.5 bg-[#b8b8b8] border border-[#777] rounded-xs">
                  <span className="font-pixel text-[10px] text-amber-950 font-bold bg-[#eaeaea] px-2 py-0.5 border border-[#888] shrink-0">
                    {b.key}
                  </span>
                  <span className="font-mc text-sm text-neutral-900 text-right ml-2">{b.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-[#888] mt-3">
          <button onClick={onClose} className="mc-button px-6 py-2 font-mc text-base font-bold text-white shadow-md">
            Вернуться к игре
          </button>
        </div>
      </div>
    </div>
  );
};
