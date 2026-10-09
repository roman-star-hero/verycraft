import React from 'react';

interface HelpControlsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpControls: React.FC<HelpControlsProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const keyBindings = [
    { key: 'W, A, S, D', desc: 'Движение игрока (вперед, влево, назад, вправо)' },
    { key: 'Мышь (Mouse)', desc: 'Обзор и прицеливание (кликните по экрану для захвата курсора)' },
    { key: 'Левая кнопка (ЛКМ)', desc: 'Ломать блок / Атаковать моба (удар рукой или инструментом)' },
    { key: 'Правая кнопка (ПКМ)', desc: 'Поставить блок / Открыть верстак или сундук / Поджечь TNT' },
    { key: 'ПРОБЕЛ (Space)', desc: 'Прыжок / Плыть вверх / Взлет (в режиме Creative)' },
    { key: 'Двойной ПРОБЕЛ', desc: 'Включить / выключить режим полета (в Creative)' },
    { key: 'SHIFT', desc: 'Присесть (красться) / Спуск вниз при полете' },
    { key: 'CTRL или 2x W', desc: 'Спринт (быстрый бег)' },
    { key: '1 - 9 или Колесико', desc: 'Выбор активного слота в панели быстрого доступа' },
    { key: 'E', desc: 'Открыть инвентарь / Каталог блоков / Рецепты крафта' },
    { key: 'F3', desc: 'Включить отладочный экран F3 (координаты XYZ, биом, FPS)' },
    { key: 'ESC', desc: 'Пауза / Главное меню / Настройки' },
  ];

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 backdrop-blur-xs select-none">
      <div className="mc-panel w-[500px] max-w-[95vw] p-5">
        <div className="flex items-center justify-between pb-2 border-b-2 border-[#888] mb-3">
          <span className="font-mc text-lg font-bold text-neutral-900">Управление и клавиатура</span>
          <button onClick={onClose} className="mc-button w-7 h-7 flex items-center justify-center font-pixel text-xs text-white">
            ✕
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto space-y-2 pr-1 mb-4">
          {keyBindings.map((b, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-[#b8b8b8] border border-[#666] rounded-xs">
              <span className="font-pixel text-[11px] text-amber-950 font-bold bg-[#ddd] px-2 py-1 border border-[#888]">
                {b.key}
              </span>
              <span className="font-mc text-sm text-neutral-800 text-right ml-3">{b.desc}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button onClick={onClose} className="mc-button px-5 py-2 font-mc text-base font-bold text-white">
            Понятно, в бой!
          </button>
        </div>
      </div>
    </div>
  );
};
